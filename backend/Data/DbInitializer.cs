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
                    time_slot_id integer REFERENCES time_slot(id),
                    version integer DEFAULT 1
                );

                CREATE TABLE IF NOT EXISTS class_off_days (
                    id serial PRIMARY KEY,
                    academic_class_id integer REFERENCES academic_class(id),
                    day text NOT NULL
                );
            ";

            // Add version column if it doesn't exist (migration-like behavior)
            var checkColSql = @"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name='timetable' AND column_name='version') THEN
                        ALTER TABLE timetable ADD COLUMN version integer DEFAULT 1;
                    END IF;
                END $$;
            ";
            context.Database.ExecuteSqlRaw(checkColSql);

            context.Database.ExecuteSqlRaw(sql);
        }
    }
}
