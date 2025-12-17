using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartScheduleBackend.Data;
using SmartScheduleBackend.Models;

namespace SmartScheduleBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RoomsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
        {
            return await _context.Rooms.OrderBy(r => r.Id).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Room>> CreateRoom(RoomCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RoomNumber) || string.IsNullOrWhiteSpace(dto.RoomType))
                return BadRequest(new { error = "Missing fields" });

            var room = new Room
            {
                RoomNumber = dto.RoomNumber,
                RoomType = dto.RoomType
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRooms), new { id = room.Id }, room);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateRoom([FromBody] Room room)
        {
            if (room.Id == 0) return BadRequest(new { error = "Missing id" });

            var existing = await _context.Rooms.FindAsync(room.Id);
            if (existing == null) return NotFound(new { error = "Room not found" });

            existing.RoomNumber = room.RoomNumber;
            existing.RoomType = room.RoomType;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteRoom([FromQuery] int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return NotFound(new { error = "Room not found" });

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();
            return Ok(new { ok = true });
        }
    }
}
