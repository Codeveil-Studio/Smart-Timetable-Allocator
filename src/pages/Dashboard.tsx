import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";
import { BookOpen, Users, Home, Calendar, AlertCircle, Clock } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Courses"
          value={48}
          icon={BookOpen}
          gradient="from-primary/10 to-primary/5"
          iconBgColor="bg-primary"
        />
        <SummaryCard
          title="Total Sections"
          value={124}
          icon={Users}
          gradient="from-accent/10 to-accent/5"
          iconBgColor="bg-accent"
        />
        <SummaryCard
          title="Total Instructors"
          value={32}
          icon={Users}
          gradient="from-secondary/10 to-secondary/5"
          iconBgColor="bg-secondary"
        />
        <SummaryCard
          title="Total Rooms"
          value={18}
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
