import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const ChartCard = () => {
  const [data, setData] = useState([
    { day: "Mon", generations: 0, conflicts: 0 },
    { day: "Tue", generations: 0, conflicts: 0 },
    { day: "Wed", generations: 0, conflicts: 0 },
    { day: "Thu", generations: 0, conflicts: 0 },
    { day: "Fri", generations: 0, conflicts: 0 },
    { day: "Sat", generations: 0, conflicts: 0 },
    { day: "Sun", generations: 0, conflicts: 0 },
  ]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/analytics`);
        if (res.ok) {
          const analyticsData = await res.json();
          if (Array.isArray(analyticsData) && analyticsData.length > 0) {
            setData(analyticsData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <Card className="p-6 shadow-soft-md hover:shadow-soft-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-foreground mb-4">Timetable Analytics (Last 7 Days)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
            />
            <Legend />
            <Bar 
              dataKey="generations" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              name="Timetable Generations"
            />
            <Bar 
              dataKey="conflicts" 
              fill="hsl(var(--destructive))" 
              radius={[8, 8, 0, 0]}
              name="Conflicts"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
