import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  iconBgColor?: string;
}

export const SummaryCard = ({
  title,
  value,
  icon: Icon,
  gradient = "from-primary/10 to-primary/5",
  iconBgColor = "bg-primary",
}: SummaryCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-card shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group",
        "border border-border/50"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />
      
      <div className="relative p-6 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-4xl font-bold text-foreground">{value}</h3>
        </div>
        
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300",
            iconBgColor
          )}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};
