import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64 ml-0 transition-all duration-300">
        <Navbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
