import { useState, useEffect, useMemo } from "react";
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
  Plus,
  Mail,
  Phone,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Filter,
  Flame,
  ArrowRight,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
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
  getSaunas,
  saveBooking,
  refundBooking,
  checkBookingConflict,
  isBookingTypeAllowed,
  getBookingsBySaunaAndDate,
} from "@/data/store";
import type { Booking, Sauna, BookingType } from "@/data/types";

type FilterStatus = "all" | "confirmed" | "pending" | "cancelled" | "refunded";
type FilterType = "all" | "private" | "felles" | "internal";

const dayLabels = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const monthLabels = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

const timeSlots = [
  "06:00", "08:00", "10:00", "12:00",
  "14:00", "16:00", "18:00", "20:00", "22:00",
];

/* ── Helpers ── */
function getCalendarDays(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(new Date(year, month, -startDay + i + 1));
  }
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) days.push(new Date(year, month + 1, i));
  return days;
}

function formatDateNO(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

/* ═══════════════════════════════════════════════════════════════
   NEW BOOKING MODAL
   ═══════════════════════════════════════════════════════════════ */
function NewBookingModal({
  open,
  onClose,
  saunas,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  saunas: Sauna[];
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSaunaId, setSelectedSaunaId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingType, setBookingType] = useState<BookingType>("private");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sauna = saunas.find((s) => s.id === selectedSaunaId);

  // Generate dates for next 30 days
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, []);

  // Available times for selected sauna + date
  const availableTimes = useMemo(() => {
    if (!sauna || !selectedDate) return [];
    const bookings = getBookingsBySaunaAndDate(sauna.id, selectedDate);
    return timeSlots.map((time) => {
      const hour = parseInt(time.split(":")[0], 10);
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const currentHour = now.getHours();
      // Past check
      if (selectedDate < todayStr || (selectedDate === todayStr && hour <= currentHour)) {
        return { time, available: false, label: `${time}-${String(hour + 2).padStart(2, "0")}:00`, reason: "Passert" };
      }
      const isBlocked = checkBookingConflict(sauna, selectedDate, time, bookingType, bookings);
      return {
        time,
        available: !isBlocked,
        label: `${time}-${String(hour + 2).padStart(2, "0")}:00`,
        reason: isBlocked ? "Opptatt" : "Ledig",
      };
    });
  }, [sauna, selectedDate, bookingType]);

  const reset = () => {
    setStep(1);
    setSelectedSaunaId("");
    setSelectedDate("");
    setSelectedTime("");
    setBookingType("private");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setParticipantCount(1);
    setNotes("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!sauna || !selectedDate || !selectedTime || !customerName || !customerEmail) {
      setError("Fyll inn alle påkrevde felt.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const hour = parseInt(selectedTime.split(":")[0], 10);
    const booking: Booking = {
      id: `admin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      saunaId: sauna.id,
      type: bookingType,
      isInternal: true,
      date: selectedDate,
      startTime: selectedTime,
      endTime: `${String(hour + 2).padStart(2, "0")}:00`,
      status: "confirmed",
      customerName,
      customerEmail,
      customerPhone,
      participantCount: bookingType === "private" ? participantCount : 1,
      totalPrice: 0,
      discountCode: null,
      discountAmount: 0,
      memberId: null,
      memberDiscount: 0,
      notes: notes || null,
      stripeSessionId: null,
      paymentStatus: "free",
      bookedBy: "admin",
      createdAt: new Date().toISOString(),
      cancelledAt: null,
    };
    saveBooking(booking);
    setLoading(false);
    onCreated();
    handleClose();
  };

  const canStep2 = selectedSaunaId && selectedDate && selectedTime;
  const canStep3 = customerName.length >= 2 && customerEmail.includes("@") && customerPhone.length >= 8;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD6CC]">
            <div>
              <h2 className="font-display text-lg font-bold text-text-primary">Ny booking</h2>
              <p className="text-xs text-text-muted mt-0.5">Opprett en intern booking uten betaling</p>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-off-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-[#DDD6CC] bg-off-white/50">
            {[
              { n: 1, label: "Badstue & tid" },
              { n: 2, label: "Type & tidspunkt" },
              { n: 3, label: "Kundeinfo" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s.n ? "bg-deep-teal text-white" : "bg-cream text-text-muted border border-[#DDD6CC]"
                }`}>
                  {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s.n ? "text-text-primary" : "text-text-muted"}`}>
                  {s.label}
                </span>
                {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${step > s.n ? "bg-success" : "bg-cream"}`} />}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* ── STEP 1: Sauna & Date ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="form-label">Velg badstue *</label>
                  <div className="space-y-2">
                    {saunas.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSaunaId(s.id); setSelectedTime(""); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          selectedSaunaId === s.id ? "border-deep-teal bg-deep-teal/5" : "border-[#DDD6CC] hover:border-teal/30"
                        }`}
                      >
                        <img src={s.image} alt={s.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{s.name}</p>
                          <p className="text-xs text-text-muted">{s.location}</p>
                        </div>
                        {selectedSaunaId === s.id && <CheckCircle2 className="w-5 h-5 text-deep-teal flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">Velg dato *</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {availableDates.map((date) => {
                      const dayName = dayLabels[new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1];
                      const [y, m, d] = date.split("-");
                      return (
                        <button
                          key={date}
                          onClick={() => { setSelectedDate(date); setSelectedTime(""); }}
                          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 text-center transition-all ${
                            selectedDate === date ? "border-deep-teal bg-deep-teal/5" : "border-[#DDD6CC] hover:border-teal/30"
                          }`}
                        >
                          <span className="text-[10px] text-text-muted uppercase">{dayName}</span>
                          <span className={`text-sm font-bold ${selectedDate === date ? "text-deep-teal" : "text-text-primary"}`}>{d}</span>
                          <span className="text-[9px] text-text-muted">{m}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => canStep2 && setStep(2)}
                  disabled={!canStep2}
                  className="w-full h-12 rounded-xl bg-deep-teal text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Neste <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── STEP 2: Type & Time ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="form-label">Bookingtype</label>
                  <div className="flex gap-3">
                    {[
                      { key: "private" as BookingType, label: "Privat", icon: Lock },
                      { key: "felles" as BookingType, label: "Felles", icon: Users },
                    ].map((t) => {
                      const Icon = t.icon;
                      const allowed = sauna ? isBookingTypeAllowed(sauna, t.key) : true;
                      return (
                        <button
                          key={t.key}
                          onClick={() => { if (allowed) { setBookingType(t.key); setSelectedTime(""); } }}
                          disabled={!allowed}
                          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            bookingType === t.key ? "border-deep-teal bg-deep-teal/5 text-deep-teal" : "border-[#DDD6CC] text-text-secondary"
                          } ${!allowed ? "opacity-40 cursor-not-allowed" : "hover:border-teal/30 cursor-pointer"}`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {bookingType === "private" && sauna && (
                  <div>
                    <label className="form-label">Antall personer</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setParticipantCount((c) => Math.max(1, c - 1))} className="w-10 h-10 rounded-lg border-2 border-[#DDD6CC] flex items-center justify-center hover:bg-off-white">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-bold text-text-primary w-8 text-center">{participantCount}</span>
                      <button onClick={() => setParticipantCount((c) => Math.min(sauna.capacity, c + 1))} className="w-10 h-10 rounded-lg border-2 border-[#DDD6CC] flex items-center justify-center hover:bg-off-white">
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-text-muted">/ {sauna.capacity} maks</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Tilgjengelige tider</label>
                  {!selectedDate ? (
                    <p className="text-sm text-text-muted">Velg dato først</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                            selectedTime === slot.time
                              ? "border-deep-teal bg-deep-teal/5"
                              : slot.available
                                ? "border-[#DDD6CC] hover:border-teal/30"
                                : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <span className={`text-sm font-medium ${selectedTime === slot.time ? "text-deep-teal" : slot.available ? "text-text-primary" : "text-text-muted"}`}>
                            {slot.time}
                          </span>
                          {!slot.available && <span className="block text-[9px] text-sauna-red">{slot.reason}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border-2 border-[#DDD6CC] text-text-secondary font-medium text-sm hover:bg-off-white transition-all">
                    Tilbake
                  </button>
                  <button
                    onClick={() => selectedTime && setStep(3)}
                    disabled={!selectedTime}
                    className="flex-1 h-12 rounded-xl bg-deep-teal text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Neste <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Customer Info ── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-off-white border border-[#DDD6CC]">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-brand-pink" />
                    <span className="text-sm font-semibold text-text-primary">{sauna?.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span>{formatDateNO(selectedDate)}</span>
                    <span>{selectedTime}–{String(parseInt(selectedTime.split(":")[0]) + 2).padStart(2, "0")}:00</span>
                    <span className="capitalize">{bookingType === "private" ? "Privat" : "Felles"}</span>
                  </div>
                </div>

                <div>
                  <label className="form-label">Kundenavn *</label>
                  <input className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ola Nordmann" />
                </div>
                <div>
                  <label className="form-label">E-post *</label>
                  <input className="form-input" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="ola@epost.no" />
                </div>
                <div>
                  <label className="form-label">Telefon *</label>
                  <input className="form-input" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="971 20 200" />
                </div>
                <div>
                  <label className="form-label">Notater (valgfritt)</label>
                  <textarea className="form-input min-h-[60px] py-3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interne notater..." />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl border-2 border-[#DDD6CC] text-text-secondary font-medium text-sm hover:bg-off-white transition-all">
                    Tilbake
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!canStep3 || loading}
                    className="flex-1 h-12 rounded-xl bg-brand-pink text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Oppretter...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Opprett booking (gratis)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REFUND CONFIRMATION MODAL
   ═══════════════════════════════════════════════════════════════ */
function RefundModal({
  open,
  onClose,
  booking,
  onRefunded,
}: {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onRefunded: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !booking) return null;

  const handleRefund = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    refundBooking(booking.id, booking.totalPrice, reason || undefined);
    setLoading(false);
    onRefunded();
    onClose();
    setReason("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-display text-lg font-bold text-text-primary text-center mb-2">
            Tilbakebetal
          </h3>
          <p className="text-sm text-text-secondary text-center mb-4">
            Refunder <strong>{booking.totalPrice} kr</strong> til <strong>{booking.customerName}</strong>?
          </p>
          <div className="mb-4">
            <label className="form-label text-xs">Årsak (valgfritt)</label>
            <input className="form-input text-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="f.eks. Kunde ønsket avbestilling" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border-2 border-[#DDD6CC] text-text-secondary font-medium text-sm hover:bg-off-white transition-all">
              Avbryt
            </button>
            <button
              onClick={handleRefund}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Tilbakebetal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN BOOKING CALENDAR
   ═══════════════════════════════════════════════════════════════ */
export default function BookingCalendar() {
  const admin = getCurrentAdmin();
  const saunas = useMemo(() => getFilteredSaunasForAdmin(admin), [admin]);
  const allBookings = useMemo(() => getFilteredBookingsForAdmin(admin), [admin]);

  const [selectedSaunaId, setSelectedSaunaId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

  // Modals
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [refundBookingData, setRefundBookingData] = useState<Booking | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<Booking | null>(null);

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (selectedSaunaId !== "all" && !saunas.find((s) => s.id === selectedSaunaId)) {
      setSelectedSaunaId("all");
    }
  }, [saunas, selectedSaunaId]);

  const filteredBookings = useMemo(() => {
    let result = allBookings;
    if (selectedSaunaId !== "all") result = result.filter((b) => b.saunaId === selectedSaunaId);
    if (filterStatus !== "all") result = result.filter((b) => b.status === filterStatus);
    if (filterType !== "all") result = result.filter((b) => b.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) =>
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.customerPhone?.includes(q) ||
        b.date.includes(q)
      );
    }
    return result.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [allBookings, selectedSaunaId, filterStatus, filterType, searchQuery]);

  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  function bookingsForDate(date: Date): Booking[] {
    const iso = date.toISOString().split("T")[0];
    return filteredBookings.filter((b) => b.date === iso);
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  }

  const saunaName = (id: string) => saunas.find((s) => s.id === id)?.name ?? id;

  const handleRefundClick = (booking: Booking) => {
    if (booking.status === "refunded") return;
    setRefundBookingData(booking);
    setRefundOpen(true);
  };

  const statusDot = (booking: Booking) => {
    if (booking.status === "refunded") return "bg-orange-500";
    if (booking.status === "cancelled") return "bg-sauna-red";
    if (booking.type === "private") return "bg-sauna-red";
    if (booking.type === "felles") return "bg-success";
    return "bg-gray-300";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Page header with New Booking button */}
      <PageHeader
        title="Booking Kalender"
        description="Administrer timebestillinger for alle badstuer"
        action={
          <Button
            onClick={() => setNewBookingOpen(true)}
            className="h-11 px-5 text-sm font-semibold flex items-center gap-2"
            style={{ backgroundColor: "#0B3D4C", color: "#F5F0EA" }}
          >
            <Plus className="w-4 h-4" />
            Ny booking
          </Button>
        }
      />

      {/* Sauna tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedSaunaId("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedSaunaId === "all" ? "bg-deep-teal text-white shadow-md" : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-teal/30"
          }`}
        >
          Alle badstuer
        </button>
        {saunas.map((sauna) => (
          <button
            key={sauna.id}
            onClick={() => setSelectedSaunaId(sauna.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedSaunaId === sauna.id ? "bg-deep-teal text-white shadow-md" : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-teal/30"
            }`}
          >
            {sauna.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all" as FilterStatus, label: "Alle" },
            { key: "confirmed" as FilterStatus, label: "Bekreftet" },
            { key: "pending" as FilterStatus, label: "Venter" },
            { key: "cancelled" as FilterStatus, label: "Avbrutt" },
            { key: "refunded" as FilterStatus, label: "Refundert" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatus === s.key ? "bg-deep-teal text-white" : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-teal/30"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {[
            { key: "all" as FilterType, label: "Alle typer" },
            { key: "private" as FilterType, label: "Privat" },
            { key: "felles" as FilterType, label: "Felles" },
            { key: "internal" as FilterType, label: "Intern" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterType === t.key ? "bg-brand-pink text-white" : "bg-white border border-[#DDD6CC] text-text-secondary hover:border-brand-pink/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + View toggle */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Søk etter navn, e-post, telefon eller dato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 bg-white rounded-lg border border-[#DDD6CC] p-0.5">
          <button onClick={() => setViewMode("calendar")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "calendar" ? "bg-deep-teal text-white" : "text-text-secondary hover:text-text-primary"}`}>
            Kalender
          </button>
          <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "list" ? "bg-deep-teal text-white" : "text-text-secondary hover:text-text-primary"}`}>
            Liste
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-text-muted mb-4">
        {filteredBookings.length} booking{filteredBookings.length !== 1 ? "er" : ""} funnet
      </p>

      {/* ==================== VIEWS ==================== */}
      <AnimatePresence mode="wait">
        {viewMode === "calendar" ? (
          <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between p-4 border-b border-[#DDD6CC]">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-off-white transition-colors"><ChevronLeft className="w-5 h-5 text-text-primary" /></button>
              <h3 className="font-display text-lg font-bold text-text-primary">{monthLabels[calMonth]} {calYear}</h3>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-off-white transition-colors"><ChevronRight className="w-5 h-5 text-text-primary" /></button>
            </div>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#DDD6CC]">
              {dayLabels.map((d) => <div key={d} className="py-2 text-center text-xs font-semibold text-text-muted uppercase">{d}</div>)}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, idx) => {
                const iso = date.toISOString().split("T")[0];
                const dayBookings = bookingsForDate(date);
                const isCurrentMonth = date.getMonth() === calMonth;
                const isToday = iso === new Date().toISOString().split("T")[0];
                return (
                  <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.003 }}
                    className={`min-h-[100px] sm:min-h-[120px] border-b border-r border-[#DDD6CC] p-1.5 ${!isCurrentMonth ? "bg-off-white/30" : ""} ${isToday ? "bg-teal/5" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-teal text-white" : isCurrentMonth ? "text-text-primary" : "text-text-muted"}`}>
                        {date.getDate()}
                      </span>
                      {dayBookings.length > 0 && <span className="text-[10px] text-text-muted font-medium">{dayBookings.length}</span>}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 cursor-pointer hover:opacity-80 ${
                            booking.status === "refunded" ? "bg-orange-100 text-orange-600 line-through" :
                            booking.status === "cancelled" ? "bg-sauna-red/10 text-sauna-red line-through" :
                            booking.type === "private" ? "bg-sauna-red/10 text-sauna-red" :
                            booking.type === "felles" ? "bg-success/10 text-success" : "bg-gray-100 text-text-muted"
                          }`}
                          onClick={() => setBookingDetail(booking)}
                        >
                          {booking.type === "private" ? <Lock className="w-2.5 h-2.5 shrink-0" /> : booking.type === "felles" ? <Users className="w-2.5 h-2.5 shrink-0" /> : null}
                          {booking.startTime} {booking.customerName.split(" ")[0]}
                        </div>
                      ))}
                      {dayBookings.length > 3 && <p className="text-[10px] text-text-muted pl-1">+{dayBookings.length - 3} til</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* ══════ LIST VIEW ══════ */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <Table className="min-w-0 w-full">
                <TableHeader>
                  <TableRow className="bg-off-white/50">
                    <TableHead className="font-semibold text-text-primary whitespace-normal">Dato/Tid</TableHead>
                    <TableHead className="font-semibold text-text-primary hidden md:table-cell">Badstue</TableHead>
                    <TableHead className="font-semibold text-text-primary">Kunde</TableHead>
                    <TableHead className="font-semibold text-text-primary hidden sm:table-cell">Type</TableHead>
                    <TableHead className="font-semibold text-text-primary">Status</TableHead>
                    <TableHead className="font-semibold text-text-primary text-right">Pris</TableHead>
                    <TableHead className="font-semibold text-text-primary text-right">Handling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-text-muted">
                        <CalendarDays className="w-10 h-10 mx-auto mb-3 text-text-muted" />
                        Ingen bookinger funnet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking, idx) => (
                      <motion.tr key={booking.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                        className={`border-b hover:bg-off-white/30 transition-colors ${booking.status === "refunded" ? "opacity-60" : ""}`}>
                        {/* Date/Time */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(booking)}`} />
                            <div>
                              <p className="text-sm font-medium text-text-primary">{formatDateNO(booking.date)}</p>
                              <p className="text-xs text-text-muted">{booking.startTime}–{booking.endTime}</p>
                            </div>
                          </div>
                        </TableCell>
                        {/* Sauna */}
                        <TableCell className="text-sm text-text-secondary hidden md:table-cell">{saunaName(booking.saunaId)}</TableCell>
                        {/* Customer */}
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{booking.customerName}</p>
                            <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{booking.customerEmail}</span>
                            </div>
                            {booking.customerPhone && (
                              <div className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5">
                                <Phone className="w-3 h-3" />{booking.customerPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {/* Type */}
                        <TableCell className="hidden sm:table-cell"><StatusBadge type={booking.type} variant="type" /></TableCell>
                        {/* Status */}
                        <TableCell><StatusBadge status={booking.status} /></TableCell>
                        {/* Price */}
                        <TableCell className="text-right">
                          <span className={`text-sm font-medium ${booking.status === "refunded" ? "text-orange-500 line-through" : "text-text-primary"}`}>
                            {booking.totalPrice > 0 ? `${booking.totalPrice.toLocaleString("no-NO")} kr` : "Gratis"}
                          </span>
                          {booking.status === "refunded" && booking.refundAmount && (
                            <p className="text-[10px] text-orange-500">Refundert {booking.refundAmount} kr</p>
                          )}
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Refund button */}
                            {booking.status !== "refunded" && booking.status !== "cancelled" && booking.totalPrice > 0 && (
                              <button
                                onClick={() => handleRefundClick(booking)}
                                className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors"
                                title="Tilbakebetal"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {/* View detail */}
                            <button
                              onClick={() => setBookingDetail(booking)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-deep-teal hover:bg-teal/5 transition-colors"
                              title="Se detaljer"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
        <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3 text-sauna-red" /><span className="w-2.5 h-2.5 rounded-full bg-sauna-red" /> Privat</span>
        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3 text-success" /><span className="w-2.5 h-2.5 rounded-full bg-success" /> Felles</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> Intern</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Refundert</span>
      </div>

      {/* ══════ MODALS ══════ */}

      {/* New Booking Modal */}
      <NewBookingModal open={newBookingOpen} onClose={() => setNewBookingOpen(false)} saunas={saunas} onCreated={() => showToast("Booking opprettet!")} />

      {/* Refund Modal */}
      <RefundModal open={refundOpen} onClose={() => setRefundOpen(false)} booking={refundBookingData} onRefunded={() => showToast("Tilbakebetaling registrert!")} />

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {bookingDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setBookingDetail(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-modal w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD6CC]">
                <h2 className="font-display text-lg font-bold text-text-primary">Bookingdetaljer</h2>
                <button onClick={() => setBookingDetail(null)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-off-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Summary */}
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusDot(bookingDetail)}`} />
                  <StatusBadge status={bookingDetail.status} />
                  <StatusBadge type={bookingDetail.type} variant="type" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-off-white rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">Dato</p>
                    <p className="font-medium text-text-primary">{formatDateNO(bookingDetail.date)}</p>
                  </div>
                  <div className="bg-off-white rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">Tid</p>
                    <p className="font-medium text-text-primary">{bookingDetail.startTime}–{bookingDetail.endTime}</p>
                  </div>
                  <div className="bg-off-white rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">Badstue</p>
                    <p className="font-medium text-text-primary">{saunaName(bookingDetail.saunaId)}</p>
                  </div>
                  <div className="bg-off-white rounded-xl p-3">
                    <p className="text-xs text-text-muted mb-1">Pris</p>
                    <p className={`font-medium ${bookingDetail.status === "refunded" ? "text-orange-500 line-through" : "text-text-primary"}`}>
                      {bookingDetail.totalPrice > 0 ? `${bookingDetail.totalPrice.toLocaleString("no-NO")} kr` : "Gratis"}
                    </p>
                  </div>
                </div>
                {/* Customer */}
                <div className="border-t border-[#DDD6CC] pt-4">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Kunde</p>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2"><Users className="w-4 h-4 text-text-muted" /> <span className="font-medium">{bookingDetail.customerName}</span></p>
                    <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-text-muted" /> {bookingDetail.customerEmail}</p>
                    {bookingDetail.customerPhone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-text-muted" /> {bookingDetail.customerPhone}</p>}
                    <p className="flex items-center gap-2"><Users className="w-4 h-4 text-text-muted" /> {bookingDetail.participantCount} personer</p>
                  </div>
                </div>
                {/* Refund info */}
                {bookingDetail.status === "refunded" && (
                  <div className="border-t border-[#DDD6CC] pt-4">
                    <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-2">Refundert</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-text-muted">Beløp:</span> <strong className="text-orange-600">{bookingDetail.refundAmount} kr</strong></p>
                      {bookingDetail.refundedAt && <p><span className="text-text-muted">Dato:</span> {formatDateNO(bookingDetail.refundedAt.split("T")[0])}</p>}
                      {bookingDetail.refundReason && <p><span className="text-text-muted">Årsak:</span> {bookingDetail.refundReason}</p>}
                    </div>
                  </div>
                )}
                {/* Notes */}
                {bookingDetail.notes && (
                  <div className="border-t border-[#DDD6CC] pt-4">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Notater</p>
                    <p className="text-sm text-text-secondary">{bookingDetail.notes}</p>
                  </div>
                )}
                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {bookingDetail.status !== "refunded" && bookingDetail.status !== "cancelled" && bookingDetail.totalPrice > 0 && (
                    <button onClick={() => { setBookingDetail(null); handleRefundClick(bookingDetail); }}
                      className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all flex items-center justify-center gap-2">
                      <RotateCcw className="w-4 h-4" /> Tilbakebetal
                    </button>
                  )}
                  <button onClick={() => setBookingDetail(null)} className="flex-1 h-11 rounded-xl border-2 border-[#DDD6CC] text-text-secondary font-medium text-sm hover:bg-off-white transition-all">
                    Lukk
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[60] bg-deep-teal text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
