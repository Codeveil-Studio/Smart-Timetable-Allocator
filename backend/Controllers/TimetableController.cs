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
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("summaries")]
        public async Task<IActionResult> GetSummaries()
        {
            try
            {
                var summaries = await _service.GetTimetableSummaries();
                return Ok(summaries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{className}")]
        public async Task<IActionResult> GetTimetable(string className, [FromQuery] int? version)
        {
            var result = await _service.GetTimetable(className, version);
            return Ok(result);
        }

        [HttpGet("{className}/versions")]
        public async Task<IActionResult> GetVersions(string className)
        {
            var result = await _service.GetVersions(className);
            return Ok(result);
        }

        [HttpPost("regenerate/{className}")]
        public async Task<IActionResult> Regenerate(string className)
        {
            try
            {
                var success = await _service.RegenerateTimetable(className);
                if (success)
                    return Ok(new { message = "Timetable regenerated successfully" });
                else
                    return BadRequest(new { error = "Could not regenerate timetable" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{className}/versions/{version}")]
        public async Task<IActionResult> DeleteVersion(string className, int version)
        {
            try
            {
                var success = await _service.DeleteTimetableVersion(className, version);
                if (success)
                    return Ok(new { message = "Version deleted successfully" });
                else
                    return NotFound(new { error = "Version not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{className}")]
        public async Task<IActionResult> Delete(string className)
        {
            try
            {
                var success = await _service.DeleteTimetable(className);
                if (success)
                    return Ok(new { message = "Timetable deleted successfully" });
                else
                    return NotFound(new { error = "Timetable not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        [HttpPost("compare")]
        public async Task<IActionResult> Compare([FromBody] CompareRequest request)
        {
            try
            {
                var result = await _service.CompareTimetables(request.ClassA, request.VersionA, request.ClassB, request.VersionB);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
