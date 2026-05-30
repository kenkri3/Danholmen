import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Flame,
  Users,
  Tag,
  Megaphone,
  FileText,
  CreditCard,
  Shield,
  LogOut,
  Globe,
  ChevronLeft,
  ChevronRight,
  Flame as FlameIcon,
  X,
  Sparkles,
} from "lucide-react";
import { getCurrentAdmin, logout } from "@/data/store";
import type { AdminUser } from "@/data/types";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/booking", label: "Booking Kalender", icon: CalendarDays },
  { path: "/saunas", label: "Badstuer", icon: Flame },
  { path: "/members", label: "Medlemmer", icon: Users },
  { path: "/discounts", label: "Rabattkoder", icon: Tag },
  { path: "/membership-tiers", label: "Medlemsnivåer", icon: Sparkles },
  { path: "/campaigns", label: "Kampanjer", icon: Megaphone },
  { path: "/reports", label: "Rapporter", icon: FileText },
  { path: "/payments", label: "Innbetalinger", icon: CreditCard },
  { path: "/website", label: "Nettside", icon: Globe },
  { path: "/admins", label: "Administratorer", icon: Shield },
];

interface NavbarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Navbar({ mobileOpen, setMobileOpen }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const current = getCurrentAdmin();
    if (current) setAdmin(current);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [navigate]);

  const toggleSidebar = () => setCollapsed((c) => !c);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="xl:hidden fixed inset-0 z-40 glass-overlay"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 72 : 260,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className={`fixed left-0 top-0 h-full bg-deep-teal z-50 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        } transition-transform duration-300 xl:transition-none`}
        style={{ width: mobileOpen ? 280 : collapsed ? 72 : 260 }}
      >
        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="xl:hidden absolute top-4 right-4 text-white/60 hover:text-white z-10"
          aria-label="Lukk meny"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo area */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 min-h-[72px]">
          <a href="#/" className="flex items-center" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
            <img 
              src="/danholmen-logo.png" 
              alt="Danholmen" 
              className={`flex-shrink-0 ${collapsed && !mobileOpen ? 'h-8 w-auto' : 'h-9 w-auto'}`}
            />
          </a>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative touch-target ${
                  isActive
                    ? "bg-[rgba(212,134,60,0.1)] text-white"
                    : "text-white/70 hover:text-white/90 hover:bg-white/5"
                }`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-pink rounded-r-full"
                  />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {(!collapsed || mobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="text-[13px] font-medium uppercase tracking-[0.06em] whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Bottom: user profile */}
        <div className="px-3 pb-4">
          <div className="border-t border-white/10 pt-4 mt-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {admin?.name?.charAt(0) ?? "A"}
                </span>
              </div>
              <AnimatePresence>
                {(!collapsed || mobileOpen) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-white text-[13px] font-medium truncate">
                      {admin?.name ?? "Administrator"}
                    </p>
                    <p className="text-text-muted text-[11px]">
                      {admin?.role === "superadmin"
                        ? "Superadmin"
                        : admin?.role === "manager"
                          ? "Leder"
                          : "Seer"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200 mt-1 touch-target"
              title={collapsed && !mobileOpen ? "Logg ut" : undefined}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {(!collapsed || mobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[13px] whitespace-nowrap overflow-hidden"
                  >
                    Logg ut
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Collapse toggle (desktop only, hidden on mobile open) */}
        {!mobileOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden xl:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-deep-teal border border-white/20 rounded-full items-center justify-center text-white/60 hover:text-white transition-colors z-10"
            aria-label={collapsed ? "Utvid sidemeny" : "Kollaps sidemeny"}
          >
            {collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </button>
        )}
      </motion.aside>
    </>
  );
}
