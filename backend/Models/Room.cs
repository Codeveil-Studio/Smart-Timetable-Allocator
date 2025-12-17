using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SmartScheduleBackend.Models
{
    [Table("rooms")]
    public class Room
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("room_number")]
        [JsonPropertyName("room_number")]
        public string RoomNumber { get; set; } = string.Empty;

        [Column("room_type")]
        [JsonPropertyName("room_type")]
        public string RoomType { get; set; } = string.Empty; // "Lecture" or "Lab"
    }
}
