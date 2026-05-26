import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Users,
  CalendarRange,
  Download,
  Mail,
  FileText,
  ChevronDown,
  Send,
  Check,
  Loader2,
  Settings,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { jsPDF } from "jspdf";
// @ts-ignore autoTable is not recognized by ts but is available
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import {
  getBookings,
  getSaunas,
  getMembers,
} from "@/data/store";
import type { Booking } from "@/data/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const months = [
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

function formatNOK(n: number) {
  return `kr ${n.toLocaleString("no-NO")}`;
}

function formatDateNO(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

type ReportTypeOption = "monthly_sauna" | "monthly_member" | "custom";

const PIE_COLORS = ["#D4863C", "#1A6B7C", "#7C3AED"];

/* ------------------------------------------------------------------ */
/*  Toast component                                                   */
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
        ×
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Reports Page                                                 */
/* ------------------------------------------------------------------ */

export default function Reports() {
  const bookings = getBookings();
  const saunas = getSaunas();
  const members = getMembers();

  const [reportType, setReportType] =
    useState<ReportTypeOption>("monthly_sauna");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSaunas, setSelectedSaunas] = useState<string[]>([
    "all",
  ]);
  const [generated, setGenerated] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ---- Auto-report settings ---- */
  const [autoReportEnabled, setAutoReportEnabled] = useState(true);
  const [autoEmail, setAutoEmail] = useState(
    "vestfoldbaatogutleie@ebilag.com"
  );

  /* ---- Report history ---- */
  const [reportHistory] = useState<{
    id: string;
    title: string;
    period: string;
    type: string;
    status: string;
  }[]>([]);

  /* ---- Computed report data ---- */
  const reportData = useMemo(() => {
    const monthStr = String(selectedMonth + 1).padStart(2, "0");
    const yearStr = String(selectedYear);

    const periodBookings = bookings.filter((b: Booking) => {
      const matchMonth = b.date.startsWith(`${yearStr}-${monthStr}`);
      const matchSauna =
        selectedSaunas.includes("all") ||
        (!selectedSaunas.includes("all") &&
          selectedSaunas.includes(b.saunaId));
      return matchMonth && matchSauna && b.status !== "cancelled";
    });

    const totalRevenue = periodBookings
      .filter((b: Booking) => !b.isInternal)
      .reduce((s: number, b: Booking) => s + b.totalPrice, 0);

    const privateCount = periodBookings.filter(
      (b: Booking) => b.type === "private"
    ).length;
    const fellesCount = periodBookings.filter(
      (b: Booking) => b.type === "felles"
    ).length;
    const internCount = periodBookings.filter(
      (b: Booking) => b.isInternal
    ).length;

    const avgOccupancy =
      saunas.length > 0
        ? Math.round(
            (periodBookings.length / (saunas.length * 8 * 31)) * 100
          )
        : 0;

    /* Per sauna breakdown */
    const saunaBreakdown = saunas.map((s) => {
      const sb = periodBookings.filter((b: Booking) => b.saunaId === s.id);
      const rev = sb
        .filter((b: Booking) => !b.isInternal)
        .reduce((sum: number, b: Booking) => sum + b.totalPrice, 0);
      return {
        id: s.id,
        sauna: s.name.split(" ").pop() ?? s.name,
        bookings: sb.length,
        private: sb.filter((b: Booking) => b.type === "private").length,
        felles: sb.filter((b: Booking) => b.type === "felles").length,
        intern: sb.filter((b: Booking) => b.isInternal).length,
        revenue: rev,
        occupancy: Math.round((sb.length / (8 * 31)) * 100),
      };
    });

    /* Daily activity */
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyActivity = Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr}-${day}`;
      const dayBookings = periodBookings.filter((b: Booking) => b.date === dateStr);
      return {
        day: i + 1,
        privat: dayBookings.filter((b: Booking) => b.type === "private").length,
        felles: dayBookings.filter((b: Booking) => b.type === "felles").length,
        intern: dayBookings.filter((b: Booking) => b.isInternal).length,
      };
    });

    return {
      totalBookings: periodBookings.length,
      totalRevenue,
      privateCount,
      fellesCount,
      internCount,
      avgOccupancy,
      saunaBreakdown,
      dailyActivity,
    };
  }, [bookings, saunas, selectedMonth, selectedYear, selectedSaunas]);

  /* ---- Chart data ---- */
  const saunaChartData = reportData.saunaBreakdown.map((s) => ({
    name: s.sauna,
    omsetning: s.revenue,
  }));

  const donutData = [
    { name: "Privat", value: reportData.privateCount },
    { name: "Felles", value: reportData.fellesCount },
    { name: "Intern", value: reportData.internCount },
  ];

  /* ---- PDF Export ---- */
  const handleExportPDF = () => {
    setPdfLoading(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      /* Cover page */
      doc.setFontSize(22);
      doc.setTextColor(11, 61, 76);
      doc.text("Danholmen Badstuer", pageWidth / 2, 40, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(90, 90, 110);
      doc.text(
        `${months[selectedMonth]} ${selectedYear} — Badstuerapport`,
        pageWidth / 2,
        55,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.text(
        `Generert: ${formatDateNO(new Date().toISOString())}`,
        pageWidth / 2,
        65,
        { align: "center" }
      );

      /* Summary stats */
      doc.setFontSize(12);
      doc.setTextColor(26, 26, 46);
      doc.text("Sammendrag", 20, 90);

      const summaryRows = [
        ["Totale bookinger", String(reportData.totalBookings)],
        ["Total omsetning", formatNOK(reportData.totalRevenue)],
        [
          "Fordeling",
          `${reportData.privateCount} privat / ${reportData.fellesCount} felles / ${reportData.internCount} intern`,
        ],
        ["Gjennomsnittlig belastning", `${reportData.avgOccupancy}%`],
      ];

      autoTable(doc, {
        startY: 95,
        head: [["Måling", "Verdi"]],
        body: summaryRows,
        theme: "grid",
        headStyles: { fillColor: [11, 61, 76], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
      });

      /* Sauna breakdown table */
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        ?.finalY ?? 130;
      doc.setFontSize(12);
      doc.text("Detaljert per badstue", 20, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [
          ["Badstue", "Bookinger (P/F/I)", "Omsetning", "Belastning"],
        ],
        body: reportData.saunaBreakdown.map((s) => [
          s.sauna,
          `${s.bookings} (${s.private}/${s.felles}/${s.intern})`,
          formatNOK(s.revenue),
          `${s.occupancy}%`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [26, 107, 124], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
      });

      /* Footer */
      const totalPages = doc.internal.pages.length;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(138, 138, 158);
        doc.text(
          `Generert av Danholmen Badstue Booking System · vestfoldbaatogutleie@ebilag.com · Side ${i} av ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`danholmen-rapport-${months[selectedMonth]}-${selectedYear}.pdf`);
      setPdfLoading(false);
      setToast("PDF lastet ned");
      setTimeout(() => setToast(null), 4000);
    }, 800);
  };

  /* ---- Handlers ---- */
  const handleGenerate = () => setGenerated(true);

  const handleSendNow = () => {
    setToast("Rapport sendt");
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaunaToggle = (saunaId: string) => {
    if (saunaId === "all") {
      setSelectedSaunas(["all"]);
    } else {
      setSelectedSaunas((prev) => {
        const filtered = prev.filter((id) => id !== "all");
        if (filtered.includes(saunaId)) {
          const next = filtered.filter((id) => id !== saunaId);
          return next.length === 0 ? ["all"] : next;
        }
        return [...filtered, saunaId];
      });
    }
  };

  const canGenerate =
    reportType && selectedMonth >= 0 && selectedYear > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Rapporter"
        action={
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warm-amber text-white text-sm font-medium hover:bg-amber-light transition-colors shadow-amber-btn"
          >
            <FileText className="w-4 h-4" /> Generer rapport
          </button>
        }
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ======== Report Config Card ======== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5 md:p-6 mb-6"
      >
        <h2 className="font-display text-lg font-bold text-text-primary mb-5">
          Generer ny rapport
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {/* Column 1 — Report Type */}
          <div>
            <label className="text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-3 block">
              Rapporttype
            </label>
            <div className="space-y-2">
              {[
                {
                  key: "monthly_sauna" as ReportTypeOption,
                  label: "Månedsrapport per badstue",
                  desc: "Oversikt over alle badstuer",
                  icon: CalendarDays,
                },
                {
                  key: "monthly_member" as ReportTypeOption,
                  label: "Månedsrapport per medlem",
                  desc: "Medlemsaktivitet",
                  icon: Users,
                },
                {
                  key: "custom" as ReportTypeOption,
                  label: "Egendefinert periode",
                  desc: "Velg datoer selv",
                  icon: CalendarRange,
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setReportType(opt.key)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    reportType === opt.key
                      ? "border-teal bg-[rgba(26,107,124,0.04)]"
                      : "border-[#DDD6CC] hover:border-teal-light/50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      reportType === opt.key
                        ? "bg-teal text-white"
                        : "bg-[#EDE7DE] text-text-secondary"
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        reportType === opt.key
                          ? "text-teal"
                          : "text-text-primary"
                      }`}
                    >
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2 — Period */}
          <div>
            <label className="text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-3 block">
              Periode
            </label>
            {reportType === "custom" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">
                    Fra
                  </label>
                  <input
                    type="date"
                    className="w-full h-11 px-3 rounded-xl border border-[#DDD6CC] bg-white text-sm text-text-primary focus:border-teal focus:shadow-input-focus outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">
                    Til
                  </label>
                  <input
                    type="date"
                    className="w-full h-11 px-3 rounded-xl border border-[#DDD6CC] bg-white text-sm text-text-primary focus:border-teal focus:shadow-input-focus outline-none transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">
                    Måned
                  </label>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full h-11 px-3 pr-8 rounded-xl border border-[#DDD6CC] bg-white text-sm text-text-primary focus:border-teal focus:shadow-input-focus outline-none transition-colors appearance-none"
                    >
                      {months.map((m, i) => (
                        <option key={i} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-text-secondary mb-1 block">
                    År
                  </label>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full h-11 px-3 pr-8 rounded-xl border border-[#DDD6CC] bg-white text-sm text-text-primary focus:border-teal focus:shadow-input-focus outline-none transition-colors appearance-none"
                    >
                      {[2024, 2025, 2026].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 3 — Scope */}
          <div>
            <label className="text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-3 block">
              Omfang
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-text-secondary mb-1 block">
                  Badstuer
                </label>
                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSaunas.includes("all")}
                      onChange={() => handleSaunaToggle("all")}
                      className="w-4 h-4 rounded border-[#DDD6CC] text-teal focus:ring-teal"
                    />
                    <span className="text-sm text-text-primary">Alle badstuer</span>
                  </label>
                  {saunas.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedSaunas.includes(s.id) &&
                          !selectedSaunas.includes("all")
                        }
                        onChange={() => handleSaunaToggle(s.id)}
                        disabled={selectedSaunas.includes("all")}
                        className="w-4 h-4 rounded border-[#DDD6CC] text-teal focus:ring-teal disabled:opacity-40"
                      />
                      <span className="text-sm text-text-primary">
                        {s.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full mt-5 py-3 rounded-xl bg-warm-amber text-white text-sm font-medium hover:bg-amber-light transition-colors shadow-amber-btn disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generer rapport
        </button>
      </motion.div>

      {/* ======== Generated Report ======== */}
      <AnimatePresence>
        {generated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 mb-6"
          >
            {/* Report Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-text-primary">
                  Månedsrapport — {months[selectedMonth]} {selectedYear}
                </h2>
                <p className="text-xs text-text-secondary font-mono mt-1">
                  {selectedSaunas.includes("all")
                    ? "Alle badstuer"
                    : `${selectedSaunas.length} badstuer valgt`}
                  {" · "}
                  Generert {formatDateNO(new Date().toISOString())}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={pdfLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-teal text-teal text-sm font-medium hover:bg-teal hover:text-white transition-colors"
                >
                  {pdfLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Last ned PDF
                </button>
                <button
                  onClick={handleSendNow}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent text-text-secondary text-sm font-medium hover:bg-[#EDE7DE] hover:text-text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" /> Send på e-post
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
              {[
                {
                  label: "Totale bookinger",
                  value: String(reportData.totalBookings),
                  sub: `${reportData.privateCount} privat / ${reportData.fellesCount} felles / ${reportData.internCount} intern`,
                  color: "text-teal",
                },
                {
                  label: "Total omsetning",
                  value: formatNOK(reportData.totalRevenue),
                  sub: "vs forrige måned",
                  color: "text-warm-amber",
                },
                {
                  label: "Gj.sn. belastning",
                  value: `${reportData.avgOccupancy}%`,
                  sub: "daglig gjennomsnitt",
                  color: "text-success",
                },
                {
                  label: "Nye medlemmer",
                  value: String(
                    members.filter((m) => m.isActive).length
                  ),
                  sub: "aktive medlemmer",
                  color: "text-felles-booking",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-secondary">
                    {stat.label}
                  </p>
                  <p
                    className={`text-xl font-bold font-mono mt-1 ${stat.color}`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">{stat.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
              {/* Revenue Bar Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5"
              >
                <h3 className="font-display text-base font-bold text-text-primary mb-4">
                  Omsetning per badstue
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={saunaChartData} barSize={40}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#DDD6CC"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#5A5A6E" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#5A5A6E" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `kr ${v}`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatNOK(value)}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #DDD6CC",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="omsetning" fill="#D4863C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Booking Type Donut */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5"
              >
                <h3 className="font-display text-base font-bold text-text-primary mb-4">
                  Bookingfordeling
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} (${
                          reportData.totalBookings > 0
                            ? Math.round(
                                (value / reportData.totalBookings) * 100
                              )
                            : 0
                        }%)`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #DDD6CC",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {donutData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                      <span className="text-[10px] text-text-secondary">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Daily Activity Area Chart */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5"
            >
              <h3 className="font-display text-base font-bold text-text-primary mb-4">
                Dagsaktivitet — {months[selectedMonth]}
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={reportData.dailyActivity}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#DDD6CC"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#5A5A6E" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#5A5A6E" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #DDD6CC",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="privat"
                    stackId="1"
                    stroke={PIE_COLORS[0]}
                    fill={PIE_COLORS[0]}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="felles"
                    stackId="1"
                    stroke={PIE_COLORS[1]}
                    fill={PIE_COLORS[1]}
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="intern"
                    stackId="1"
                    stroke={PIE_COLORS[2]}
                    fill={PIE_COLORS[2]}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Breakdown Table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5"
            >
              <h3 className="font-display text-base font-bold text-text-primary mb-4">
                Detaljert per badstue
              </h3>
              <DataTable
                columns={[
                  {
                    key: "sauna",
                    header: "Badstue",
                    render: (row) => (
                      <span className="font-medium text-sm">
                        {row.sauna as string}
                      </span>
                    ),
                  },
                  {
                    key: "bookings",
                    header: "Bookinger (P/F/I)",
                    render: (row) => (
                      <span className="font-mono text-xs">
                        {row.bookings as number} ({row.private as number}/
                        {row.felles as number}/{row.intern as number})
                      </span>
                    ),
                  },
                  {
                    key: "revenue",
                    header: "Omsetning",
                    render: (row) => (
                      <span className="font-mono text-sm text-warm-amber font-medium">
                        {formatNOK(row.revenue as number)}
                      </span>
                    ),
                  },
                  {
                    key: "occupancy",
                    header: "Belastning",
                    render: (row) => (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#EDE7DE] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                row.occupancy as number
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono">
                          {row.occupancy}%
                        </span>
                      </div>
                    ),
                  },
                ]}
                data={reportData.saunaBreakdown}
                keyExtractor={(row) => row.id}
                emptyMessage="Ingen data for valgt periode"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======== Auto-Report Settings ======== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5 md:p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-5 h-5 text-text-secondary" />
          <h2 className="font-display text-lg font-bold text-text-primary">
            Planlagte rapporter
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-primary">
                Automatiske månedsrapporter
              </label>
              <button
                onClick={() => setAutoReportEnabled(!autoReportEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  autoReportEnabled ? "bg-teal" : "bg-[#DDD6CC]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                    autoReportEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Mottaker: {autoEmail}
            </p>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Sendes 1. i hver måned kl. 08:00
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={autoEmail}
              onChange={(e) => setAutoEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#DDD6CC] bg-white text-sm text-text-primary focus:border-teal focus:shadow-input-focus outline-none transition-colors"
              placeholder="E-postmottaker"
            />
            <button
              onClick={handleSendNow}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-warm-amber text-white text-sm font-medium hover:bg-amber-light transition-colors shadow-amber-btn"
            >
              <Send className="w-4 h-4" /> Send nå
            </button>
          </div>
        </div>

        {/* History table — Desktop */}
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Rapporthistorikk
        </h3>
        <div className="hidden md:block">
          <DataTable
            columns={[
              { key: "title", header: "Rapport" },
              { key: "period", header: "Periode" },
              { key: "type", header: "Type" },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                    <Check className="w-3 h-3" /> {row.status as string}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                render: () => (
                  <button className="text-xs text-teal hover:underline flex items-center gap-1">
                    <Download className="w-3 h-3" /> PDF
                  </button>
                ),
              },
            ]}
            data={reportHistory}
            keyExtractor={(row) => row.id}
            emptyMessage="Ingen rapporter generert ennå"
          />
        </div>

        {/* History cards — Mobile */}
        <div className="md:hidden space-y-3">
          {reportHistory.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#DDD6CC] p-8 text-center">
              <FileText className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-muted">Ingen rapporter generert ennå</p>
            </div>
          ) : (
            reportHistory.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-[#DDD6CC] p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-base font-medium text-text-primary">{r.title}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">{r.status}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span>{r.period}</span>
                  <span>|</span>
                  <span>{r.type}</span>
                </div>
                <div className="flex justify-end pt-1">
                  <button onClick={handleExportPDF} className="p-2 text-text-muted hover:text-teal">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
