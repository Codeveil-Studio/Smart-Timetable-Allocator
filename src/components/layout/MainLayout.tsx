import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64 ml-0 transition-all duration-300 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-6 flex-1">
          {children}
        </main>
        <footer className="py-6 border-t border-sidebar-hover text-center text-sm text-sidebar-text bg-sidebar-bg">
          Smart Timetable Allocator 2025 | Powered by Codeveil Studio
        </footer>
      </div>
    </div>
  );
};
