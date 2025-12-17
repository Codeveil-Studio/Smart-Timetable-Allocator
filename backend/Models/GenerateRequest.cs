namespace SmartScheduleBackend.Models
{
    public class GenerateRequest
    {
        public string ClassName { get; set; } = string.Empty;
        public List<int> CourseIds { get; set; } = new List<int>();
        public List<int> RoomIds { get; set; } = new List<int>();
    }
}
