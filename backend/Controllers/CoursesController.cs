using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartScheduleBackend.Data;
using SmartScheduleBackend.Models;

namespace SmartScheduleBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetCourses()
        {
            return await _context.Courses.OrderBy(c => c.Id).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Course>> CreateCourse(CourseCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { error = "Missing fields" });

            var course = new Course
            {
                Code = dto.Code,
                Title = dto.Title,
                CreditHours = dto.CreditHours,
                InstructorId = dto.InstructorId,
                IsLab = dto.IsLab
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCourses), new { id = course.Id }, course);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateCourse([FromBody] Course course)
        {
            if (course.Id == 0) return BadRequest(new { error = "Missing id" });

            var existing = await _context.Courses.FindAsync(course.Id);
            if (existing == null) return NotFound(new { error = "Course not found" });

            existing.Code = course.Code;
            existing.Title = course.Title;
            existing.CreditHours = course.CreditHours;
            existing.InstructorId = course.InstructorId;
            existing.IsLab = course.IsLab;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteCourse([FromQuery] int? id, [FromBody] Course? body)
        {
            // Frontend might send ID in query or body
            int targetId = id ?? body?.Id ?? 0;
            if (targetId == 0) return BadRequest(new { error = "Missing id" });

            var course = await _context.Courses.FindAsync(targetId);
            if (course == null) return NotFound(new { error = "Course not found" });

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            return Ok(new { ok = true });
        }
    }
}
