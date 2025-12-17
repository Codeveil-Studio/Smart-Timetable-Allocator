using Microsoft.EntityFrameworkCore;

namespace SmartScheduleBackend.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Ensure database connection
            try 
            {
                context.Database.OpenConnection();
                context.Database.CloseConnection();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Could not connect to database: " + ex.Message);
                return;
            }

            // Create tables manually using raw SQL because we are mixing existing and new tables
            // and want to avoid migration issues in this environment.

            var sql = @"
                CREATE TABLE IF NOT EXISTS academic_class (
                    id serial PRIMARY KEY,
                    name text NOT NULL
                );

                CREATE TABLE IF NOT EXISTS time_slot (
                    id serial PRIMARY KEY,
                    day text NOT NULL,
                    start_time time NOT NULL,
                    end_time time NOT NULL
                );

                CREATE TABLE IF NOT EXISTS timetable (
                    id serial PRIMARY KEY,
                    academic_class_id integer REFERENCES academic_class(id),
                    course_id integer REFERENCES courses(id),
                    instructor_id integer REFERENCES instructors(id),
                    room_id integer REFERENCES rooms(id),
                    time_slot_id integer REFERENCES time_slot(id)
                );
            ";

            context.Database.ExecuteSqlRaw(sql);
        }
    }
}
