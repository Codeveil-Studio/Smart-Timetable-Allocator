import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export const QuickStatsCard = ({
  title,
  value,
  icon: Icon,
  color = "text-primary",
}: QuickStatsCardProps) => {
  return (
    <Card className="p-5 shadow-soft hover:shadow-soft-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl bg-muted flex items-center justify-center", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
};
