import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";
import { BookOpen, Users, Home, Calendar, AlertCircle, Clock, Layers } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const Dashboard = () => {
  const [courseCount, setCourseCount] = useState(0);
  const [instructorCount, setInstructorCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const [timetableStats, setTimetableStats] = useState({ totalTimetables: 0, totalVersions: 0, lastGenerated: null as string | null });

  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, instructorsRes, roomsRes, statsRes] = await Promise.all([
          fetch(`${API_BASE}/courses`),
          fetch(`${API_BASE}/instructors`),
          fetch(`${API_BASE}/rooms`),
          fetch(`${API_BASE}/timetable/stats`),
        ]);
        const courses = await coursesRes.json();
        const instructors = await instructorsRes.json();
        const rooms = await roomsRes.json();
        const stats = await statsRes.json();

        setCourseCount(Array.isArray(courses) ? courses.length : 0);
        setInstructorCount(Array.isArray(instructors) ? instructors.length : 0);
        setRoomCount(Array.isArray(rooms) ? rooms.length : 0);
        setTimetableStats({
          totalTimetables: stats.totalTimetables || 0,
          totalVersions: stats.totalVersions || 0,
          lastGenerated: stats.lastGenerated
        });
      } catch {
        setCourseCount(0);
        setInstructorCount(0);
        setRoomCount(0);
        setTimetableStats({ totalTimetables: 0, totalVersions: 0, lastGenerated: null });
      }
    })();
  }, []);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

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
            value={timetableStats.totalTimetables}
            icon={Calendar}
            color="text-primary"
          />
          <QuickStatsCard
            title="Total Versions"
            value={timetableStats.totalVersions}
            icon={Layers}
            color="text-secondary"
          />
          <QuickStatsCard
            title="Last Generated"
            value={formatTimeAgo(timetableStats.lastGenerated)}
            icon={Clock}
            color="text-accent"
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
