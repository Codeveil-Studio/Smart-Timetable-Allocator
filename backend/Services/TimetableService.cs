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

        public async Task<bool> GenerateTimetable(GenerateRequest request)
        {
            await EnsureTimeSlots();

            // 1. Get or Create Academic Class
            var academicClass = await _context.AcademicClasses.FirstOrDefaultAsync(a => a.Name == request.ClassName);
            if (academicClass == null)
            {
                academicClass = new AcademicClass { Name = request.ClassName };
                _context.AcademicClasses.Add(academicClass);
                await _context.SaveChangesAsync();
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
                .OrderBy(t => t.Day) // Group by Day implicitly by sorting
                .ThenBy(t => t.StartTime)
                .ToListAsync();

            // 3. Clear existing entries for this class
            var existing = await _context.Timetables.Where(t => t.AcademicClassId == academicClass.Id).ToListAsync();
            _context.Timetables.RemoveRange(existing);
            await _context.SaveChangesAsync();

            // 4. Load Global State
            var globalTimetable = await _context.Timetables.ToListAsync();

            // Helper to check availability
            bool IsSlotFree(TimeSlot slot, Room room, int instructorId, int classId)
            {
                return !globalTimetable.Any(t =>
                    t.TimeSlotId == slot.Id &&
                    (t.RoomId == room.Id ||
                     t.InstructorId == instructorId ||
                     t.AcademicClassId == classId)); 
            }

            // 5. Allocation Logic
            // Sort courses: higher credits first
            courses = courses.OrderByDescending(c => c.CreditHours).ToList();

            var daysOrder = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
            
            foreach (var course in courses)
            {
                int remainingCredits = course.CreditHours;
                var usedDays = new HashSet<string>();
                int instructorId = course.InstructorId!.Value;

                // Try to allocate
                while (remainingCredits > 0)
                {
                    bool allocated = false;

                    // Strategy:
                    // 1. If credits >= 3, try Lab Room (3 slots)
                    // 2. If credits >= 2, try Lecture Room (2 slots)
                    // 3. Try Lecture Room (1 slot)

                    // Priority 1: Lab (3 slots)
                    if (remainingCredits >= 3 && !allocated)
                    {
                        allocated = TryAllocateBlock(3, "Lab", course, instructorId, academicClass.Id, rooms, allSlots, usedDays, globalTimetable, ref remainingCredits);
                    }

                    // Priority 2: Lecture (2 slots)
                    if (remainingCredits >= 2 && !allocated)
                    {
                         allocated = TryAllocateBlock(2, "Lecture", course, instructorId, academicClass.Id, rooms, allSlots, usedDays, globalTimetable, ref remainingCredits);
                    }

                    // Priority 3: Lecture (1 slot)
                    if (remainingCredits >= 1 && !allocated)
                    {
                         allocated = TryAllocateBlock(1, "Lecture", course, instructorId, academicClass.Id, rooms, allSlots, usedDays, globalTimetable, ref remainingCredits);
                    }

                    if (!allocated)
                    {
                        // Could not find a slot for this course part
                        break; 
                    }
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private bool TryAllocateBlock(int blockSize, string roomType, Course course, int instructorId, int classId, 
            List<Room> rooms, List<TimeSlot> allSlots, HashSet<string> usedDays, 
            List<Timetable> globalTimetable, ref int remainingCredits)
        {
            var compatibleRooms = rooms.Where(r => 
                (roomType == "Lab" ? r.RoomType == "Lab" : r.RoomType != "Lab") 
            ).ToList();

            if (roomType == "Lecture") 
            {
                compatibleRooms = rooms.Where(r => r.RoomType != "Lab").ToList();
            }

            // Iterate days to find a valid block
            var days = new[] { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
            
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
                            if (globalTimetable.Any(t => 
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
                                _context.Timetables.Add(entry);
                                globalTimetable.Add(entry); // Update local state
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

        public async Task<List<object>> GetTimetable(string className)
        {
             var result = await _context.Timetables
                .Where(t => t.AcademicClass.Name == className)
                .Include(t => t.AcademicClass)
                .Include(t => t.Course)
                .Include(t => t.Room)
                .Include(t => t.TimeSlot)
                .OrderBy(t => t.TimeSlot.Day) // String sort might be wrong (Fri < Mon), need custom sort
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
                             Day = t.TimeSlot.Day,
                             StartTime = t.TimeSlot.StartTime.ToString(@"hh\:mm"),
                             EndTime = t.TimeSlot.EndTime.ToString(@"hh\:mm")
                         }).Cast<object>().ToList();
        }
    }
}
