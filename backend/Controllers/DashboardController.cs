using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartScheduleBackend.Data;
using SmartScheduleBackend.Models;
using System.Globalization;

namespace SmartScheduleBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            try
            {
                // Last 7 days including today
                var today = DateTime.UtcNow.Date;
                var sevenDaysAgo = today.AddDays(-6);
                


                // Prepare list for last 7 days to ensure all days are represented even if 0
                var result = new List<object>();
                
                // Fetch raw data to perform distinct counting in memory to avoid EF Core translation issues with grouping by complex keys
                var rawData = await _context.Timetables
                    .Where(t => t.CreatedAt >= sevenDaysAgo)
                    .Select(t => new { t.CreatedAt, t.AcademicClassId, t.Version })
                    .ToListAsync();

                for (int i = 0; i < 7; i++)
                {
                    var date = sevenDaysAgo.AddDays(i);
                    // Count unique (AcademicClassId, Version) pairs for this day
                    var count = rawData
                        .Where(t => t.CreatedAt.Date == date)
                        .Select(t => new { t.AcademicClassId, t.Version })
                        .Distinct()
                        .Count();
                    
                    result.Add(new
                    {
                        day = date.ToString("ddd"), // "Mon", "Tue", etc.
                        fullDate = date.ToString("MMM dd"), // "Dec 24"
                        generations = count,
                        conflicts = 0 // Placeholder
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
