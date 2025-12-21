namespace SmartScheduleBackend.Models
{
    public class InstructorCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public int? CourseId { get; set; }
    }

    public class CourseCreateDto
    {
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public int CreditHours { get; set; }
        public int? InstructorId { get; set; }
        public bool IsLab { get; set; }
    }

    public class RoomCreateDto
    {
        public string RoomNumber { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
    }
}
