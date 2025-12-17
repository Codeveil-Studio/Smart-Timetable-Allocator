using Microsoft.AspNetCore.Mvc;
using SmartScheduleBackend.Models;
using SmartScheduleBackend.Services;

namespace SmartScheduleBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TimetableController : ControllerBase
    {
        private readonly TimetableService _service;

        public TimetableController(TimetableService service)
        {
            _service = service;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateRequest request)
        {
            try
            {
                var success = await _service.GenerateTimetable(request);
                if (success)
                    return Ok(new { message = "Timetable generated successfully" });
                else
                    return BadRequest(new { error = "Could not generate timetable due to conflicts" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{className}")]
        public async Task<IActionResult> GetTimetable(string className)
        {
            var result = await _service.GetTimetable(className);
            return Ok(result);
        }
    }
}
