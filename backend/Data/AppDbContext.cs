using Microsoft.EntityFrameworkCore;
using SmartScheduleBackend.Models;

namespace SmartScheduleBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Instructor> Instructors { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<AcademicClass> AcademicClasses { get; set; }
        public DbSet<TimeSlot> TimeSlots { get; set; }
        public DbSet<Timetable> Timetables { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Existing tables mapping checks if needed
            // New tables
            modelBuilder.Entity<AcademicClass>().ToTable("academic_class");
            modelBuilder.Entity<TimeSlot>().ToTable("time_slot");
            modelBuilder.Entity<Timetable>().ToTable("timetable");
        }
    }
}
