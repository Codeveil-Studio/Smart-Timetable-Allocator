using Microsoft.EntityFrameworkCore;
using SmartScheduleBackend.Data;
using SmartScheduleBackend.Models;

namespace SmartScheduleBackend.Services
{
    public class TimetableService
    {
        private readonly AppDbContext _context;

        public TimetableService(AppDbContext context)
        {
            _context = context;
        }

        public async Task EnsureTimeSlots()
        {
            if (await _context.TimeSlots.AnyAsync()) return;

            var days = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
            var slots = new List<TimeSlot>();
            var startTime = new TimeSpan(8, 30, 0);

            for (int i = 0; i < 9; i++) // 9 slots from 8:30 to 5:30 (17:30)
            {
                var end = startTime.Add(TimeSpan.FromHours(1));
                foreach (var day in days)
                {
                    slots.Add(new TimeSlot { Day = day, StartTime = startTime, EndTime = end });
                }
                startTime = end;
            }

            _context.TimeSlots.AddRange(slots);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> GenerateTimetable(GenerateRequest request, bool isRegeneration = false)
        {
            await EnsureTimeSlots();

            // 1. Get or Create Academic Class
            var academicClass = await _context.AcademicClasses.FirstOrDefaultAsync(a => a.Name == request.ClassName);
            
            // CHECK IF TIMETABLE EXISTS
            if (!isRegeneration && academicClass != null)
            {
                var exists = await _context.Timetables.AnyAsync(t => t.AcademicClassId == academicClass.Id);
                if (exists)
                {
                    throw new InvalidOperationException($"Timetable already exists for class '{request.ClassName}'. Visit View Timetable. You can first delete from there to continue.");
                }
            }

            if (academicClass == null)
            {
                academicClass = new AcademicClass { Name = request.ClassName };
                _context.AcademicClasses.Add(academicClass);
                await _context.SaveChangesAsync();
            }

            // HANDLE OFF DAYS PERSISTENCE
            // If this is a fresh generation (not just a regeneration of an existing one logic-wise, 
            // but the user clicked "Generate"), we update the off-days for the class.
            // If isRegeneration=true, we DON'T update off-days from request (request might have empty offdays anyway),
            // instead we should have loaded them before calling this.
            // Actually, for GenerateTimetable, if !isRegeneration, we should save the off-days.
            
            if (!isRegeneration)
            {
                // Remove existing off-days for this class
                var existingOffDays = await _context.ClassOffDays
                    .Where(d => d.AcademicClassId == academicClass.Id)
                    .ToListAsync();
                _context.ClassOffDays.RemoveRange(existingOffDays);

                // Add new off-days
                if (request.OffDays != null && request.OffDays.Any())
                {
                    foreach (var day in request.OffDays)
                    {
                        _context.ClassOffDays.Add(new ClassOffDay
                        {
                            AcademicClassId = academicClass.Id,
                            Day = day
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            // DETERMINE VERSION
            int newVersion = 1;
            if (isRegeneration)
            {
                var maxVer = await _context.Timetables
                    .Where(t => t.AcademicClassId == academicClass.Id)
                    .MaxAsync(t => (int?)t.Version) ?? 0;
                newVersion = maxVer + 1;
            }
            else
            {
                // If not strictly regeneration but generating fresh, we might still want to version up 
                // OR wipe existing. The user said "add a new col... not overwriting the previous one".
                // So actually, standard generation should probably ALSO increment version instead of wiping.
                // But let's follow the standard "Generate" vs "Regenerate".
                // If the user clicks "Generate" on the first screen, they might expect a fresh start.
                // However, the prompt implies "Regenerate" is the special action.
                // Let's assume "Generate" on main screen wipes everything (legacy behavior) OR increments.
                // Given "I dont want to lose the previous timetable", safe bet is ALWAYS increment version.
                
                var maxVer = await _context.Timetables
                    .Where(t => t.AcademicClassId == academicClass.Id)
                    .MaxAsync(t => (int?)t.Version) ?? 0;
                
                // If maxVer is 0, new is 1. If maxVer is 5, new is 6.
                // BUT, if the user explicitly wants to "overwrite" (like the original logic), 
                // we should probably stick to the requested "Regenerate" flow for versioning.
                // However, mixing "Overwrite" and "Versioned" modes is confusing.
                // Let's make EVERYTHING versioned. It's safer.
                newVersion = maxVer + 1;
            }

            // 2. Fetch Data
            var courses = await _context.Courses
                .Where(c => request.CourseIds.Contains(c.Id) && c.InstructorId != null)
                .Include(c => c.Instructor) // Ensure we have instructor info
                .ToListAsync();

            var rooms = await _context.Rooms
                .Where(r => request.RoomIds.Contains(r.Id))
                .ToListAsync();

            var allSlots = await _context.TimeSlots
                .Where(t => !request.OffDays.Contains(t.Day))
                .OrderBy(t => t.Day) // Group by Day implicitly by sorting
                .ThenBy(t => t.StartTime)
                .ToListAsync();

            // 3. NO LONGER Clear existing entries. We append new version.
            // var existing = await _context.Timetables.Where(t => t.AcademicClassId == academicClass.Id).ToListAsync();
            // _context.Timetables.RemoveRange(existing);
            // await _context.SaveChangesAsync();

            // 4. Load Global State
            // CRITICAL: We need to know what to "collide" with.
            // "Ignoring the same class timetable while respecting the other class timetable"
            // For other classes, we should probably respect their LATEST version (or active version).
            // For THIS class, we ignore ALL previous versions.
            
            // Get latest version for every OTHER class
            var otherClassesLatestVersions = await _context.Timetables
                .Where(t => t.AcademicClassId != academicClass.Id)
                .GroupBy(t => t.AcademicClassId)
                .Select(g => new { ClassId = g.Key, MaxVersion = g.Max(t => t.Version) })
                .ToListAsync();

            var latestVersionsMap = otherClassesLatestVersions.ToDictionary(x => x.ClassId, x => x.MaxVersion);

            // Fetch conflicts: All timetables where (Class != Current) AND (Version == Latest for that class)
            // This is complex to do in one query efficiently.
            // Easier: Fetch all timetables for other classes, then filter in memory (if dataset small) OR
            // build a complex Where clause.
            // Given typical scale, fetching all is okay, but filtering in DB is better.
            
            // Let's try to fetch all and filter in memory for simplicity/reliability first, 
            // assuming school timetable isn't millions of rows.
            var allTimetables = await _context.Timetables
                .Include(t => t.AcademicClass) // For debugging if needed
                .ToListAsync();

            var globalTimetable = allTimetables
                .Where(t => t.AcademicClassId != academicClass.Id && 
                            (latestVersionsMap.ContainsKey(t.AcademicClassId) && t.Version == latestVersionsMap[t.AcademicClassId]))
                .ToList();

            // Also, we need to track what we add LOCALLY in this session to prevent self-collision within the new version
            var currentSessionTimetable = new List<Timetable>();

            // Helper to check availability
            bool IsSlotFree(TimeSlot slot, Room room, int instructorId, int classId)
            {
                // Check against other classes' latest versions
                if (globalTimetable.Any(t =>
                    t.TimeSlotId == slot.Id &&
                    (t.RoomId == room.Id ||
                     t.InstructorId == instructorId)))
                     return false;

                // Check against what we've just scheduled in this transaction
                if (currentSessionTimetable.Any(t =>
                    t.TimeSlotId == slot.Id &&
                    (t.RoomId == room.Id ||
                     t.InstructorId == instructorId ||
                     t.AcademicClassId == classId)))
                     return false;

                return true;
            }

            // 5. Allocation Logic
            // Sort courses: higher credits first
            courses = courses.OrderByDescending(c => c.CreditHours).ToList();

            var daysOrder = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
            
            var generationTime = DateTime.UtcNow;

            foreach (var course in courses)
            {
                int remainingCredits = course.CreditHours;
                var usedDays = new HashSet<string>();
                int instructorId = course.InstructorId!.Value;

                if (course.IsLab)
                {
                    // LAB COURSE: Must be Lab Room, Consecutive Slots = CreditHours
                    var labRooms = rooms.Where(r => r.RoomType.Equals("Lab", StringComparison.OrdinalIgnoreCase)).ToList();
                    if (!labRooms.Any())
                    {
                         throw new Exception("Select Lab Room Number for Lab course");
                    }

                    bool allocated = TryAllocateBlock(course.CreditHours, "Lab", course, instructorId, academicClass.Id, rooms, allSlots, usedDays, globalTimetable, currentSessionTimetable, ref remainingCredits);

                    if (!allocated)
                    {
                        throw new Exception($"Could not schedule Lab course '{course.Title}' ({course.CreditHours} hours) consecutively in a Lab room.");
                    }
                }
                else
                {
                    // THEORY COURSE: Lecture Room (Not Lab), Can be split
                    while (remainingCredits > 0)
                    {
                        bool allocated = false;

                        // Try 2-hour block if possible
                        if (remainingCredits >= 2)
                        {
                            allocated = TryAllocateBlock(2, "Lecture", course, instructorId, academicClass.Id, rooms, allSlots, usedDays, globalTimetable, currentSessionTimetable, ref remainingCredits);
                        }

                        // Try 1-hour block if 2-hour failed or not needed
                        if (!allocated)
                        {
                            allocated = TryAllocateBlock(1, "Lecture", course, instructorId, academicClass.Id, rooms, allSlots, usedDays, globalTimetable, currentSessionTimetable, ref remainingCredits);
                        }

                        if (!allocated)
                        {
                            // Could not find a slot for this course part
                             throw new Exception($"Could not schedule Theory course '{course.Title}' for remaining {remainingCredits} hours.");
                        }
                    }
                }
            }

            // Save new entries with new version
             foreach(var t in currentSessionTimetable)
             {
                 t.Version = newVersion;
                 t.CreatedAt = generationTime;
                 _context.Timetables.Add(t);
             }
            
            await _context.SaveChangesAsync();
            return true;
        }

        private bool TryAllocateBlock(int blockSize, string roomType, Course course, int instructorId, int classId, 
            List<Room> rooms, List<TimeSlot> allSlots, HashSet<string> usedDays, 
            List<Timetable> globalTimetable, List<Timetable> currentSessionTimetable, ref int remainingCredits)
        {
            var compatibleRooms = rooms.Where(r => 
                (roomType == "Lab" ? r.RoomType.Equals("Lab", StringComparison.OrdinalIgnoreCase) : !r.RoomType.Equals("Lab", StringComparison.OrdinalIgnoreCase)) 
            ).ToList();

            if (roomType == "Lecture") 
            {
                compatibleRooms = rooms.Where(r => !r.RoomType.Equals("Lab", StringComparison.OrdinalIgnoreCase)).ToList();
            }

            // Iterate days to find a valid block
            var days = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
            
            // Randomize days order for variety, but ensure distribution
            // To ensure utilization of all days, we sort days by "Load" (number of slots used by this class so far)
            // But we can't easily track load per day inside the loop without context.
            // A simpler approach for variety: Shuffle the days list.
            var random = new Random();
            days = days.OrderBy(x => random.Next()).ToArray();

            // To prioritize utilization of ALL days (Load Balancing), we should sort days by how many credits are already assigned to them.
            // We need to calculate load for each day from `currentSessionTimetable`.
            
            var dayLoads = days.ToDictionary(d => d, d => currentSessionTimetable.Count(t => t.TimeSlotId != 0 && allSlots.FirstOrDefault(s => s.Id == t.TimeSlotId)?.Day == d));
            
            // Sort days by load (ascending) to pick the least used day first
            // But we also want randomness if loads are equal.
            days = days.OrderBy(d => dayLoads[d]).ThenBy(x => random.Next()).ToArray();
            
            foreach (var day in days)
            {
                if (usedDays.Contains(day)) continue; // Must be different day

                // Get slots for this day
                var daySlots = allSlots.Where(s => s.Day == day).OrderBy(s => s.StartTime).ToList();

                // Sliding window
                for (int i = 0; i <= daySlots.Count - blockSize; i++)
                {
                    var blockSlots = daySlots.Skip(i).Take(blockSize).ToList();

                    // Check continuity
                    bool isContinuous = true;
                    for(int k=0; k<blockSize-1; k++)
                    {
                        if(blockSlots[k].EndTime != blockSlots[k+1].StartTime)
                        {
                            isContinuous = false; 
                            break;
                        }
                    }
                    if (!isContinuous) continue;

                    // Try to find a room free for ALL these slots
                    foreach (var room in compatibleRooms)
                    {
                        bool roomFree = true;
                        foreach (var slot in blockSlots)
                        {
                            // Check Global (Other classes)
                            if (globalTimetable.Any(t => 
                                t.TimeSlotId == slot.Id && 
                                (t.RoomId == room.Id || t.InstructorId == instructorId)))
                            {
                                roomFree = false;
                                break;
                            }
                            
                            // Check Local (Current class new version)
                            if (currentSessionTimetable.Any(t => 
                                t.TimeSlotId == slot.Id && 
                                (t.RoomId == room.Id || t.InstructorId == instructorId || t.AcademicClassId == classId)))
                            {
                                roomFree = false;
                                break;
                            }
                        }

                        if (roomFree)
                        {
                            // Found it! Assign.
                            foreach (var slot in blockSlots)
                            {
                                var entry = new Timetable
                                {
                                    AcademicClassId = classId,
                                    CourseId = course.Id,
                                    InstructorId = instructorId, 
                                    RoomId = room.Id,
                                    TimeSlotId = slot.Id
                                };
                                // Don't add to context yet, wait until all success
                                // But we need to check collisions, so add to local list
                                currentSessionTimetable.Add(entry); 
                            }
                            
                            remainingCredits -= blockSize;
                            usedDays.Add(day);
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        public async Task<bool> DeleteTimetableVersion(string className, int version)
        {
            var academicClass = await _context.AcademicClasses.FirstOrDefaultAsync(a => a.Name == className);
            if (academicClass == null) return false;

            var entries = await _context.Timetables
                .Where(t => t.AcademicClassId == academicClass.Id && t.Version == version)
                .ToListAsync();

            if (!entries.Any()) return false;

            _context.Timetables.RemoveRange(entries);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteTimetable(string className)
        {
            var academicClass = await _context.AcademicClasses.FirstOrDefaultAsync(a => a.Name == className);
            if (academicClass == null) return false;

            // 1. Delete all timetable entries
            var timetables = await _context.Timetables.Where(t => t.AcademicClassId == academicClass.Id).ToListAsync();
            _context.Timetables.RemoveRange(timetables);

            // 2. Delete off-days preferences
            var offDays = await _context.ClassOffDays.Where(d => d.AcademicClassId == academicClass.Id).ToListAsync();
            _context.ClassOffDays.RemoveRange(offDays);

            // 3. Delete the class itself
            _context.AcademicClasses.Remove(academicClass);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<object>> GetTimetableSummaries()
        {
            var data = await _context.Timetables
                .Include(t => t.AcademicClass)
                .GroupBy(t => t.AcademicClass.Name)
                .Select(g => new
                {
                    ClassName = g.Key,
                    MaxVersion = g.Max(t => t.Version),
                    CreatedAt = g.Max(t => t.CreatedAt) // Assuming latest entry timestamp
                })
                .ToListAsync();
            
            // Generate sequential ID in memory or using index
            return data.Select((d, index) => new
            {
                Id = index + 1,
                ClassName = d.ClassName,
                CreatedAt = d.CreatedAt == default ? DateTime.Now : d.CreatedAt, // Fallback if old data is null
                Versions = d.MaxVersion
            }).Cast<object>().ToList();
        }

        public async Task<List<object>> GetTimetable(string className, int? version = null)
        {
             var query = _context.Timetables
                .Where(t => t.AcademicClass.Name == className);

             if (version.HasValue)
             {
                 query = query.Where(t => t.Version == version.Value);
             }
             else
             {
                 // Default to latest version
                 // Subquery to find max version for this class
                 // Note: EF Core might struggle with this in one go if not careful.
                 // Easier: Get max version first.
                 var maxVer = await _context.Timetables
                    .Where(t => t.AcademicClass.Name == className)
                    .MaxAsync(t => (int?)t.Version);
                 
                 if (maxVer.HasValue)
                 {
                     query = query.Where(t => t.Version == maxVer.Value);
                 }
             }

             var result = await query
                .Include(t => t.AcademicClass)
                .Include(t => t.Course)
                .Include(t => t.Room)
                .Include(t => t.TimeSlot)
                .OrderBy(t => t.TimeSlot.Day) 
                .ThenBy(t => t.TimeSlot.StartTime)
                .ToListAsync();
            
            // Custom Day Sort
            var dayOrder = new Dictionary<string, int> 
            { 
                { "Monday", 1 }, { "Tuesday", 2 }, { "Wednesday", 3 }, { "Thursday", 4 }, { "Friday", 5 } 
            };

            return result.OrderBy(t => dayOrder.ContainsKey(t.TimeSlot.Day) ? dayOrder[t.TimeSlot.Day] : 99)
                         .ThenBy(t => t.TimeSlot.StartTime)
                         .Select(t => new 
                         {
                             Class = t.AcademicClass.Name,
                             Course = t.Course.Title,
                             Room = t.Room.RoomNumber,
                             RoomType = t.Room.RoomType,
                             IsLab = t.Course.IsLab,
                             Day = t.TimeSlot.Day,
                             StartTime = t.TimeSlot.StartTime.ToString(@"hh\:mm"),
                             EndTime = t.TimeSlot.EndTime.ToString(@"hh\:mm"),
                             Version = t.Version // Include Version in output
                         }).Cast<object>().ToList();
        }

        public async Task<object> CompareTimetables(string classA, int verA, string classB, int verB)
        {
            // 1. Fetch Timetable A
            var listA = await _context.Timetables
                .Include(t => t.AcademicClass)
                .Include(t => t.Course)
                .Include(t => t.Instructor)
                .Include(t => t.Room)
                .Include(t => t.TimeSlot)
                .Where(t => t.AcademicClass.Name == classA && t.Version == verA)
                .ToListAsync();

            // 2. Fetch Timetable B
            var listB = await _context.Timetables
                .Include(t => t.AcademicClass)
                .Include(t => t.Course)
                .Include(t => t.Instructor)
                .Include(t => t.Room)
                .Include(t => t.TimeSlot)
                .Where(t => t.AcademicClass.Name == classB && t.Version == verB)
                .ToListAsync();

            var conflicts = new List<object>();

            // 3. Build Maps for Timetable B for O(1) lookups
            // Key format: "{Id}|{Day}|{StartTime}"
            
            // Helper to generate key
            string GetTimeKey(Timetable t) => $"{t.TimeSlot.Day}|{t.TimeSlotId}"; // TimeSlotId implies specific time

            var mapB_Instructor = listB.GroupBy(t => $"{t.InstructorId}|{GetTimeKey(t)}")
                                       .ToDictionary(g => g.Key, g => g.First());

            var mapB_Room = listB.GroupBy(t => $"{t.RoomId}|{GetTimeKey(t)}")
                                 .ToDictionary(g => g.Key, g => g.First());
            
            var mapB_Course = listB.GroupBy(t => $"{t.CourseId}|{GetTimeKey(t)}")
                                   .ToDictionary(g => g.Key, g => g.First());

            // 4. Iterate A and check conflicts
            foreach (var itemA in listA)
            {
                if (itemA.TimeSlot == null) continue; // Should not happen

                string timeKey = GetTimeKey(itemA);
                
                // Check Instructor Conflict
                // "Same instructor_id + day + time_slot_id"
                string keyInst = $"{itemA.InstructorId}|{timeKey}";
                if (mapB_Instructor.TryGetValue(keyInst, out var conflictB))
                {
                    conflicts.Add(new
                    {
                        Type = "Instructor",
                        Description = $"Instructor {itemA.Instructor?.Name} is double booked.",
                        Day = itemA.TimeSlot.Day,
                        Time = itemA.TimeSlot.StartTime.ToString(@"hh\:mm"),
                        EntityA_Id = itemA.Id,
                        EntityB_Id = conflictB.Id
                    });
                }

                // Check Room Conflict
                // "Same room_id + day + time_slot_id"
                string keyRoom = $"{itemA.RoomId}|{timeKey}";
                if (mapB_Room.TryGetValue(keyRoom, out var conflictB_Room))
                {
                    conflicts.Add(new
                    {
                        Type = "Room",
                        Description = $"Room {itemA.Room?.RoomNumber} is double booked.",
                        Day = itemA.TimeSlot.Day,
                        Time = itemA.TimeSlot.StartTime.ToString(@"hh\:mm"),
                        EntityA_Id = itemA.Id,
                        EntityB_Id = conflictB_Room.Id
                    });
                }

                // Check Course Overlap
                // "Same course_id + day + time_slot_id"
                string keyCourse = $"{itemA.CourseId}|{timeKey}";
                if (mapB_Course.TryGetValue(keyCourse, out var conflictB_Course))
                {
                    conflicts.Add(new
                    {
                        Type = "Course",
                        Description = $"Course {itemA.Course?.Title} is scheduled in both timetables at same time.",
                        Day = itemA.TimeSlot.Day,
                        Time = itemA.TimeSlot.StartTime.ToString(@"hh\:mm"),
                        EntityA_Id = itemA.Id,
                        EntityB_Id = conflictB_Course.Id
                    });
                }
            }

            // 5. Format Output
            var formatEntry = (Timetable t) => new
            {
                Id = t.Id,
                Class = t.AcademicClass?.Name,
                Course = t.Course?.Title,
                CourseId = t.CourseId,
                Room = t.Room?.RoomNumber,
                RoomId = t.RoomId,
                RoomType = t.Room?.RoomType,
                Instructor = t.Instructor?.Name,
                InstructorId = t.InstructorId,
                IsLab = t.Course?.IsLab ?? false,
                Day = t.TimeSlot?.Day,
                StartTime = t.TimeSlot?.StartTime.ToString(@"hh\:mm"),
                EndTime = t.TimeSlot?.EndTime.ToString(@"hh\:mm"),
                Version = t.Version
            };

            return new
            {
                TimetableA = listA.Select(formatEntry).ToList(),
                TimetableB = listB.Select(formatEntry).ToList(),
                Conflicts = conflicts
            };
        }

        public async Task<List<int>> GetVersions(string className)
        {
            return await _context.Timetables
                .Where(t => t.AcademicClass.Name == className)
                .Select(t => t.Version)
                .Distinct()
                .OrderByDescending(v => v)
                .ToListAsync();
        }
        
        public async Task<bool> RegenerateTimetable(string className)
        {
            // 1. Get Class ID
            var academicClass = await _context.AcademicClasses.FirstOrDefaultAsync(a => a.Name == className);
            if (academicClass == null) throw new Exception("Class not found");

            // 2. Get Latest Version Constraints (Courses, Rooms) from existing data
            var maxVer = await _context.Timetables
                    .Where(t => t.AcademicClassId == academicClass.Id)
                    .MaxAsync(t => (int?)t.Version);

            if (!maxVer.HasValue) throw new Exception("No existing timetable to regenerate from");

            var existingEntries = await _context.Timetables
                .Where(t => t.AcademicClassId == academicClass.Id && t.Version == maxVer.Value)
                .ToListAsync();

            var courseIds = existingEntries.Select(t => t.CourseId).Distinct().ToList();
            var roomIds = existingEntries.Select(t => t.RoomId).Distinct().ToList();

            // Load Off Days from DB
            var offDays = await _context.ClassOffDays
                .Where(d => d.AcademicClassId == academicClass.Id)
                .Select(d => d.Day)
                .ToListAsync();

            var request = new GenerateRequest
            {
                ClassName = className,
                CourseIds = courseIds,
                RoomIds = roomIds,
                OffDays = offDays 
            };

            return await GenerateTimetable(request, isRegeneration: true);
        }
    }
}
