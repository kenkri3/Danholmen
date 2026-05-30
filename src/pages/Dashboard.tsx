import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  CalendarDays,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import {
  getCurrentAdmin,
  getFilteredSaunasForAdmin,
  getFilteredBookingsForAdmin,
  getMembers,
} from "@/data/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default function Dashboard() {
  const admin = getCurrentAdmin();
  const saunas = useMemo(() => getFilteredSaunasForAdmin(admin), [admin]);
  const bookings = useMemo(
    () => getFilteredBookingsForAdmin(admin),
    [admin]
  );
  const allMembers = getMembers();

  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter((b) => b.date === today);

  const stats = useMemo(() => {
    const confirmedBookings = bookings.filter(
      (b) => b.status === "confirmed"
    );
    const pendingBookings = bookings.filter((b) => b.status === "pending");
    const cancelledBookings = bookings.filter(
      (b) => b.status === "cancelled"
    );
    const internalBookings = bookings.filter((b) => b.isInternal);
    const revenue = confirmedBookings
      .filter((b) => !b.isInternal)
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Count vel-medlem members (tier === "vel")
    const velMembers = allMembers.filter((m) => m.tier === "vel");

    return {
      totalSaunas: saunas.length,
      totalBookings: bookings.length,
      totalMembers: allMembers.length,
      todayBookings: todayBookings.length,
      confirmedBookings: confirmedBookings.length,
      pendingBookings: pendingBookings.length,
      cancelledBookings: cancelledBookings.length,
      internalBookings: internalBookings.length,
      velMembers: velMembers.length,
      revenue,
    };
  }, [saunas, bookings, allMembers, todayBookings.length]);

  const statCards = [
    {
      label: "Badstuer",
      value: stats.totalSaunas,
      icon: Flame,
      color: "text-teal",
      bg: "bg-teal/10",
    },
    {
      label: "Dagens bookinger",
      value: stats.todayBookings,
      icon: CalendarDays,
      color: "text-brand-pink",
      bg: "bg-brand-pink/10",
    },
    {
      label: "Medlemmer",
      value: stats.totalMembers,
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Inntekt (kr)",
      value: stats.revenue.toLocaleString("no-NO"),
      icon: CreditCard,
      color: "text-sauna-red",
      bg: "bg-sauna-red/10",
    },
  ];

  const statusBreakdown = [
    {
      label: "Bekreftet",
      value: stats.confirmedBookings,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Venter",
      value: stats.pendingBookings,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Avbrutt",
      value: stats.cancelledBookings,
      icon: XCircle,
      color: "text-sauna-red",
      bg: "bg-sauna-red/10",
    },
    {
      label: "Interne",
      value: stats.internalBookings,
      icon: Building2,
      color: "text-text-muted",
      bg: "bg-gray-100",
    },
  ];

  // Upcoming bookings (next 7 days)
  const upcomingBookings = useMemo(() => {
    const futureBookings = bookings.filter(
      (b) => b.date >= today && b.status !== "cancelled"
    );
    return futureBookings.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [bookings, today]);

  // Recent bookings (last 14 days)
  const recentBookings = useMemo(() => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 14);
    const pastIso = pastDate.toISOString().split("T")[0];
    return bookings
      .filter((b) => b.date >= pastIso)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 10);
  }, [bookings]);

  // Sauna utilization
  const saunaStats = useMemo(() => {
    return saunas.map((sauna) => {
      const saunaBookings = bookings.filter((b) => b.saunaId === sauna.id);
      const confirmed = saunaBookings.filter(
        (b) => b.status === "confirmed"
      );
      return {
        sauna,
        total: saunaBookings.length,
        confirmed: confirmed.length,
        revenue: confirmed
          .filter((b) => !b.isInternal)
          .reduce((sum, b) => sum + b.totalPrice, 0),
      };
    });
  }, [saunas, bookings]);

  // Vel-medlem stats
  const velMembersList = useMemo(
    () => allMembers.filter((m) => m.tier === "vel"),
    [allMembers]
  );

  const saunaName = (id: string) =>
    saunas.find((s) => s.id === id)?.name ?? id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Dashboard"
        description="Oversikt over badstuer, bookinger og medlemmer"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5 card-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
            <p className="text-sm text-text-secondary mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary stats: status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {statusBreakdown.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + idx * 0.04 }}
            className="bg-white rounded-xl border border-[#DDD6CC] shadow-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {item.value}
              </p>
            </div>
            <p className="text-xs text-text-secondary">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Upcoming bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-text-primary">
              Kommende bookinger
            </h2>
            <span className="text-xs text-text-muted">
              {upcomingBookings.length} totalt
            </span>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">
                Ingen kommende bookinger.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {upcomingBookings.slice(0, 8).map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#DDD6CC]/60 hover:border-[#DDD6CC] transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-off-white flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-text-muted uppercase">
                      {new Date(booking.date).toLocaleString("no-NO", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-sm font-bold text-text-primary leading-tight">
                      {new Date(booking.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {booking.customerName}
                    </p>
                    <p className="text-xs text-text-muted">
                      {booking.startTime}–{booking.endTime} ·{" "}
                      {saunaName(booking.saunaId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge type={booking.type} variant="type" />
                    <StatusBadge status={booking.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-text-primary">
              Nylig aktivitet
            </h2>
            <span className="text-xs text-text-muted">Siste 14 dager</span>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">Ingen nylig aktivitet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {recentBookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[#DDD6CC]/60 hover:border-[#DDD6CC] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-off-white flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">
                        {booking.customerName}
                      </span>{" "}
                      booket{" "}
                      {booking.type === "private"
                        ? "privat badstue"
                        : booking.type === "felles"
                          ? "felles badstue"
                          : "intern tid"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {booking.date} · {saunaName(booking.saunaId)}
                      {booking.totalPrice > 0
                        ? ` · ${booking.totalPrice.toLocaleString("no-NO")} kr`
                        : " · Gratis"}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Sauna utilization table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-text-primary">
            Badstueoversikt
          </h2>
          <span className="text-xs text-text-muted">
            {saunas.length} badstuer tilgjengelig
          </span>
        </div>

        {saunaStats.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">Ingen badstuer tilgjengelig.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-off-white/50">
                    <TableHead className="font-semibold text-text-primary">Badstue</TableHead>
                    <TableHead className="font-semibold text-text-primary">Type</TableHead>
                    <TableHead className="font-semibold text-text-primary text-center">Bookinger</TableHead>
                    <TableHead className="font-semibold text-text-primary text-center">Bekreftet</TableHead>
                    <TableHead className="font-semibold text-text-primary text-right">Inntekt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saunaStats.map((ss) => (
                    <TableRow key={ss.sauna.id} className="border-b hover:bg-off-white/30">
                      <TableCell className="font-medium text-text-primary">{ss.sauna.name}</TableCell>
                      <TableCell>
                        <span className="capitalize text-sm text-text-secondary">
                          {ss.sauna.type === "floating" ? "Flytende" : ss.sauna.type === "wood-fired" ? "Vedfyrt" : "Elektrisk"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-text-primary">{ss.total}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">{ss.confirmed}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-text-primary">
                        {ss.revenue > 0 ? `${ss.revenue.toLocaleString("no-NO")} kr` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {saunaStats.map((ss) => (
                <div key={ss.sauna.id} className="bg-white rounded-xl border border-[#DDD6CC] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary text-base">{ss.sauna.name}</span>
                    <span className="text-xs text-text-muted">
                      {ss.sauna.type === "floating" ? "Flytende" : ss.sauna.type === "wood-fired" ? "Vedfyrt" : "Elektrisk"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{ss.total} bookinger</span>
                    <span className="text-text-muted">{ss.confirmed} bekreftet</span>
                    <span className="font-medium text-text-primary">{ss.revenue > 0 ? `${ss.revenue.toLocaleString("no-NO")} kr` : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Vel-medlem tier section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
            <Users className="w-5 h-5 text-vel-member" />
            Vel-medlemmer
          </h2>
          <span className="text-xs text-text-muted">
            {velMembersList.length} medlemmer
          </span>
        </div>

        {velMembersList.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">Ingen vel-medlemmer ennå.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-off-white/50">
                    <TableHead className="font-semibold text-text-primary">Navn</TableHead>
                    <TableHead className="font-semibold text-text-primary">E-post</TableHead>
                    <TableHead className="font-semibold text-text-primary">Lag</TableHead>
                    <TableHead className="font-semibold text-text-primary text-center">Rabatt</TableHead>
                    <TableHead className="font-semibold text-text-primary text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {velMembersList.map((member) => (
                    <TableRow key={member.id} className="border-b hover:bg-off-white/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-vel-member/10 text-vel-member">VEL</span>
                          <span className="font-medium text-text-primary">{member.firstName} {member.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-text-secondary">{member.email}</TableCell>
                      <TableCell className="text-sm text-text-secondary capitalize">{member.localAssociation ?? "—"}</TableCell>
                      <TableCell className="text-center text-sm text-text-primary">
                        {member.localDiscountRate > 0 ? `${Math.round(member.localDiscountRate * 100)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {member.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">Aktiv</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sauna-red/10 text-sauna-red">Inaktiv</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-3">
              {velMembersList.map((member) => (
                <div key={member.id} className="bg-white rounded-xl border border-[#DDD6CC] p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-vel-member/10 flex items-center justify-center text-[10px] font-bold text-vel-member shrink-0">VEL</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-primary truncate">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-text-muted truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">{member.localAssociation ?? "—"}</span>
                    <span className="text-brand-pink font-medium">{member.localDiscountRate > 0 ? `${Math.round(member.localDiscountRate * 100)}%` : "—"}</span>
                    <span className={member.isActive ? "text-success" : "text-sauna-red"}>{member.isActive ? "Aktiv" : "Inaktiv"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
