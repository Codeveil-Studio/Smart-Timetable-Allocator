namespace SmartScheduleBackend.Models
{
    public class CompareRequest
    {
        public string ClassA { get; set; } = string.Empty;
        public int VersionA { get; set; }
        public string ClassB { get; set; } = string.Empty;
        public int VersionB { get; set; }
    }
}
