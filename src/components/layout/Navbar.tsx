import { LogOut, User, Menu, LayoutGrid, Calendar, Table } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { NavLink } from "@/components/NavLink";

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/":
      return "Dashboard";
    case "/generate":
      return "Generate Timetable";
    case "/view":
      return "View Timetable";
    default:
      return "Dashboard";
  }
};

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutGrid },
  { title: "Generate Timetable", path: "/generate", icon: Calendar },
  { title: "View Timetable", path: "/view", icon: Table },
];

export const Navbar = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <button className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition">
                <Menu className="w-5 h-5" />
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <DrawerClose asChild key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted transition"
                      activeClassName="bg-sidebar-active text-white"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </NavLink>
                  </DrawerClose>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden xs:flex items-center gap-3 px-3 sm:px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-300 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-foreground">Admin</span>
            <span className="text-xs text-muted-foreground">Administrator</span>
          </div>
        </div>

        <button
          className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-300"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
