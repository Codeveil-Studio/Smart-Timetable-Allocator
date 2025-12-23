import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { LayoutGrid, Calendar, Table, ChevronLeft, ChevronRight, GraduationCap, GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutGrid },
  { title: "Set Availibility", path: "/generate", icon: Calendar },
  { title: "Generate Timetable", path: "/generate-timetable", icon: Calendar },
  { title: "View Timetable", path: "/view", icon: Table },
  { title: "Compare Timetables", path: "/compare", icon: GitCompare },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex fixed left-0 top-0 h-screen bg-sidebar-bg transition-all duration-300 z-40 flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between border-b border-sidebar-hover">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm">Smart Timetable</span>
              <span className="text-sidebar-text text-xs">System</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-text hover:bg-sidebar-hover transition-all duration-300 group"
            activeClassName="bg-sidebar-active text-white shadow-glow"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium text-sm">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="m-4 p-3 rounded-xl bg-sidebar-hover hover:bg-primary text-sidebar-text hover:text-white transition-all duration-300 flex items-center justify-center"
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
};
