using System.ComponentModel.DataAnnotations.Schema;

namespace SmartScheduleBackend.Models
{
    [Table("timetable")]
    public class Timetable
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("academic_class_id")]
        public int AcademicClassId { get; set; }
        public AcademicClass? AcademicClass { get; set; }

        [Column("course_id")]
        public int CourseId { get; set; }
        public Course? Course { get; set; }

        [Column("instructor_id")]
        public int InstructorId { get; set; }
        public Instructor? Instructor { get; set; }

        [Column("room_id")]
        public int RoomId { get; set; }
        public Room? Room { get; set; }

        [Column("time_slot_id")]
        public int TimeSlotId { get; set; }
        public TimeSlot? TimeSlot { get; set; }

        [Column("version")]
        public int Version { get; set; } = 1;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
