import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Download,
  Eye,
  Copy,
  Check,
  TrendingUp,
  Calendar,
  Hash,
  BarChart3,
  ChevronDown,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getBookings, getSaunas } from "@/data/store";
import type { Booking } from "@/data/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatNOK(n: number) {
  return `kr ${n.toLocaleString("no-NO")}`;
}

function formatDateNO(dateStr: string) {
  try {
    return format(new Date(dateStr + "T00:00:00"), "d. MMM yyyy", { locale: nb });
  } catch {
    return dateStr;
  }
}

function getStartOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getFullYear() === year && d.getMonth() === month;
}

function isSameWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d >= weekStart && d <= weekEnd;
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type DateFilter = "all" | "week" | "month" | "prevMonth" | "year";
type PaymentStatusFilter = "all" | "paid" | "free" | "pending";

interface PaymentRow {
  booking: Booking;
  saunaName: string;
}

/* ------------------------------------------------------------------ */
/*  Toast                                                             */
/* ------------------------------------------------------------------ */

function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 120 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 120 }}
      className="fixed top-4 right-4 z-50 bg-deep-teal text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3"
    >
      <Check className="w-4 h-4 text-success flex-shrink-0" />
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/60 hover:text-white">
        &times;
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Payments Page                                                */
/* ------------------------------------------------------------------ */

export default function Payments() {
  const bookings = getBookings();
  const saunas = getSaunas();

  const [saunaFilter, setSaunaFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* ---- Filtered payment rows ---- */
  const paymentRows: PaymentRow[] = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const weekStart = getStartOfWeek(new Date(now));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return bookings
      .filter((b) => b.status === "confirmed")
      .filter((b) => {
        if (saunaFilter === "all") return true;
        return b.saunaId === saunaFilter;
      })
      .filter((b) => {
        if (dateFilter === "all") return true;
        if (dateFilter === "week") return isSameWeek(b.date, weekStart, weekEnd);
        if (dateFilter === "month")
          return isSameMonth(b.date, currentYear, currentMonth);
        if (dateFilter === "prevMonth")
          return isSameMonth(
            b.date,
            currentMonth === 0 ? currentYear - 1 : currentYear,
            currentMonth === 0 ? 11 : currentMonth - 1
          );
        if (dateFilter === "year") {
          const d = new Date(b.date + "T00:00:00");
          return d.getFullYear() === currentYear;
        }
        return true;
      })
      .filter((b) => {
        if (statusFilter === "all") return true;
        return b.paymentStatus === statusFilter;
      })
      .map((b) => ({
        booking: b,
        saunaName: saunas.find((s) => s.id === b.saunaId)?.name ?? "Ukjent",
      }))
      .sort((a, b) => new Date(b.booking.date).getTime() - new Date(a.booking.date).getTime());
  }, [bookings, saunas, saunaFilter, dateFilter, statusFilter]);

  /* ---- KPI calculations ---- */
  const kpis = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const paidBookings = bookings.filter(
      (b) => b.status === "confirmed" && b.paymentStatus === "paid"
    );

    const totalRevenue = paidBookings.reduce((s, b) => s + b.totalPrice, 0);

    const thisMonthRevenue = paidBookings
      .filter((b) => isSameMonth(b.date, currentYear, currentMonth))
      .reduce((s, b) => s + b.totalPrice, 0);

    const prevMonthRevenue = paidBookings
      .filter((b) =>
        isSameMonth(
          b.date,
          currentMonth === 0 ? currentYear - 1 : currentYear,
          currentMonth === 0 ? 11 : currentMonth - 1
        )
      )
      .reduce((s, b) => s + b.totalPrice, 0);

    const paymentCount = paidBookings.length;
    const avgAmount = paymentCount > 0 ? totalRevenue / paymentCount : 0;

    return {
      totalRevenue,
      thisMonthRevenue,
      prevMonthRevenue,
      paymentCount,
      avgAmount,
    };
  }, [bookings]);

  /* ---- Handlers ---- */
  const handleCopy = useCallback(
    (text: string, id: string) => {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    []
  );

  const handleExportCSV = useCallback(() => {
    const headers = [
      "Dato",
      "Tid",
      "Kundenavn",
      "E-post",
      "Telefon",
      "Badstue",
      "Type",
      "Beløp",
      "Rabatt",
      "Medlemsrabatt",
      "Betalingsstatus",
      "Stripe Session ID",
      "Notater",
    ];

    const rows = paymentRows.map((pr) => [
      pr.booking.date,
      `${pr.booking.startTime}-${pr.booking.endTime}`,
      pr.booking.customerName,
      pr.booking.customerEmail,
      pr.booking.customerPhone,
      pr.saunaName,
      pr.booking.type === "private" ? "Privat" : pr.booking.type === "felles" ? "Felles" : "Intern",
      pr.booking.totalPrice,
      pr.booking.discountAmount,
      pr.booking.memberDiscount,
      pr.booking.paymentStatus === "paid"
        ? "Betalt"
        : pr.booking.paymentStatus === "free"
        ? "Gratis"
        : "Venter",
      pr.booking.stripeSessionId ?? "",
      pr.booking.notes ?? "",
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell ?? "");
              if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `innbetalinger-${format(new Date(), "yyyy-MM-dd", { locale: nb })}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast("CSV eksportert");
    setTimeout(() => setToast(null), 4000);
  }, [paymentRows]);

  /* ---- Table columns ---- */
  const columns = [
    {
      key: "date",
      header: "Dato",
      sortable: true,
      render: (row: PaymentRow) => (
        <div>
          <span className="text-sm font-medium text-text-primary">
            {formatDateNO(row.booking.date)}
          </span>
          <span className="block text-[11px] text-text-muted">
            {row.booking.startTime}
          </span>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Kunde",
      sortable: true,
      render: (row: PaymentRow) => (
        <div>
          <span className="text-sm font-medium text-text-primary">
            {row.booking.customerName}
          </span>
          <span className="block text-[11px] text-text-muted truncate max-w-[160px]">
            {row.booking.customerEmail}
          </span>
        </div>
      ),
    },
    {
      key: "saunaName",
      header: "Badstue",
      sortable: true,
      render: (row: PaymentRow) => (
        <span className="text-sm text-text-primary">{row.saunaName}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row: PaymentRow) => (
        <StatusBadge
          variant="type"
          type={row.booking.type === "internal" ? "internal" : row.booking.type}
        />
      ),
    },
    {
      key: "totalPrice",
      header: "Beløp",
      sortable: true,
      render: (row: PaymentRow) => (
        <span className="text-sm font-mono font-semibold text-brand-pink">
          {formatNOK(row.booking.totalPrice)}
        </span>
      ),
    },
    {
      key: "discount",
      header: "Rabatt",
      render: (row: PaymentRow) => {
        const totalDiscount = row.booking.discountAmount + row.booking.memberDiscount;
        if (totalDiscount <= 0) {
          return <span className="text-xs text-text-muted">-</span>;
        }
        return (
          <span className="text-xs font-mono text-text-secondary">
            {totalDiscount}%
          </span>
        );
      },
    },
    {
      key: "paymentStatus",
      header: "Status",
      render: (row: PaymentRow) => (
        <StatusBadge variant="payment" paymentStatus={row.booking.paymentStatus} />
      ),
    },
    {
      key: "stripeSessionId",
      header: "Stripe ID",
      tabletHidden: true,
      render: (row: PaymentRow) => {
        if (!row.booking.stripeSessionId) {
          return <span className="text-xs text-text-muted">-</span>;
        }
        const truncated = row.booking.stripeSessionId.slice(0, 12) + "...";
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-text-secondary">
              {truncated}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(row.booking.stripeSessionId!, row.booking.id);
              }}
              className="p-1 rounded-md hover:bg-cream transition-colors"
              title="Kopier"
            >
              {copiedId === row.booking.id ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3 text-text-muted" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (row: PaymentRow) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDetailBooking(row.booking);
          }}
          className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Se detaljer</span>
        </button>
      ),
    },
  ];

  /* ---- Detail modal helpers ---- */
  const detailSaunaName = useMemo(() => {
    if (!detailBooking) return "";
    return saunas.find((s) => s.id === detailBooking.saunaId)?.name ?? "Ukjent";
  }, [detailBooking, saunas]);

  const totalDiscountPercent = useMemo(() => {
    if (!detailBooking) return 0;
    return detailBooking.discountAmount + detailBooking.memberDiscount;
  }, [detailBooking]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Innbetalinger"
        description="Oversikt over alle betalinger fra bekreftede bookinger"
        action={
          <button
            onClick={handleExportCSV}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Eksporter CSV
          </button>
        }
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ======== KPI Summary Cards ======== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6"
      >
        {[
          {
            label: "Total inntekt",
            value: formatNOK(kpis.totalRevenue),
            icon: TrendingUp,
            color: "text-brand-pink",
          },
          {
            label: "Denne måneden",
            value: formatNOK(kpis.thisMonthRevenue),
            icon: Calendar,
            color: "text-teal",
          },
          {
            label: "Forrige måned",
            value: formatNOK(kpis.prevMonthRevenue),
            icon: Calendar,
            color: "text-felles-booking",
          },
          {
            label: "Antall betalinger",
            value: String(kpis.paymentCount),
            icon: Hash,
            color: "text-success",
          },
          {
            label: "Gjennomsnittlig beløp",
            value: formatNOK(Math.round(kpis.avgAmount)),
            icon: BarChart3,
            color: "text-vel-member",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="card-base p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                {kpi.label}
              </span>
            </div>
            <p className={`text-lg font-bold font-mono ${kpi.color}`}>
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ======== Filter Bar ======== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card-base p-4 md:p-5 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Sauna filter */}
          <div className="flex-1 min-w-0">
            <label className="form-label">Badstue</label>
            <div className="relative">
              <select
                value={saunaFilter}
                onChange={(e) => setSaunaFilter(e.target.value)}
                className="form-input appearance-none pr-8"
              >
                <option value="all">Alle badstuer</option>
                {saunas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Date filter */}
          <div className="flex-1 min-w-0">
            <label className="form-label">Periode</label>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="form-input appearance-none pr-8"
              >
                <option value="all">Alle</option>
                <option value="week">Denne uken</option>
                <option value="month">Denne måneden</option>
                <option value="prevMonth">Forrige måned</option>
                <option value="year">Dette året</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Payment status filter */}
          <div className="flex-1 min-w-0">
            <label className="form-label">Betalingsstatus</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as PaymentStatusFilter)
                }
                className="form-input appearance-none pr-8"
              >
                <option value="all">Alle</option>
                <option value="paid">Betalt</option>
                <option value="free">Gratis</option>
                <option value="pending">Venter</option>
              </select>
              <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Reset filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSaunaFilter("all");
                setDateFilter("all");
                setStatusFilter("all");
              }}
              className="btn-ghost flex items-center gap-1.5 text-sm h-11 md:h-12"
            >
              <X className="w-4 h-4" />
              Nullstill
            </button>
          </div>
        </div>

        {/* Active filter count */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[11px] text-text-muted">
            {paymentRows.length} betalinger
            {saunaFilter !== "all" || dateFilter !== "all" || statusFilter !== "all"
              ? " (filtrert)"
              : ""}
          </span>
        </div>
      </motion.div>

      {/* ======== Desktop Data Table ======== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="hidden md:block"
      >
        <DataTable
          columns={columns}
          data={paymentRows}
          keyExtractor={(row) => row.booking.id}
          emptyMessage="Ingen betalinger funnet"
          pageSize={10}
        />
      </motion.div>

      {/* ======== Mobile Card View ======== */}
      <div className="md:hidden space-y-3">
        <AnimatePresence>
          {paymentRows.map((row, idx) => (
            <motion.div
              key={row.booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="card-base p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDateNO(row.booking.date)}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {row.booking.startTime}
                  </p>
                </div>
                <StatusBadge
                  variant="payment"
                  paymentStatus={row.booking.paymentStatus}
                />
              </div>

              <p className="text-sm font-semibold text-text-primary mb-1">
                {row.booking.customerName}
              </p>
              <p className="text-xs text-text-secondary mb-2">
                {row.saunaName}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    variant="type"
                    type={
                      row.booking.type === "internal"
                        ? "internal"
                        : row.booking.type
                    }
                  />
                  <span className="text-sm font-mono font-semibold text-brand-pink">
                    {formatNOK(row.booking.totalPrice)}
                  </span>
                </div>
                <button
                  onClick={() => setDetailBooking(row.booking)}
                  className="btn-secondary flex items-center gap-1 text-xs py-1.5 px-3"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Se detaljer
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {paymentRows.length === 0 && (
          <div className="card-base p-8 text-center">
            <CreditCard className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm text-text-muted">Ingen betalinger funnet</p>
          </div>
        )}
      </div>

      {/* ======== Detail Modal ======== */}
      <Dialog
        open={detailBooking !== null}
        onOpenChange={(open) => !open && setDetailBooking(null)}
      >
        <DialogContent className="sm:max-w-lg max-w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Betalingsdetaljer
            </DialogTitle>
            <DialogDescription>
              Full oversikt over booking og betaling
            </DialogDescription>
          </DialogHeader>

          {detailBooking && (
            <div className="space-y-5 mt-2">
              {/* Customer info */}
              <div className="card-base p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-3">
                  Kundeinformasjon
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Navn</span>
                    <span className="text-sm font-medium text-text-primary">
                      {detailBooking.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">E-post</span>
                    <span className="text-sm text-text-primary">
                      {detailBooking.customerEmail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Telefon</span>
                    <span className="text-sm text-text-primary">
                      {detailBooking.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Deltakere</span>
                    <span className="text-sm text-text-primary">
                      {detailBooking.participantCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking info */}
              <div className="card-base p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-3">
                  Bookingdetaljer
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Dato</span>
                    <span className="text-sm text-text-primary">
                      {formatDateNO(detailBooking.date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Tid</span>
                    <span className="text-sm text-text-primary">
                      {detailBooking.startTime} - {detailBooking.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Badstue</span>
                    <span className="text-sm text-text-primary">
                      {detailSaunaName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Type</span>
                    <StatusBadge
                      variant="type"
                      type={
                        detailBooking.type === "internal"
                          ? "internal"
                          : detailBooking.type
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="card-base p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-3">
                  Betalingsoversikt
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-text-muted">Totalpris</span>
                    <span className="text-sm font-mono font-semibold text-text-primary">
                      {formatNOK(detailBooking.totalPrice)}
                    </span>
                  </div>
                  {detailBooking.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted">Rabattkode</span>
                      <span className="text-sm font-mono text-sauna-red">
                        -{detailBooking.discountAmount}%
                      </span>
                    </div>
                  )}
                  {detailBooking.memberDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted">
                        Medlemsrabatt
                      </span>
                      <span className="text-sm font-mono text-vel-member">
                        -{detailBooking.memberDiscount}%
                      </span>
                    </div>
                  )}
                  <div className="border-t border-[#DDD6CC] pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium text-text-primary">
                        Endelig beløp
                      </span>
                      <span className="text-sm font-mono font-bold text-brand-pink">
                        {formatNOK(detailBooking.totalPrice)}
                      </span>
                    </div>
                  </div>
                  {totalDiscountPercent > 0 && (
                    <p className="text-[11px] text-text-muted">
                      Totalt rabatt: {totalDiscountPercent}%
                    </p>
                  )}
                </div>
              </div>

              {/* Stripe info */}
              <div className="card-base p-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-3">
                  Stripe-informasjon
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">Status</span>
                    <StatusBadge
                      variant="payment"
                      paymentStatus={detailBooking.paymentStatus}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">Session ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-text-secondary max-w-[140px] truncate">
                        {detailBooking.stripeSessionId ?? "N/A"}
                      </span>
                      {detailBooking.stripeSessionId && (
                        <button
                          onClick={() =>
                            handleCopy(
                              detailBooking.stripeSessionId!,
                              "stripe-modal"
                            )
                          }
                          className="p-1 rounded-md hover:bg-cream transition-colors"
                          title="Kopier"
                        >
                          {copiedId === "stripe-modal" ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-text-muted" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {detailBooking.discountCode && (
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted">
                        Rabattkode
                      </span>
                      <span className="text-sm font-mono text-text-primary">
                        {detailBooking.discountCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {detailBooking.notes && (
                <div className="card-base p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-2">
                    Notater
                  </h3>
                  <p className="text-sm text-text-primary">
                    {detailBooking.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
