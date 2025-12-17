using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartScheduleBackend.Data;
using SmartScheduleBackend.Models;

namespace SmartScheduleBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InstructorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InstructorsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Instructor>>> GetInstructors()
        {
            return await _context.Instructors.OrderBy(i => i.Id).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Instructor>> CreateInstructor(InstructorCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { error = "Name is required" });

            var instructor = new Instructor { Name = dto.Name };
            _context.Instructors.Add(instructor);
            await _context.SaveChangesAsync();

            if (dto.CourseId.HasValue)
            {
                var course = await _context.Courses.FindAsync(dto.CourseId.Value);
                if (course != null)
                {
                    course.InstructorId = instructor.Id;
                    await _context.SaveChangesAsync();
                }
            }

            return CreatedAtAction(nameof(GetInstructors), new { id = instructor.Id }, instructor);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateInstructor([FromBody] Instructor instructor) 
        {
             if (instructor.Id == 0 || string.IsNullOrWhiteSpace(instructor.Name))
                return BadRequest(new { error = "ID and Name are required" });

            var existing = await _context.Instructors.FindAsync(instructor.Id);
            if (existing == null) return NotFound(new { error = "Instructor not found" });

            existing.Name = instructor.Name;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }
        
        // Frontend sends DELETE to /api/instructors?id=...
        [HttpDelete]
        public async Task<IActionResult> DeleteInstructor([FromQuery] int id)
        {
            var instructor = await _context.Instructors.FindAsync(id);
            if (instructor == null) return NotFound(new { error = "Instructor not found" });

            // Optional: Set courses instructor_id to null?
            var courses = await _context.Courses.Where(c => c.InstructorId == id).ToListAsync();
            foreach(var c in courses) c.InstructorId = null;

            _context.Instructors.Remove(instructor);
            await _context.SaveChangesAsync();
            return Ok(new { ok = true });
        }
    }
}
