using System.ComponentModel.DataAnnotations.Schema;

namespace SmartScheduleBackend.Models
{
    [Table("class_off_days")]
    public class ClassOffDay
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("academic_class_id")]
        public int AcademicClassId { get; set; }

        [Column("day")]
        public string Day { get; set; } = string.Empty;

        [ForeignKey("AcademicClassId")]
        public AcademicClass? AcademicClass { get; set; }
    }
}