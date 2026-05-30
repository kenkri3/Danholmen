import type { ReactNode } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Calendar, AlertCircle, Menu } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { getCurrentAdmin, getBookings, getSaunas } from "@/data/store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  getCurrentAdmin();

  const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    "/dashboard": { title: "Dashboard", subtitle: "Oversikt over badstuer og booking" },
    "/booking": { title: "Booking Kalender", subtitle: "Administrer timebestillinger" },
    "/saunas": { title: "Badstuer", subtitle: "Oversikt og innstillinger" },
    "/members": { title: "Medlemmer", subtitle: "Danholmen Medlem (349 kr/mnd) og VEL-medlemmer" },
    "/discounts": { title: "Rabattkoder", subtitle: "Administrer kampanjer og rabatter" },
    "/campaigns": { title: "Kampanjer", subtitle: "Tidsbegrensede rabattkampanjer" },
    "/reports": { title: "Rapporter", subtitle: "M\u00E5nedlige rapporter og statistikk" },
    "/payments": { title: "Innbetalinger", subtitle: "Oversikt over alle betalinger" },
    "/admins": { title: "Administratorer", subtitle: "Brukeradministrasjon og roller" },
  };

  const pageInfo = pageTitles[location.pathname] ?? {
    title: "Danholmen Badstuer",
  };

  const todayStr = format(new Date(), "EEEE d. MMMM yyyy", { locale: nb });

  // Pending bookings for notifications
  const bookings = getBookings();
  const saunas = getSaunas();
  const pendingBookings = bookings
    .filter((b) => b.status === "pending")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-[100dvh] flex overflow-x-hidden">
      <Navbar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-h-[100dvh] md:ml-[72px] xl:ml-[260px]">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#DDD6CC] flex items-center justify-between px-3 sm:px-4 md:px-6 xl:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileOpen((m) => !m)}
              className="xl:hidden z-40 p-2 rounded-lg bg-deep-teal text-white shadow-md touch-target flex-shrink-0"
              aria-label="Åpne meny"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-text-primary leading-tight truncate">
              {pageInfo.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4 xl:gap-6 flex-shrink-0">
            {/* Notification bell with popover */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg text-text-secondary hover:bg-off-white transition-colors touch-target flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                  {pendingCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink rounded-full" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-0 bg-white border border-[#DDD6CC] rounded-xl shadow-lg"
              >
                <div className="px-4 py-3 border-b border-[#F5F0EB]">
                  <h3 className="font-semibold text-sm text-text-primary">
                    Varsler
                  </h3>
                  {pendingCount > 0 ? (
                    <p className="text-xs text-text-secondary mt-0.5">
                      {pendingCount} booking{pendingCount > 1 ? "er" : ""} venter
                      p&aring; bekreftelse
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary mt-0.5">
                      Ingen nye varsler
                    </p>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {pendingCount === 0 ? (
                    <div className="px-4 py-6 text-center text-text-tertiary text-sm">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      Ingen ventende bookinger
                    </div>
                  ) : (
                    pendingBookings.map((booking) => {
                      const sauna = saunas.find(
                        (s) => s.id === booking.saunaId
                      );
                      return (
                        <button
                          key={booking.id}
                          onClick={() => {
                            setOpen(false);
                            navigate("/booking");
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-off-white transition-colors border-b border-[#F5F0EB] last:border-b-0 flex items-start gap-3"
                        >
                          <Calendar className="w-4 h-4 text-brand-pink mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {booking.customerName}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {sauna?.name} &bull;{" "}
                              {format(
                                new Date(booking.date + "T00:00:00"),
                                "d. MMM",
                                { locale: nb }
                              )}{" "}
                              &bull; {booking.startTime}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {pendingCount > 0 && (
                  <div className="px-4 py-2 border-t border-[#F5F0EB]">
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate("/booking");
                      }}
                      className="text-xs text-brand-pink hover:text-amber-deep font-medium transition-colors"
                    >
                      Se alle bookinger &rarr;
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Current date — hidden on mobile */}
            <span className="hidden sm:block font-mono text-[13px] text-text-secondary capitalize flex-shrink-0">
              {todayStr}
            </span>

            {/* Quick action — visible on all screens, icon-only on mobile */}
            <button
              onClick={() => navigate("/booking")}
              className="flex items-center gap-2 bg-brand-pink hover:bg-pink-light text-white text-sm font-medium px-3 py-2 rounded-lg shadow-amber-btn hover:shadow-amber-btn-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 touch-target"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Ny Booking</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 p-3 sm:p-4 md:p-6 xl:p-8 overflow-y-auto overflow-x-hidden"
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </motion.main>
        </AnimatePresence>

        <Footer />
      </div>
    </div>
  );
}
