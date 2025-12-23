# Smart Timetable Allocator - Project Report

## 2. INTRODUCTION & PROBLEM

### Introduction
The **Smart Timetable Allocator** is a sophisticated automated scheduling system designed to solve the complex problem of university course allocation. Built using modern web technologies (React.js frontend and ASP.NET Core backend), the system provides an intuitive interface for academic administrators to manage courses, instructors, rooms, and generate conflict-free timetables.

### Problem Statement
University timetable scheduling is a classic **NP-complete problem**. Manual scheduling faces several critical challenges:
*   **Resource Conflicts**: Double-booking rooms or instructors.
*   **Constraint Complexity**: Managing diverse constraints such as room capacities, specific equipment needs (Labs vs. Lecture Halls), and instructor availability.
*   **Scalability**: As the number of courses and classes increases, the complexity grows exponentially.
*   **Human Error**: Manual processes are prone to oversight, leading to scheduling clashes that disrupt academic operations.

The Smart Timetable Allocator addresses these issues by automating the allocation process, ensuring hard constraints are met while optimizing for soft constraints like load balancing.

---

## 3. PARADIGMS

The project relies on several key software engineering and algorithmic paradigms:

### Software Architecture Paradigms
1.  **Object-Oriented Programming (OOP)**: The system models real-world entities (Course, Instructor, Room, Timetable) as classes, encapsulating state and behavior.
2.  **Layered Architecture**:
    *   **Presentation Layer (Controllers)**: Handles HTTP requests and responses.
    *   **Service Layer (Business Logic)**: Contains the core scheduling algorithms and rules.
    *   **Data Access Layer (EF Core)**: Manages database interactions and entity relationships.
3.  **Dependency Injection (DI)**: Promotes loose coupling and testability by injecting dependencies (like `AppDbContext`) into services.

### Algorithmic Paradigms
1.  **Greedy Approach**: The algorithm makes locally optimal choices at each step (e.g., scheduling the most difficult courses first) with the goal of finding a globally valid schedule.
2.  **Constraint Satisfaction**: The core logic is built around satisfying a set of hard constraints (No double booking, Lab courses in Lab rooms, etc.).
3.  **Heuristics**: To improve the quality of the solution and avoid getting stuck, the system uses heuristics:
    *   **Largest Degree First**: Courses with higher credit hours are scheduled first.
    *   **Load Balancing**: Days are prioritized based on current utilization to prevent "heavy" days.
    *   **Randomization**: Introduces variety to prevent deterministic patterns that might lead to repeated failures for specific configurations.

---

## 4. ALGORITHM & EXPLANATION

The core scheduling logic resides in the `TimetableService.GenerateTimetable` method. Here is the step-by-step execution flow:

### Step 1: Initialization & Pre-processing
*   The system validates the request (Class Name, Course IDs, Room IDs).
*   It ensures the existence of the `AcademicClass` and manages `Version` control (incrementing version numbers for new generations).
*   **Off-Days** preferences are applied to filter out unavailable time slots.

### Step 2: Global State Awareness (Conflict Prevention)
*   Before scheduling, the algorithm fetches the **Latest Version** of timetables for *all other classes*.
*   It builds a `GlobalTimetable` snapshot. This allows the current generation process to be "aware" of occupied rooms and instructors across the entire university, preventing cross-class conflicts.

### Step 3: Prioritization (Sorting)
*   **Courses are sorted by Credit Hours (Descending)**.
*   *Reasoning*: Large blocks (like 3-hour Labs) are harder to fit than 1-hour lectures. Scheduling them first reduces the chance of fragmentation leaving no room for them later.

### Step 4: Allocation Loop
For each course, the system attempts to allocate time slots:

1.  **Room Type Check**:
    *   If `Course.IsLab == true`, filter for **Lab** rooms.
    *   If `Course.IsLab == false`, filter for **Lecture** rooms.

2.  **Block Allocation Strategy**:
    *   **Labs**: Must be scheduled as a single contiguous block (e.g., 3 hours).
    *   **Theory**: Tried first as 2-hour blocks, then 1-hour blocks to fill remaining credits.

3.  **Slot Finding (Sliding Window)**:
    *   The algorithm iterates through available Days.
    *   **Heuristic**: Days are shuffled and sorted by "Current Load" to distribute classes evenly.
    *   For each day, it uses a **Sliding Window** of size `k` (block size) to find consecutive free slots.

4.  **Validation**:
    *   For a candidate block of slots and a candidate room, it checks:
        *   **Global Conflict**: Is the Room or Instructor used by *another* class at this time?
        *   **Local Conflict**: Is the Room, Instructor, or Class already booked in the *current* session?
    *   If valid, the slots are assigned, and the algorithm moves to the next course.

### Step 5: Backtracking / Failure Handling
*   If the algorithm cannot find a valid slot for a course after trying all days and rooms, it throws a descriptive exception (e.g., "Could not schedule Lab course 'Physics'").
*   This fail-fast mechanism alerts the user to relax constraints (add more rooms or remove off-days).

---

## 5. ALGORITHM CODE

Below is the core logic extracted from `TimetableService.cs`:

```csharp
public async Task<bool> GenerateTimetable(GenerateRequest request, bool isRegeneration = false)
{
    // ... [Initialization and Data Fetching] ...

    // 1. Load Global State (Conflict Detection)
    var otherClassesLatestVersions = await _context.Timetables
        .Where(t => t.AcademicClassId != academicClass.Id)
        .GroupBy(t => t.AcademicClassId)
        .Select(g => new { ClassId = g.Key, MaxVersion = g.Max(t => t.Version) })
        .ToListAsync();

    // ... [Building Global Timetable List] ...

    // 2. Sort courses: Higher credits first (Heuristic)
    courses = courses.OrderByDescending(c => c.CreditHours).ToList();

    foreach (var course in courses)
    {
        int remainingCredits = course.CreditHours;
        var usedDays = new HashSet<string>();

        if (course.IsLab)
        {
            // LAB: Consecutive allocation required
            bool allocated = TryAllocateBlock(course.CreditHours, "Lab", course, ...);
            if (!allocated) throw new Exception($"Could not schedule Lab course '{course.Title}'");
        }
        else
        {
            // THEORY: Split into 2hr + 1hr blocks
            while (remainingCredits > 0)
            {
                bool allocated = false;
                if (remainingCredits >= 2)
                    allocated = TryAllocateBlock(2, "Lecture", course, ...);
                
                if (!allocated)
                    allocated = TryAllocateBlock(1, "Lecture", course, ...);

                if (!allocated) throw new Exception($"Could not schedule Theory course '{course.Title}'");
            }
        }
    }
    
    // ... [Save Changes] ...
}

private bool TryAllocateBlock(int blockSize, string roomType, Course course, ...)
{
    // Filter Compatible Rooms
    var compatibleRooms = rooms.Where(r => CheckRoomType(r, roomType)).ToList();

    // Heuristic: Sort days by current load + Randomness
    var days = GetSortedDaysWithRandomness();

    foreach (var day in days)
    {
        if (usedDays.Contains(day)) continue; // One block per day constraint

        // Sliding Window for Slots
        var daySlots = allSlots.Where(s => s.Day == day).OrderBy(s => s.StartTime).ToList();
        
        for (int i = 0; i <= daySlots.Count - blockSize; i++)
        {
            var blockSlots = daySlots.Skip(i).Take(blockSize).ToList();
            if (!IsContinuous(blockSlots)) continue;

            // Try to find a free room
            foreach (var room in compatibleRooms)
            {
                if (IsRoomAndInstructorFree(blockSlots, room, course.InstructorId))
                {
                    // Success: Assign slots
                    AssignSlots(blockSlots, room, course);
                    return true;
                }
            }
        }
    }
    return false;
}
```

---

## 6. CONCLUSION

The **Smart Timetable Allocator** successfully automates the university scheduling process, transforming a tedious manual task into an efficient, reliable digital workflow. 

By leveraging a **Greedy Heuristic Algorithm** within a robust **ASP.NET Core** and **React** architecture, the system ensures:
1.  **Correctness**: Hard constraints (double bookings, room types) are strictly enforced.
2.  **Efficiency**: The conflict detection logic operates efficiently using HashSets and in-memory lookups ($O(N)$), ensuring scalability.
3.  **Usability**: Features like "Compare Timetables" provide administrators with powerful tools to validate and verify schedules visually.

The system proves that while timetable scheduling is computationally difficult, domain-specific heuristics and modern engineering practices can yield highly effective practical solutions.
