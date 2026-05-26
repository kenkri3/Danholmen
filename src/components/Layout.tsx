import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout, isLoggedIn } from "@/data/store";
import {
  LayoutDashboard,
  CalendarDays,
  Flame,
  Users,
  Tag,
  Megaphone,
  FileText,
  Shield,
  CreditCard,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "#/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "#/booking", label: "Bookingkalender", icon: CalendarDays },
  { path: "#/saunas", label: "Badstuer", icon: Flame },
  { path: "#/members", label: "Medlemmer", icon: Users },
  { path: "#/discounts", label: "Rabattkoder", icon: Tag },
  { path: "#/campaigns", label: "Kampanjer", icon: Megaphone },
  { path: "#/reports", label: "Rapporter", icon: FileText },
  { path: "#/admins", label: "Administratorer", icon: Shield },
  { path: "#/payments", label: "Innbetalinger", icon: CreditCard },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!isLoggedIn()) {
    navigate("/");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b sticky top-0 z-40 md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-bold text-lg">Danholmen</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Meny"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t bg-white px-4 py-2 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path.replace("#", "");
              return (
                <Link
                  key={item.path}
                  to={item.path.replace("#", "")}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium min-h-[44px]",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 min-h-[44px]"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logg ut
            </button>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r min-h-screen sticky top-0">
          <div className="p-4 border-b">
            <span className="font-bold text-xl">Danholmen</span>
            <p className="text-xs text-gray-500 mt-0.5">Admin</p>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path.replace("#", "");
              return (
                <Link
                  key={item.path}
                  to={item.path.replace("#", "")}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Logg ut
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
