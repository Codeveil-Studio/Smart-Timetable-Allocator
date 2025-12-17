using System.ComponentModel.DataAnnotations.Schema;

namespace SmartScheduleBackend.Models
{
    [Table("time_slot")]
    public class TimeSlot
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("day")]
        public string Day { get; set; } = string.Empty; // Mon-Fri

        [Column("start_time")]
        public TimeSpan StartTime { get; set; }

        [Column("end_time")]
        public TimeSpan EndTime { get; set; }
    }
}
