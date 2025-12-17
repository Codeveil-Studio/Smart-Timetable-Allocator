using System.ComponentModel.DataAnnotations.Schema;

namespace SmartScheduleBackend.Models
{
    [Table("academic_class")]
    public class AcademicClass
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("name")]
        public string Name { get; set; } = string.Empty;
    }
}
