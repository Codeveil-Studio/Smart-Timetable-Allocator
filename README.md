# Smart Timetable Allocator Web App

A modern, intelligent timetable management system designed to optimize university scheduling. This project is developed as part of our **3rd Semester DSA (Data Structures and Algorithms) Course**.

---

## 📚 Course Context
**Course:** Data Structures and Algorithms (DSA)  
**Semester:** 3rd Semester  
**Institution:** Bahria University Karachi

This project demonstrates the practical application of core DSA concepts such as Graph Theory, Backtracking, and Hash-based data structures to solve the complex Constraint Satisfaction Problem (CSP) of university timetabling.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 (TypeScript)
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** TanStack Query
- **Routing:** React Router DOM
- **Visualization:** Recharts (Analytics)

### Backend
- **Framework:** .NET 8 (C#)
- **Architecture:** RESTful API
- **ORM:** Entity Framework Core (EF Core)
- **Database:** PostgreSQL (Npgsql)

---

## 🧠 Data Structures & Algorithms

The core intelligence of the scheduler relies on the following:

### 1. Algorithms
- **Greedy Heuristic with Backtracking (Implicit):** Used in the `GenerateTimetable` logic to attempt slot allocation using a "Sliding Window" technique. If a block fits, it's assigned; otherwise, the algorithm backtracks to try the next slot or day.
- **Load Balancing:** Heuristic sorting of days to ensure courses are distributed evenly across the week.
- **Conflict Detection:** O(N) verification using Hash Maps to ensure no overlaps in Rooms, Instructors, or Student Groups.

### 2. Data Structures
- **HashSet:** Used for O(1) constraints tracking (e.g., `usedDays` to prevent scheduling the same course multiple times on the same day).
- **Dictionary (Hash Map):** Utilized for O(1) lookups during conflict detection and comparison (e.g., mapping `InstructorId|TimeKey` to existing bookings).
- **Graphs (Implicit):** The scheduling problem is modeled as a graph coloring problem where:
  - **Nodes:** Course Sessions
  - **Edges:** Constraints (Same Room, Same Instructor)
- **Lists (Arrays):** For maintaining ordered sequences of time slots and priority queues for courses.

---

## ✨ Functionality

1. **Dashboard & Analytics:** Real-time overview of total courses, instructors, rooms, and generated timetables with graphical insights (Last 7 Days Activity).
2. **Generate Timetable:** Automated scheduling engine that respects:
   - Instructor Availability
   - Room Capacity & Type (Lab vs. Lecture)
   - Course Credit Hours (Splitting into 2hr/1hr blocks)
   - Off-Day Preferences
3. **View Timetable:** Interactive grid view with filtering by Course, Room, or Instructor. Supports PDF export.
4. **Compare Timetables:** Side-by-side comparison of two timetable versions with:
   - Visual Highlighting of differences.
   - **O(N) Conflict Detection** highlighting double-bookings or overlaps.
5. **Manage Resources:** CRUD operations for Courses, Instructors, and Rooms (via API).

---

## 👥 Team Members

- **Ammad Ahmed**
- **Muhammad Hussain**
- **Muhamamd Farhan**

---

<div align="center">

### Powered by Codevwil Studio

</div>
