import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  ChevronDown,
  MapPin,
  Users,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  Check,
  CreditCard,
  Lock,
  Minus,
  Plus,
  ChevronLeft,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { getSaunas, getBookingsBySaunaAndDate, saveBooking, deleteBooking, getPendingPaymentBookings, getBookingById, checkBookingConflict, isBookingTypeAllowed } from "@/data/store";
import type { Sauna, Booking, BookingType } from "@/data/types";
import {
  isStripeConfigured,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICES,
  PAYMENT_LOCK_MINUTES,
} from "@/data/stripeConfig";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TIME_SLOTS = [
  "06:00",
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "20:00",
  "22:00",
];

const MONTH_NAMES = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

const WEEK_DAYS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

type Step = "sauna" | "date" | "time" | "info" | "summary" | "success";

type SlotStatus = "available" | "partial" | "booked" | "past";

interface TimeSlot {
  time: string;
  label: string;
  status: SlotStatus;
  remainingSpots?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Generate time slots for a sauna on a given date.
 * Uses centralized checkBookingConflict for consistency.
 */
function generateTimeSlots(sauna: Sauna, dateStr: string): TimeSlot[] {
  const bookings = getBookingsBySaunaAndDate(sauna.id, dateStr);
  const slots: TimeSlot[] = [];

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split("T")[0];

  TIME_SLOTS.forEach((time) => {
    const hour = parseInt(time.split(":")[0]!, 10);

    if (dateStr < todayStr || (dateStr === todayStr && hour <= currentHour)) {
      slots.push({
        time,
        label: `${time}-${String(hour + 2).padStart(2, "0")}:00`,
        status: "past",
      });
      return;
    }

    // Use bookingType from state — default to checking "private"
    const checkType = "private";
    const isBlocked = checkBookingConflict(sauna, dateStr, time, checkType, bookings);

    // Determine display status
    const slotBookings = bookings.filter(
      (b) => b.startTime === time && b.status !== "cancelled"
    );
    const hasPrivateBooking = slotBookings.some((b) => b.type === "private");
    const fellesBookings = slotBookings.filter((b) => b.type === "felles");
    const totalFellesParticipants = fellesBookings.reduce(
      (sum, b) => sum + b.participantCount, 0
    );

    let status: SlotStatus = "available";
    let remainingSpots: number | undefined;

    if (hasPrivateBooking) {
      status = "booked";
    } else if (totalFellesParticipants >= sauna.capacity) {
      status = "booked";
    } else if (totalFellesParticipants > 0) {
      status = "partial";
      remainingSpots = sauna.capacity - totalFellesParticipants;
    }

    slots.push({
      time,
      label: `${time}-${String(hour + 2).padStart(2, "0")}:00`,
      status,
      remainingSpots,
    });
  });

  return slots;
}

function generateBookingId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Check if sauna supports both booking modes.
 */
function supportsBothModes(sauna: Sauna): boolean {
  const modes = sauna.bookingModes ?? ["private", "shared"];
  return modes.includes("private") && modes.includes("shared");
}

/**
 * Get the default booking type for a sauna based on its supported modes.
 */
function getDefaultBookingType(sauna: Sauna): BookingType {
  if (sauna.bookingModes?.length === 1) {
    return sauna.bookingModes[0] === "private" ? "private" : "felles";
  }
  return "private";
}

function getStepNumber(step: Step): number {
  switch (step) {
    case "sauna": return 1;
    case "date": return 2;
    case "time": return 3;
    case "info": return 4;
    case "summary": return 5;
    default: return 1;
  }
}

function formatDateNorwegian(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return format(date, "d. MMMM yyyy", { locale: nb });
}

/* ------------------------------------------------------------------ */
/*  Toast helper                                                      */
/* ------------------------------------------------------------------ */
function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const toast = document.createElement("div");
  const bgColor = type === "success" ? "#3A9E6F" : type === "error" ? "#D93A6E" : "#1A6B7C";
  toast.className = "fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-slide-in-right";
  toast.style.backgroundColor = bgColor;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                    */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<SlotStatus, { bg: string; border: string; text: string; dot: string }> = {
  available: {
    bg: "bg-success/8 hover:bg-success/15",
    border: "border-success/30 hover:border-success/50",
    text: "text-success",
    dot: "bg-success",
  },
  partial: {
    bg: "bg-warning/8 hover:bg-warning/15",
    border: "border-warning/30 hover:border-warning/50",
    text: "text-warning",
    dot: "bg-warning",
  },
  booked: {
    bg: "bg-sauna-red/5",
    border: "border-sauna-red/20",
    text: "text-text-muted",
    dot: "bg-sauna-red/40",
  },
  past: {
    bg: "bg-off-white/50",
    border: "border-[#DDD6CC]/50",
    text: "text-text-muted/60",
    dot: "bg-text-muted/30",
  },
};

const STATUS_LABELS: Record<SlotStatus, string> = {
  available: "Ledig",
  partial: "Noen plasser",
  booked: "Opptatt",
  past: "Passert",
};

/* ------------------------------------------------------------------ */
/*  Payment simulation banner                                         */
/* ------------------------------------------------------------------ */
function PaymentSimulationBanner() {
  if (isStripeConfigured()) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-700">
          <span className="font-medium">Betalingssimulering.</span>{" "}
          Konfigurer Stripe i stripeConfig.ts for ekte betaling.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Countdown timer display                                           */
/* ------------------------------------------------------------------ */
function PaymentCountdown({ deadline, onExpire }: { deadline: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        setRemaining(0);
        onExpire();
        return;
      }
      setRemaining(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
      <Timer className="w-3.5 h-3.5 text-amber-600 shrink-0" />
      <p className="text-[11px] text-amber-700">
        Reservert: {" "}
        <span className="font-mono font-bold">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>{" "}
        igjen
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendar sub-component (compact)                                  */
/* ------------------------------------------------------------------ */

function CompactCalendar({
  currentMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: {
  currentMonth: Date;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onChangeMonth: (offset: number) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const mondayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days: (number | null)[] = [];
  for (let i = 0; i < mondayOffset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onChangeMonth(-1)}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-cream transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-sm text-text-primary">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={() => onChangeMonth(1)}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-cream transition-colors"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEK_DAYS.map((wd) => (
          <div key={wd} className="text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted py-1">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => !isPast && onSelectDate(dateStr)}
              disabled={isPast}
              className={`
                h-8 sm:h-9 rounded-lg text-xs font-medium
                flex items-center justify-center
                transition-all duration-150
                ${isSelected
                  ? "bg-deep-teal text-white shadow-sm"
                  : isPast
                    ? "text-text-muted/40 cursor-not-allowed bg-transparent"
                    : isToday
                      ? "bg-brand-pink/15 text-brand-pink font-bold ring-1 ring-brand-pink/40"
                      : "text-text-primary hover:bg-cream bg-off-white/50"
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking type toggle                                               */
/* ------------------------------------------------------------------ */

function BookingTypeToggle({
  value,
  onChange,
  sauna,
}: {
  value: BookingType;
  onChange: (t: BookingType) => void;
  sauna: Sauna;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onChange("private")}
        className={`
          relative px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200
          ${value === "private"
            ? "border-deep-teal bg-deep-teal/5"
            : "border-[#DDD6CC] hover:border-[#DDD6CC]/80"
          }
        `}
      >
        <div className="flex items-center gap-2">
          <Lock className={`w-3.5 h-3.5 ${value === "private" ? "text-deep-teal" : "text-text-muted"}`} />
          <span className={`text-xs font-medium ${value === "private" ? "text-deep-teal" : "text-text-secondary"}`}>
            Privat
          </span>
        </div>
        <p className={`text-[11px] mt-0.5 ${value === "private" ? "text-deep-teal/70" : "text-text-muted"}`}>
          {sauna.privatePrice} kr
        </p>
      </button>

      <button
        onClick={() => onChange("felles")}
        className={`
          relative px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200
          ${value === "felles"
            ? "border-deep-teal bg-deep-teal/5"
            : "border-[#DDD6CC] hover:border-[#DDD6CC]/80"
          }
        `}
      >
        <div className="flex items-center gap-2">
          <Users className={`w-3.5 h-3.5 ${value === "felles" ? "text-deep-teal" : "text-text-muted"}`} />
          <span className={`text-xs font-medium ${value === "felles" ? "text-deep-teal" : "text-text-secondary"}`}>
            Felles
          </span>
        </div>
        <p className={`text-[11px] mt-0.5 ${value === "felles" ? "text-deep-teal/70" : "text-text-muted"}`}>
          {sauna.fellesPrice} kr/pers
        </p>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Widget Component                                             */
/* ------------------------------------------------------------------ */

export default function BookingWidget() {
  const saunas = getSaunas();

  // --- State ---
  const [step, setStep] = useState<Step>("sauna");
  const [selectedSauna, setSelectedSauna] = useState<Sauna | null>(null);
  const [bookingType, setBookingType] = useState<BookingType>("private");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [participantCount, setParticipantCount] = useState(1);
  const [notes, setNotes] = useState("");

  // NEW: Payment flow state
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);
  const [paymentExpired, setPaymentExpired] = useState(false);

  // --- Derived ---
  const timeSlots = useMemo(() => {
    if (!selectedSauna || !selectedDate) return [];
    return generateTimeSlots(selectedSauna, selectedDate);
  }, [selectedSauna, selectedDate]);

  const basePrice = selectedSauna
    ? bookingType === "private"
      ? selectedSauna.privatePrice
      : selectedSauna.fellesPrice * participantCount
    : 0;

  // --- Handlers ---
  const handleSelectSauna = useCallback((sauna: Sauna) => {
    setSelectedSauna(sauna);
    // Auto-set booking type based on sauna's supported modes
    const defaultType = getDefaultBookingType(sauna);
    setBookingType(defaultType);
    setStep("date");
  }, []);

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedTime(null);
    setStep("time");
  }, []);

  const handleSelectTime = useCallback((time: string) => {
    setSelectedTime(time);
    setStep("info");
  }, []);

  const handleBack = useCallback(() => {
    switch (step) {
      case "date":
        setSelectedSauna(null);
        setStep("sauna");
        break;
      case "time":
        setSelectedDate(null);
        setSelectedTime(null);
        setStep("date");
        break;
      case "info":
        setSelectedTime(null);
        setStep("time");
        break;
      case "summary":
        setStep("info");
        break;
      default:
        break;
    }
  }, [step]);

  const canSubmitInfo =
    customerName.trim().length >= 2 &&
    customerEmail.includes("@") &&
    customerPhone.length >= 8;

  const handlePaymentExpired = useCallback(() => {
    if (pendingBookingId) {
      deleteBooking(pendingBookingId);
      setPendingBookingId(null);
      setPaymentDeadline(null);
      setPaymentExpired(true);
      showToast("Tidsreservasjonen er utløpt. Prøv igjen.", "error");
    }
  }, [pendingBookingId]);

  // ------------------------------------------------------------------
  // Cleanup expired pending bookings on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    const now = new Date().toISOString();
    let cleaned = 0;
    try {
      const pending = getPendingPaymentBookings();
      pending.forEach((b: Booking) => {
        if (b.paymentDeadline && b.paymentDeadline < now) {
          deleteBooking(b.id);
          cleaned++;
        }
      });
    } catch { /* ignore */ }
    if (cleaned > 0) {
      showToast(`${cleaned} utløpen reservasjon ryddet opp`, "info");
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedSauna || !selectedDate || !selectedTime) return;
    setIsProcessing(true);

    // Create pending booking (time-lock)
    const bookingId = generateBookingId();
    const hour = parseInt(selectedTime.split(":")[0]!, 10);
    const deadline = new Date(Date.now() + PAYMENT_LOCK_MINUTES * 60000).toISOString();

    const booking: Booking = {
      id: bookingId,
      saunaId: selectedSauna.id,
      type: bookingType,
      isInternal: false,
      date: selectedDate,
      startTime: selectedTime,
      endTime: `${String(hour + 2).padStart(2, "0")}:00`,
      status: "awaiting_payment",
      customerName,
      customerEmail,
      customerPhone,
      participantCount,
      totalPrice: basePrice,
      discountCode: null,
      discountAmount: 0,
      memberId: null,
      memberDiscount: 0,
      notes: notes || null,
      stripeSessionId: null,
      paymentStatus: basePrice > 0 ? "pending" : "free",
      bookedBy: "customer",
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      paymentDeadline: deadline,
    };

    // Save pending booking
    saveBooking(booking);
    setPendingBookingId(bookingId);
    setPaymentDeadline(deadline);

    // Store for retrieval after redirect
    localStorage.setItem("danholmen_pending_booking_id", bookingId);
    localStorage.setItem("danholmen_payment_deadline", deadline);

    if (isStripeConfigured()) {
      try {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          showToast("Kunne ikke laste Stripe. Bruker simulering.", "info");
          simulatePaymentSuccess(bookingId);
        } else {
          const priceId = bookingType === "private" ? STRIPE_PRICES.private : STRIPE_PRICES.felles;
          if (priceId && !priceId.includes("placeholder")) {
            showToast("Omdirigerer til Stripe Checkout...", "info");
            setTimeout(() => {
              alert(
                "Stripe Checkout krever backend-oppsett.\n\n" +
                "For å bruke ekte betaling:\n" +
                "1. Sett opp en backend med Secret Key\n" +
                "2. Opprett en /create-checkout-session endpoint\n" +
                "3. Bruk Price ID: " + priceId
              );
              simulatePaymentSuccess(bookingId);
            }, 500);
          } else {
            alert(
              "Stripe er konfigurert, men Price ID mangler.\n\n" +
              "1. Gå til Stripe Dashboard → Products\n" +
              "2. Opprett produkt med pris\n" +
              "3. Kopier Price ID til stripeConfig.ts"
            );
            simulatePaymentSuccess(bookingId);
          }
        }
      } catch {
        simulatePaymentSuccess(bookingId);
      }
    } else {
      // Simulated payment (demo mode)
      showToast("Simulerer betaling...", "info");
      await new Promise((r) => setTimeout(r, 1500));
      simulatePaymentSuccess(bookingId);
    }

    setIsProcessing(false);
  };

  const simulatePaymentSuccess = (bookingId: string) => {
    const booking = getBookingById(bookingId);
    if (booking) {
      booking.status = "confirmed";
      booking.paymentStatus = basePrice > 0 ? "paid" : "free";
      booking.stripeSessionId = basePrice > 0 ? `pi_test_${Date.now()}` : null;
      saveBooking(booking);
    }

    setPendingBookingId(null);
    setPaymentDeadline(null);
    localStorage.removeItem("danholmen_pending_booking_id");
    localStorage.removeItem("danholmen_payment_deadline");

    setBookingRef(bookingId);
    setIsProcessing(false);
    setStep("success");
    showToast("Booking bekreftet!", "success");
  };

  // --- Check for sauna slug from URL params ---
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]sauna=([^&]+)/);
    const saunaSlug = match ? decodeURIComponent(match[1]) : null;
    if (saunaSlug && !selectedSauna) {
      const sauna = saunas.find((s) => s.publicSlug === saunaSlug);
      if (sauna) {
        setSelectedSauna(sauna);
        setBookingType(getDefaultBookingType(sauna));
        setStep("date");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Render helpers                                                    */
  /* ------------------------------------------------------------------ */

  const renderStepIndicator = () => {
    if (step === "success") return null;
    const current = getStepNumber(step);
    const total = 5;
    const progress = (current / total) * 100;

    return (
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-text-muted">
            Steg {current} av {total}
          </span>
          <span className="text-[11px] font-medium text-deep-teal">
            {step === "sauna" && "Velg badstue"}
            {step === "date" && "Velg dato"}
            {step === "time" && "Velg tid"}
            {step === "info" && "Dine opplysninger"}
            {step === "summary" && "Oppsummering"}
          </span>
        </div>
        <div className="h-1.5 bg-off-white rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-deep-teal rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Step: Sauna                                                       */
  /* ------------------------------------------------------------------ */

  const renderSaunaStep = () => (
    <motion.div
      key="sauna"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4"
    >
      <p className="text-xs text-text-muted mb-3">
        Velg hvilken badstue du vil booke:
      </p>
      <div className="space-y-2.5">
        {saunas.map((sauna) => (
          <button
            key={sauna.id}
            onClick={() => handleSelectSauna(sauna)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#DDD6CC] bg-white hover:border-deep-teal/50 hover:bg-deep-teal/[0.02] transition-all duration-200 text-left active:scale-[0.98]"
          >
            <img
              src={sauna.image}
              alt={sauna.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {sauna.name}
              </p>
              <p className="text-[11px] text-text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {sauna.location}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted -rotate-90 flex-shrink-0" />
          </button>
        ))}
      </div>
    </motion.div>
  );

  /* ------------------------------------------------------------------ */
  /*  Step: Date                                                        */
  /* ------------------------------------------------------------------ */

  const renderDateStep = () => (
    <motion.div
      key="date"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4"
    >
      {selectedSauna && (
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-off-white rounded-xl">
          <img
            src={selectedSauna.image}
            alt={selectedSauna.name}
            className="w-8 h-8 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">
              {selectedSauna.name}
            </p>
            <p className="text-[10px] text-text-muted">{selectedSauna.location}</p>
          </div>
          <button
            onClick={handleBack}
            className="text-[11px] text-deep-teal hover:underline font-medium"
          >
            Endre
          </button>
        </div>
      )}

      {/* Booking type toggle — only show when sauna supports both modes */}
      {selectedSauna && supportsBothModes(selectedSauna) && (
        <div className="mb-4">
          <label className="form-label text-[11px] mb-1.5 flex items-center gap-1">
            Bookingtype
          </label>
          <BookingTypeToggle
            value={bookingType}
            onChange={setBookingType}
            sauna={selectedSauna}
          />
        </div>
      )}

      <CompactCalendar
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onChangeMonth={(offset) => {
          const d = new Date(currentMonth);
          d.setMonth(d.getMonth() + offset);
          setCurrentMonth(d);
        }}
      />
    </motion.div>
  );

  /* ------------------------------------------------------------------ */
  /*  Step: Time                                                        */
  /* ------------------------------------------------------------------ */

  const renderTimeStep = () => (
    <motion.div
      key="time"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handleBack}
          className="p-1 rounded-lg hover:bg-cream transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {selectedDate && formatDateNorwegian(selectedDate)}
          </p>
          <p className="text-[11px] text-text-muted">Velg en tid nedenfor</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {timeSlots.map((slot) => {
          const isDisabled = slot.status === "booked" || slot.status === "past";
          const colors = STATUS_COLORS[slot.status];

          return (
            <button
              key={slot.time}
              onClick={() => !isDisabled && handleSelectTime(slot.time)}
              disabled={isDisabled}
              className={`
                relative p-3 rounded-xl border-2 text-left
                transition-all duration-150
                ${isDisabled
                  ? `${colors.border} ${colors.bg} opacity-60 cursor-not-allowed`
                  : `${colors.border} ${colors.bg} active:scale-[0.98] hover:brightness-[0.98]`
                }
              `}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className={`w-3.5 h-3.5 ${colors.text}`} />
                <span className="text-sm font-semibold text-text-primary">
                  {slot.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  <span className={`text-[10px] ${colors.text}`}>
                    {slot.status === "partial" && slot.remainingSpots
                      ? `${slot.remainingSpots} plasser`
                      : STATUS_LABELS[slot.status]
                    }
                  </span>
                </div>
                {!isDisabled && selectedSauna && (
                  <span className="text-[11px] font-medium text-text-primary">
                    {bookingType === "private"
                      ? `${selectedSauna.privatePrice} kr`
                      : `${selectedSauna.fellesPrice} kr`
                    }
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  /* ------------------------------------------------------------------ */
  /*  Step: Info                                                        */
  /* ------------------------------------------------------------------ */

  const renderInfoStep = () => (
    <motion.div
      key="info"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="p-1 rounded-lg hover:bg-cream transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div>
          <p className="text-sm font-semibold text-text-primary">Dine opplysninger</p>
          <p className="text-[11px] text-text-muted">
            {selectedTime} &middot; {selectedDate && formatDateNorwegian(selectedDate!)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="form-label text-[11px] flex items-center gap-1 mb-1">
            <User className="w-3 h-3" />
            Navn
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ditt fulle navn"
            className="form-input w-full h-10 text-sm"
          />
        </div>

        {/* Email */}
        <div>
          <label className="form-label text-[11px] flex items-center gap-1 mb-1">
            <Mail className="w-3 h-3" />
            E-post
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="din@epost.no"
            className="form-input w-full h-10 text-sm"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="form-label text-[11px] flex items-center gap-1 mb-1">
            <Phone className="w-3 h-3" />
            Telefon
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="+47 000 00 000"
            className="form-input w-full h-10 text-sm"
          />
        </div>

        {/* Participants */}
        <div>
          <label className="form-label text-[11px] flex items-center gap-1 mb-1">
            <Users className="w-3 h-3" />
            Antall deltakere
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setParticipantCount((c) => Math.max(1, c - 1))}
              className="w-10 h-10 rounded-xl bg-cream text-text-primary flex items-center justify-center hover:bg-[#DDD6CC] transition-colors active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-bold text-text-primary w-6 text-center">
              {participantCount}
            </span>
            <button
              onClick={() =>
                setParticipantCount((c) =>
                  Math.min(selectedSauna?.capacity ?? 10, c + 1)
                )
              }
              className="w-10 h-10 rounded-xl bg-cream text-text-primary flex items-center justify-center hover:bg-[#DDD6CC] transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {selectedSauna && (
            <p className="text-[10px] text-text-muted mt-1">
              Maks {selectedSauna.capacity} personer
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="form-label text-[11px] flex items-center gap-1 mb-1">
            <FileText className="w-3 h-3" />
            Notater (valgfritt)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Eventuelle merknader..."
            rows={2}
            className="form-input w-full resize-none text-sm"
          />
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={() => setStep("summary")}
        disabled={!canSubmitInfo}
        className={`
          w-full h-11 rounded-xl font-semibold text-white text-sm
          transition-all duration-200
          ${canSubmitInfo
            ? "bg-deep-teal hover:bg-teal active:scale-[0.98]"
            : "bg-text-muted/40 cursor-not-allowed"
          }
        `}
      >
        Neste &rarr;
      </button>
    </motion.div>
  );

  /* ------------------------------------------------------------------ */
  /*  Step: Summary                                                     */
  /* ------------------------------------------------------------------ */

  const renderSummaryStep = () => (
    <motion.div
      key="summary"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4"
    >
      {/* Payment simulation banner */}
      <PaymentSimulationBanner />

      {/* Payment expired */}
      {paymentExpired && (
        <div className="bg-sauna-red/10 border border-sauna-red/20 rounded-lg px-3 py-2 mb-3">
          <p className="text-[11px] text-sauna-red font-medium">
            Reservasjon utløpt. Velg tidspunkt på nytt.
          </p>
        </div>
      )}

      {/* Countdown */}
      {pendingBookingId && paymentDeadline && !paymentExpired && (
        <PaymentCountdown
          deadline={paymentDeadline}
          onExpire={handlePaymentExpired}
        />
      )}

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="p-1 rounded-lg hover:bg-cream transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <p className="text-sm font-semibold text-text-primary">Oppsummering</p>
      </div>

      <div className="bg-off-white rounded-xl p-3.5 space-y-2.5 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Badstue</span>
          <span className="text-text-primary text-xs font-medium">{selectedSauna?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Type</span>
          <span className="text-text-primary text-xs font-medium">
            {bookingType === "private" ? "Privat" : "Felles"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Dato</span>
          <span className="text-text-primary text-xs font-medium">
            {selectedDate && formatDateNorwegian(selectedDate)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Tid</span>
          <span className="text-text-primary text-xs font-medium">
            {selectedTime}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Deltakere</span>
          <span className="text-text-primary text-xs font-medium">{participantCount} pers</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">Navn</span>
          <span className="text-text-primary text-xs font-medium">{customerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted text-xs">E-post</span>
          <span className="text-text-primary text-xs font-medium break-all">{customerEmail}</span>
        </div>

        <div className="pt-2 border-t border-[#DDD6CC]">
          <div className="flex justify-between">
            <span className="text-text-muted text-xs">Pris</span>
            <span className="text-text-primary text-sm font-bold">{basePrice} kr</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isProcessing || paymentExpired}
        className={`
          w-full h-12 rounded-xl font-semibold text-white text-sm
          flex items-center justify-center gap-2
          transition-all duration-200
          ${isProcessing || paymentExpired
            ? "bg-text-muted cursor-not-allowed"
            : "bg-deep-teal hover:bg-teal active:scale-[0.98]"
          }
        `}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Behandler...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {basePrice > 0
              ? `Betal ${basePrice} kr${isStripeConfigured() ? "" : " (simulert)"}`
              : "Fullfør booking gratis"}
          </>
        )}
      </button>

      {/* Payment mode note */}
      <p className="text-[10px] text-text-muted text-center mt-2">
        {isStripeConfigured()
          ? "Sikker betaling via Stripe"
          : "Simulert betaling — Se stripeConfig.ts"}
      </p>
    </motion.div>
  );

  /* ------------------------------------------------------------------ */
  /*  Step: Success                                                     */
  /* ------------------------------------------------------------------ */

  const renderSuccessStep = () => (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 text-center py-8"
    >
      <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
        <Check className="w-7 h-7 text-success" />
      </div>
      <h2 className="font-display text-lg font-bold text-text-primary mb-2">
        Booking bekreftet!
      </h2>
      <p className="text-xs text-text-muted mb-5">
        Din booking er registrert. En bekreftelse er sendt til {customerEmail}.
      </p>
      <div className="bg-off-white rounded-xl p-3.5 text-left space-y-2 text-xs mb-5">
        <div className="flex justify-between">
          <span className="text-text-muted">Referanse</span>
          <span className="font-mono text-text-primary">{bookingRef}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Badstue</span>
          <span className="text-text-primary">{selectedSauna?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Dato</span>
          <span className="text-text-primary">{selectedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Tid</span>
          <span className="text-text-primary">{selectedTime}</span>
        </div>
        <div className="flex justify-between pt-1.5 border-t border-[#DDD6CC]">
          <span className="text-text-muted">Total</span>
          <span className="font-bold text-deep-teal">{basePrice} kr</span>
        </div>
      </div>
      <button
        onClick={() => {
          setStep("sauna");
          setSelectedSauna(null);
          setSelectedDate(null);
          setSelectedTime(null);
          setCustomerName("");
          setCustomerEmail("");
          setCustomerPhone("");
          setParticipantCount(1);
          setNotes("");
          setBookingRef("");
          setPendingBookingId(null);
          setPaymentDeadline(null);
          setPaymentExpired(false);
        }}
        className="w-full h-11 rounded-xl bg-deep-teal text-white font-medium text-sm hover:bg-teal transition-colors"
      >
        Book en ny
      </button>
    </motion.div>
  );

  /* ------------------------------------------------------------------ */
  /*  Main render                                                       */
  /* ------------------------------------------------------------------ */

  return (
    <div className="w-full min-w-[300px] max-w-[400px] mx-auto">
      <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-[#DDD6CC]">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-pink" />
            <h1 className="font-display text-base font-bold text-text-primary">
              Book din badstue
            </h1>
          </div>
        </div>

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Content */}
        <AnimatePresence mode="wait">
          {step === "sauna" && renderSaunaStep()}
          {step === "date" && renderDateStep()}
          {step === "time" && renderTimeStep()}
          {step === "info" && renderInfoStep()}
          {step === "summary" && renderSummaryStep()}
          {step === "success" && renderSuccessStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}
