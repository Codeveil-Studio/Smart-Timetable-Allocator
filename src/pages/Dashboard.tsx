import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";
import { BookOpen, Users, Home, Calendar, AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const Dashboard = () => {
  const [courseCount, setCourseCount] = useState(0);
  const [instructorCount, setInstructorCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, instructorsRes, roomsRes] = await Promise.all([
          fetch(`${API_BASE}/courses`),
          fetch(`${API_BASE}/instructors`),
          fetch(`${API_BASE}/rooms`),
        ]);
        const courses = await coursesRes.json();
        const instructors = await instructorsRes.json();
        const rooms = await roomsRes.json();
        setCourseCount(Array.isArray(courses) ? courses.length : 0);
        setInstructorCount(Array.isArray(instructors) ? instructors.length : 0);
        setRoomCount(Array.isArray(rooms) ? rooms.length : 0);
      } catch {
        setCourseCount(0);
        setInstructorCount(0);
        setRoomCount(0);
      }
    })();
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Courses"
          value={courseCount}
          icon={BookOpen}
          gradient="from-primary/10 to-primary/5"
          iconBgColor="bg-primary"
        />
        <SummaryCard
          title="Total Sections"
          value={12}
          icon={Users}
          gradient="from-accent/10 to-accent/5"
          iconBgColor="bg-accent"
        />
        <SummaryCard
          title="Total Instructors"
          value={instructorCount}
          icon={Users}
          gradient="from-secondary/10 to-secondary/5"
          iconBgColor="bg-secondary"
        />
        <SummaryCard
          title="Total Rooms"
          value={roomCount}
          icon={Home}
          gradient="from-purple-500/10 to-purple-500/5"
          iconBgColor="bg-purple-500"
        />
      </div>

      {/* Quick Stats Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickStatsCard
            title="Generated Timetables"
            value={156}
            icon={Calendar}
            color="text-primary"
          />
          <QuickStatsCard
            title="Last Generated"
            value="2 hours ago"
            icon={Clock}
            color="text-accent"
          />
          <QuickStatsCard
            title="Pending Conflicts"
            value={3}
            icon={AlertCircle}
            color="text-destructive"
          />
        </div>
      </div>

      {/* Analytics Chart */}
      <div>
        <ChartCard />
      </div>
    </div>
  );
};

export default Dashboard;
