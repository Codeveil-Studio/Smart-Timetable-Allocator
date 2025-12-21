using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SmartScheduleBackend.Models
{
    [Table("courses")]
    public class Course
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("code")]
        public string Code { get; set; } = string.Empty;

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("credit_hours")]
        [JsonPropertyName("credit_hours")]
        public int CreditHours { get; set; }

        [Column("instructor_id")]
        [JsonPropertyName("instructor_id")]
        public int? InstructorId { get; set; } // Nullable because course might not have instructor initially

        [Column("isLab")]
        [JsonPropertyName("isLab")]
        public bool IsLab { get; set; }

        public Instructor? Instructor { get; set; }
    }
}
