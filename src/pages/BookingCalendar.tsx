import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Users,
  Lock,
  Search,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  getCurrentAdmin,
  getFilteredSaunasForAdmin,
  getFilteredBookingsForAdmin,
} from "@/data/store";
import type { Booking } from "@/data/types";

type FilterStatus = "all" | "confirmed" | "pending" | "cancelled";
type FilterType = "all" | "private" | "felles" | "internal";

const dayLabels = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const monthLabels = [
  "Januar",
  "Februar",
  "Mars",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function getCalendarDays(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday start
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  for (let i = 0; i < startDay; i++) {
    const d = new Date(year, month, -startDay + i + 1);
    days.push(d);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

export default function BookingCalendar() {
  const admin = getCurrentAdmin();
  const saunas = useMemo(() => getFilteredSaunasForAdmin(admin), [admin]);
  const allBookings = useMemo(
    () => getFilteredBookingsForAdmin(admin),
    [admin]
  );

  const [selectedSaunaId, setSelectedSaunaId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // If selectedSaunaId is no longer in the filtered list, fallback to "all"
  const activeSaunaId = useMemo(() => {
    if (selectedSaunaId === "all") return "all";
    if (saunas.find((s) => s.id === selectedSaunaId)) return selectedSaunaId;
    return "all";
  }, [saunas, selectedSaunaId]);

  const filteredBookings = useMemo(() => {
    let result = allBookings;

    if (activeSaunaId !== "all") {
      result = result.filter((b) => b.saunaId === activeSaunaId);
    }
    if (filterStatus !== "all") {
      result = result.filter((b) => b.status === filterStatus);
    }
    if (filterType !== "all") {
      result = result.filter((b) => b.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.customerName.toLowerCase().includes(q) ||
          b.customerEmail.toLowerCase().includes(q) ||
          b.date.includes(q)
      );
    }
    return result;
  }, [allBookings, activeSaunaId, filterStatus, filterType, searchQuery]);

  const calendarDays = useMemo(
    () => getCalendarDays(calYear, calMonth),
    [calYear, calMonth]
  );

  function bookingsForDate(date: Date): Booking[] {
    const iso = date.toISOString().split("T")[0];
    return filteredBookings.filter((b) => b.date === iso);
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  const saunaName = (id: string) =>
    saunas.find((s) => s.id === id)?.name ?? id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Booking Kalender"
        description="Administrer timebestillinger for alle badstuer"
      />

      {/* Sauna tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedSaunaId("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSaunaId === "all"
              ? "bg-teal text-white shadow-md"
              : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-teal/30"
          }`}
        >
          Alle badstuer
        </button>
        {saunas.map((sauna) => (
          <button
            key={sauna.id}
            onClick={() => setSelectedSaunaId(sauna.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSaunaId === sauna.id
                ? "bg-teal text-white shadow-md"
                : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-teal/30"
            }`}
          >
            {sauna.name}
          </button>
        ))}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {/* Status filters */}
          {(
            [
              ["all", "Alle"],
              ["confirmed", "Bekreftet"],
              ["pending", "Venter"],
              ["cancelled", "Avbrutt"],
            ] as [FilterStatus, string][]
          ).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatus === status
                  ? "bg-deep-teal text-white"
                  : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-teal/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {/* Type filters */}
          {(
            [
              ["all", "Alle typer"],
              ["private", "Privat"],
              ["felles", "Felles"],
              ["internal", "Intern"],
            ] as [FilterType, string][]
          ).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterType === type
                  ? "bg-warm-amber text-white"
                  : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-warm-amber/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + View toggle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Søk etter navn, e-post eller dato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-white rounded-lg border border-[#DDD6CC] p-0.5">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "calendar"
                ? "bg-deep-teal text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Kalender
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "list"
                ? "bg-deep-teal text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-text-muted mb-4">
        {filteredBookings.length} booking{filteredBookings.length !== 1 ? "er" : ""} funnet
      </p>

      {/* Calendar View */}
      <AnimatePresence mode="wait">
        {viewMode === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden"
          >
            {/* Calendar header */}
            <div className="flex items-center justify-between p-4 border-b border-[#DDD6CC]">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-off-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-text-primary" />
              </button>
              <h3 className="font-display text-lg font-bold text-text-primary">
                {monthLabels[calMonth]} {calYear}
              </h3>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-off-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-text-primary" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#DDD6CC]">
              {dayLabels.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold text-text-muted uppercase"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, idx) => {
                const iso = date.toISOString().split("T")[0];
                const dayBookings = bookingsForDate(date);
                const isCurrentMonth = date.getMonth() === calMonth;
                const isToday =
                  iso === new Date().toISOString().split("T")[0];

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.003 }}
                    className={`min-h-[100px] sm:min-h-[120px] border-b border-r border-[#DDD6CC] p-1.5 ${
                      !isCurrentMonth ? "bg-off-white/30" : ""
                    } ${isToday ? "bg-teal/5" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-teal text-white"
                            : isCurrentMonth
                              ? "text-text-primary"
                              : "text-text-muted"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayBookings.length > 0 && (
                        <span className="text-[10px] text-text-muted font-medium">
                          {dayBookings.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <div
                          key={booking.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 ${
                            booking.status === "cancelled"
                              ? "bg-sauna-red/10 text-sauna-red line-through"
                              : booking.type === "private"
                                ? "bg-sauna-red/10 text-sauna-red"
                                : booking.type === "felles"
                                  ? "bg-success/10 text-success"
                                  : "bg-gray-100 text-text-muted"
                          }`}
                        >
                          {booking.type === "private" ? (
                            <Lock className="w-2.5 h-2.5 shrink-0" />
                          ) : booking.type === "felles" ? (
                            <Users className="w-2.5 h-2.5 shrink-0" />
                          ) : null}
                          {booking.startTime} {booking.customerName.split(" ")[0]}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <p className="text-[10px] text-text-muted pl-1">
                          +{dayBookings.length - 3} til
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* List View */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden"
          >
            <div className="overflow-x-auto scrollbar-hide">
              <Table className="min-w-0 w-full">
                <TableHeader>
                  <TableRow className="bg-off-white/50">
                    <TableHead className="font-semibold text-text-primary whitespace-normal">
                      Dato/Tid
                    </TableHead>
                    <TableHead className="font-semibold text-text-primary hidden sm:table-cell">
                      Badstue
                    </TableHead>
                    <TableHead className="font-semibold text-text-primary">
                      Kunde
                    </TableHead>
                    <TableHead className="font-semibold text-text-primary hidden sm:table-cell">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-text-primary">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-text-primary text-right">
                      Pris
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-12 text-text-muted"
                      >
                        <CalendarDays className="w-10 h-10 mx-auto mb-3 text-text-muted" />
                        Ingen bookinger funnet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking, idx) => (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b hover:bg-off-white/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {booking.date}
                              </p>
                              <p className="text-xs text-text-muted">
                                {booking.startTime}–{booking.endTime}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-text-secondary">
                          {saunaName(booking.saunaId)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-text-muted" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {booking.customerName}
                              </p>
                              <p className="text-xs text-text-muted">
                                {booking.participantCount} pers
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge type={booking.type} variant="type" />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-text-primary">
                          {booking.totalPrice > 0
                            ? `${booking.totalPrice.toLocaleString("no-NO")} kr`
                            : "Gratis"}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-text-muted">
        <span className="font-medium">Type:</span>
        <span className="inline-flex items-center gap-1">
          <Lock className="w-3 h-3 text-sauna-red" />
          <span className="w-2.5 h-2.5 rounded-full bg-sauna-red" />
          Privat
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3 text-success" />
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          Felles
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          Intern
        </span>
        {/* Felles med plasser igjen */}
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          Felles (noen plasser)
        </span>
        {/* Vel-medlem tier indicator */}
        <span className="inline-flex items-center gap-1 ml-4">
          <span className="w-2.5 h-2.5 rounded-full bg-vel-member" />
          Vel-medlem (gratis medlem)
        </span>
      </div>
    </motion.div>
  );
}
