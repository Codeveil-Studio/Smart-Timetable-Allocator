import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { month: "Jan", generations: 12, conflicts: 3 },
  { month: "Feb", generations: 19, conflicts: 5 },
  { month: "Mar", generations: 15, conflicts: 2 },
  { month: "Apr", generations: 25, conflicts: 4 },
  { month: "May", generations: 22, conflicts: 1 },
  { month: "Jun", generations: 30, conflicts: 6 },
];

export const ChartCard = () => {
  return (
    <Card className="p-6 shadow-soft-md hover:shadow-soft-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-foreground mb-4">Timetable Analytics</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
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
