import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  ArrowLeft,
  Users,
  Lock,
  Minus,
  Plus,
  CreditCard,
  Check,
  LogIn,
  User,
  Mail,
  Phone,
  FileText,
  Tag,
  Shield,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Timer,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import {
  getSaunaBySlug,
  getBookingsBySaunaAndDate,
  getDiscountByCode,
  saveBooking,
  getCurrentMember,
  memberLogin,
  deleteBooking,
  getBookingById,
  getPendingPaymentBookings,
  checkBookingConflict,
  isBookingTypeAllowed,
  getSavedCustomer,
  saveCustomer,
  clearSavedCustomer,
} from "@/data/store";
import {
  isStripeConfigured,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_PRICES,
  PAYMENT_LOCK_MINUTES,
} from "@/data/stripeConfig";
import { sendConfirmation } from "@/data/emailService";
import WizardCalendar from "./booking/WizardCalendar";
import type { DateAvailability } from "./booking/WizardCalendar";
import TimeSlotGrid from "./booking/TimeSlotGrid";
import type { TimeSlot } from "./booking/TimeSlotGrid";
import type { Booking, BookingType, Member, Sauna } from "@/data/types";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type WizardStep = 1 | 2 | 3 | 4;

// ------------------------------------------------------------------
// Steps config (dynamic based on sauna bookingModes)
// ------------------------------------------------------------------
function getSteps(supportsBoth: boolean): { num: WizardStep; label: string }[] {
  if (supportsBoth) {
    return [
      { num: 1, label: "Type" },
      { num: 2, label: "Dato & tid" },
      { num: 3, label: "Detaljer" },
      { num: 4, label: "Betal" },
    ];
  }
  // Single mode: skip type selection, go straight to date
  return [
    { num: 2, label: "Dato & tid" },
    { num: 3, label: "Detaljer" },
    { num: 4, label: "Betal" },
  ];
}

/**
 * Get the default booking type for a sauna based on its supported modes.
 */
function getDefaultBookingType(sauna: Sauna): BookingType {
  if (sauna.bookingModes?.length === 1) {
    return sauna.bookingModes[0] === "private" ? "private" : "felles";
  }
  // Default to private when both are available
  return "private";
}

/**
 * Check if sauna supports both booking modes.
 */
function supportsBothModes(sauna: Sauna): boolean {
  const modes = sauna.bookingModes ?? ["private", "shared"];
  return modes.includes("private") && modes.includes("shared");
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Generate time slots for a sauna on a given date.
 * Uses centralized checkBookingConflict for consistency.
 * Respects sauna capacity for shared booking limits.
 */
function generateTimeSlots(
  sauna: Sauna,
  dateStr: string,
  selectedBookingType: BookingType
): TimeSlot[] {
  const bookings = getBookingsBySaunaAndDate(sauna.id, dateStr);
  const slots: TimeSlot[] = [];
  const times = [
    "06:00", "08:00", "10:00", "12:00",
    "14:00", "16:00", "18:00", "20:00", "22:00",
  ];

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = now.toISOString().split("T")[0];

  times.forEach((time) => {
    const hour = parseInt(time.split(":")[0]!, 10);

    // Check if slot is in the past
    if (dateStr < todayStr || (dateStr === todayStr && hour <= currentHour)) {
      slots.push({
        time,
        label: `${time}-${String(hour + 2).padStart(2, "0")}:00`,
        status: "past",
        price: 0,
      });
      return;
    }

    // Use centralized conflict checker
    const isBlocked = checkBookingConflict(sauna, dateStr, time, selectedBookingType, bookings);

    // Determine slot status for display
    const slotBookings = bookings.filter(
      (b) => b.startTime === time && b.status !== "cancelled"
    );
    const hasPrivateBooking = slotBookings.some((b) => b.type === "private");
    const fellesBookings = slotBookings.filter((b) => b.type === "felles");
    const totalFellesParticipants = fellesBookings.reduce(
      (sum, b) => sum + b.participantCount, 0
    );

    let status: "available" | "partial" | "booked" | "past" = "available";
    let remainingSpots: number | undefined;

    if (isBlocked) {
      status = "booked";
    }

    // If not blocked but felles participants exist, show partial
    if (!isBlocked && totalFellesParticipants > 0) {
      status = "partial";
      remainingSpots = sauna.capacity - totalFellesParticipants;
    }

    // If booking type not allowed for this sauna, mark as booked
    if (!isBookingTypeAllowed(sauna as Sauna, selectedBookingType)) {
      status = "booked";
      remainingSpots = undefined;
    }

    slots.push({
      time,
      label: `${time}-${String(hour + 2).padStart(2, "0")}:00`,
      status,
      remainingSpots,
      price: 0,
    });
  });

  return slots;
}

function generateBookingId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatPriceLabel(type: BookingType, price: number, sauna?: { capacity: number }): string {
  if (type === "private") {
    return `${price} kr`;
  }
  return `${price} kr/person`;
}

// ------------------------------------------------------------------
// Toast helper
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Payment simulation banner
// ------------------------------------------------------------------
function PaymentSimulationBanner() {
  if (isStripeConfigured()) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            Betalingssimulering aktiv
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Konfigurer Stripe i <code className="bg-amber-100 px-1 rounded">stripeConfig.ts</code> for ekte betaling.
            Nåværende modus: simulert betaling.
          </p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Countdown timer display
// ------------------------------------------------------------------
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
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <Timer className="w-4 h-4 text-amber-600 shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800">
          Tidsreservasjon aktiv
        </p>
        <p className="text-xs text-amber-700">
          Fullfør betalingen innen{" "}
          <span className="font-mono font-bold">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>{" "}
          for å beholde din plass.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function SingleSaunaBooking() {
  const navigate = useNavigate();
  const { saunaSlug } = useParams<{ saunaSlug: string }>();
  const sauna = saunaSlug ? getSaunaBySlug(saunaSlug) : undefined;

  // Wizard state
  const saunaSupportsBoth = sauna ? supportsBothModes(sauna) : true;
  const [step, setStep] = useState<WizardStep>(saunaSupportsBoth ? 1 : 2);
  const [bookingType, setBookingType] = useState<BookingType | null>(
    sauna ? getDefaultBookingType(sauna) : null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Auto-set booking type and skip step 1 when sauna supports only one mode
  useEffect(() => {
    if (sauna && !saunaSupportsBoth) {
      const defaultType = getDefaultBookingType(sauna);
      setBookingType(defaultType);
      if (step === 1) {
        setStep(2);
      }
    }
  }, [sauna, saunaSupportsBoth, step]);

  // Form state
  const saved = getSavedCustomer();
  const [customerName, setCustomerName] = useState(saved?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(saved?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(saved?.phone ?? "");
  const [participantCount, setParticipantCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [rememberMe, setRememberMe] = useState(!!saved);

  // Discount
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(0);
  const [discountError, setDiscountError] = useState("");

  // Auth state
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggedInMember, setLoggedInMember] = useState<Member | null>(null);

  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [vilkarModalOpen, setVilkarModalOpen] = useState(false);

  // NEW: Payment flow state
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);
  const [paymentExpired, setPaymentExpired] = useState(false);

  // Derived: compute availability for calendar dots
  const dateAvailability = useMemo<Record<string, DateAvailability>>(() => {
    if (!sauna) return {};
    const map: Record<string, DateAvailability> = {};
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const slots = generateTimeSlots(sauna, dateStr, bookingType ?? "private");
      const availableCount = slots.filter((s) => s.status === "available").length;
      const partialCount = slots.filter((s) => s.status === "partial").length;
      const bookedCount = slots.filter((s) => s.status === "booked").length;

      if (bookedCount === slots.length && slots.length > 0) {
        map[dateStr] = "full";
      } else if (partialCount > 0 || (availableCount > 0 && bookedCount > 0)) {
        map[dateStr] = "partial";
      } else if (availableCount > 0) {
        map[dateStr] = "available";
      }
    }
    return map;
  }, [sauna, currentMonth, bookingType]);

  // Time slots for selected date
  const timeSlots = useMemo(() => {
    if (!sauna || !selectedDate || !bookingType) return [];
    return generateTimeSlots(sauna, selectedDate, bookingType).map((s) => ({
      ...s,
      price: bookingType === "private" ? sauna.privatePrice : sauna.fellesPrice,
    }));
  }, [sauna, selectedDate, bookingType]);

  // Pricing
  const memberDiscountRate = loggedInMember?.localDiscountRate ?? 0;
  const isVelMember = loggedInMember?.tier === "vel";

  const basePrice = useMemo(() => {
    if (!sauna || !bookingType) return 0;
    return bookingType === "private"
      ? sauna.privatePrice
      : sauna.fellesPrice * participantCount;
  }, [sauna, bookingType, participantCount]);

  const memberDiscountAmount = Math.round(basePrice * memberDiscountRate);
  const priceAfterMemberDiscount = basePrice - memberDiscountAmount;
  const priceAfterCode = Math.max(0, priceAfterMemberDiscount - discountApplied);

  // Vel member geography check (simplified - always allow for now)
  const canUseVelDiscount = isVelMember;
  const finalPrice = isVelMember && bookingType === "felles" ? 0 : priceAfterCode;

  // ------------------------------------------------------------------
  // Check for Stripe redirect (success/cancel)
  // ------------------------------------------------------------------
  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    // Check if we returned from Stripe Checkout
    if (hash.includes("booking-confirmed") || search.includes("success=1")) {
      const urlParams = new URLSearchParams(search);
      const sessionId = urlParams.get("session_id");

      // Retrieve pending booking from localStorage
      const pendingId = localStorage.getItem("danholmen_pending_booking_id");
      if (pendingId) {
        // Update booking to confirmed
        const booking = getBookingById(pendingId);
        if (booking && booking.status === "awaiting_payment") {
          booking.status = "confirmed" as const;
          booking.paymentStatus = finalPrice > 0 ? "paid" : "free";
          if (sessionId) {
            booking.stripeSessionId = sessionId;
          }
          saveBooking(booking);
          setBookingRef(pendingId);
          setIsBooked(true);
          showToast("Betaling bekreftet! Booking er bekreftet.", "success");
        }
        // Clear pending
        localStorage.removeItem("danholmen_pending_booking_id");
        localStorage.removeItem("danholmen_payment_deadline");
      }
    }

    if (hash.includes("booking-cancelled")) {
      const pendingId = localStorage.getItem("danholmen_pending_booking_id");
      if (pendingId) {
        deleteBooking(pendingId);
        localStorage.removeItem("danholmen_pending_booking_id");
        localStorage.removeItem("danholmen_payment_deadline");
        showToast("Betaling avbrutt. Tidsrommet er nå ledig igjen.", "info");
      }
      // Reset wizard
      resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Cleanup expired pending bookings on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    const pending = getPendingPaymentBookings();
    const now = new Date().toISOString();
    let cleaned = 0;
    pending.forEach((b: Booking) => {
      if (b.paymentDeadline && b.paymentDeadline < now) {
        deleteBooking(b.id);
        cleaned++;
      }
    });
    if (cleaned > 0) {
      showToast(`${cleaned} utløpen reservasjon ryddet opp`, "info");
    }
  }, []);

  // ------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------
  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as WizardStep);
  };

  const handlePrev = () => {
    const minStep = saunaSupportsBoth ? 1 : 2;
    if (step > minStep) setStep((s) => (s - 1) as WizardStep);
  };

  const resetWizard = useCallback(() => {
    const supportsBoth = sauna ? supportsBothModes(sauna) : true;
    setStep(supportsBoth ? 1 : 2);
    setBookingType(sauna ? getDefaultBookingType(sauna) : null);
    setCurrentMonth(new Date());
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setParticipantCount(1);
    setNotes("");
    setDiscountCode("");
    setDiscountApplied(0);
    setDiscountError("");
    setLoggedInMember(null);
    setTermsAccepted(false);
    setIsBooked(false);
    setBookingRef("");
    setShowLogin(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setPendingBookingId(null);
    setPaymentDeadline(null);
    setPaymentExpired(false);
  }, []);

  const handlePaymentExpired = useCallback(() => {
    if (pendingBookingId) {
      deleteBooking(pendingBookingId);
      setPendingBookingId(null);
      setPaymentDeadline(null);
      setPaymentExpired(true);
      showToast("Tidsreservasjonen er utløpt. Prøv igjen.", "error");
    }
  }, [pendingBookingId]);

  const handleApplyDiscount = () => {
    setDiscountError("");
    setDiscountApplied(0);
    if (!discountCode.trim()) return;
    const code = getDiscountByCode(discountCode.trim());
    if (!code) {
      setDiscountError("Ugyldig rabattkode");
      return;
    }
    if (!code.isActive) {
      setDiscountError("Rabattkoden er ikke lenger aktiv");
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    if (now < code.validFrom || now > code.validUntil) {
      setDiscountError("Rabattkoden er utløpt");
      return;
    }
    if (code.appliesTo !== "all" && code.appliesTo !== bookingType) {
      setDiscountError(
        `Koden gjelder ikke for ${bookingType === "private" ? "privat" : "felles"} booking`
      );
      return;
    }
    const amount =
      code.discountType === "percentage"
        ? Math.round(priceAfterMemberDiscount * (code.discountValue / 100))
        : code.discountValue;
    setDiscountApplied(amount);
    showToast(`Rabattkode aktivert: -${amount} kr`, "success");
  };

  const handleLogin = () => {
    setLoginError("");
    const member = memberLogin(loginEmail, loginPassword);
    if (member) {
      setLoggedInMember(member);
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      showToast(`Velkommen, ${member.firstName}!`, "success");
    } else {
      setLoginError("Ugyldig e-post eller passord");
    }
  };

  // ------------------------------------------------------------------
  // NEW: Handle payment with time-lock + Stripe redirect
  // ------------------------------------------------------------------
  const handlePayment = async () => {
    if (!sauna || !selectedDate || !selectedTime || !bookingType) return;
    if (!termsAccepted) {
      showToast("Du må godta vilkårene", "error");
      return;
    }

    setIsProcessing(true);

    // Create a pending booking first (locks the time slot)
    const bookingId = generateBookingId();
    const hour = parseInt(selectedTime.split(":")[0]!, 10);
    const deadline = new Date(Date.now() + PAYMENT_LOCK_MINUTES * 60000).toISOString();

    const booking: Booking = {
      id: bookingId,
      saunaId: sauna.id,
      type: bookingType,
      isInternal: false,
      date: selectedDate,
      startTime: selectedTime,
      endTime: `${String(hour + 2).padStart(2, "0")}:00`,
      status: "awaiting_payment",
      customerName,
      customerEmail,
      customerPhone,
      participantCount: bookingType === "private" ? participantCount : 1,
      totalPrice: finalPrice,
      discountCode: discountCode || null,
      discountAmount: discountApplied,
      memberId: loggedInMember?.id ?? null,
      memberDiscount: memberDiscountRate,
      notes: notes || null,
      stripeSessionId: null,
      paymentStatus: finalPrice > 0 ? "pending" : "free",
      bookedBy: "customer",
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      paymentDeadline: deadline,
    };

    // Save pending booking with deadline
    saveBooking(booking);
    setPendingBookingId(bookingId);
    setPaymentDeadline(deadline);

    // Store in localStorage for retrieval after redirect
    localStorage.setItem("danholmen_pending_booking_id", bookingId);
    localStorage.setItem("danholmen_payment_deadline", deadline);

    // Save customer info if "Remember me" is checked
    if (rememberMe) {
      saveCustomer({ name: customerName, email: customerEmail, phone: customerPhone });
    } else {
      clearSavedCustomer();
    }

    if (isStripeConfigured()) {
      // MODE A: Stripe Checkout (keys configured)
      try {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          showToast("Kunne ikke laste Stripe. Prøv igjen.", "error");
          setIsProcessing(false);
          return;
        }

        // NOTE: Creating a Checkout Session requires Secret Key (backend only).
        // For client-only: use Stripe Payment Links or redirect to a pre-built URL.
        // Fallback: redirect to a payment link or show manual instructions
        const priceId = bookingType === "private" ? STRIPE_PRICES.private : STRIPE_PRICES.felles;

        if (priceId && !priceId.includes("placeholder")) {
          // If Price ID is configured, try to redirect to Checkout
          // This WON'T work without backend, but we show the attempt
          showToast("Omdirigerer til Stripe Checkout...", "info");

          // For now, inform user that backend is needed
          setTimeout(() => {
            alert(
              "Stripe Checkout krever backend-oppsett.\n\n" +
              "For å bruke ekte betaling:\n" +
              "1. Sett opp en backend med Secret Key\n" +
              "2. Opprett en /create-checkout-session endpoint\n" +
              "3. Bruk Price ID: " + priceId + "\n\n" +
              "Se instruksjoner i stripeConfig.ts"
            );
            // Simulate success for demo
            simulatePaymentSuccess(bookingId);
          }, 500);
        } else {
          // Price ID not set - show instructions
          alert(
            "Stripe er konfigurert, men Price ID mangler.\n\n" +
            "1. Gå til Stripe Dashboard → Products\n" +
            "2. Opprett produkt med pris\n" +
            "3. Kopier Price ID til stripeConfig.ts\n\n" +
            "For nå: simulert betaling vil kjøre."
          );
          simulatePaymentSuccess(bookingId);
        }
      } catch {
        showToast("Stripe-feil. Bruker simulert betaling.", "info");
        simulatePaymentSuccess(bookingId);
      }
    } else {
      // MODE B: Simulated payment (demo mode)
      showToast("Simulerer betaling...", "info");
      await new Promise((r) => setTimeout(r, 1500));
      simulatePaymentSuccess(bookingId);
    }

    setIsProcessing(false);
  };

  const simulatePaymentSuccess = async (bookingId: string) => {
    // Update booking to confirmed
    const booking = getBookingById(bookingId);
    if (booking) {
      booking.status = "confirmed" as const;
      booking.paymentStatus = finalPrice > 0 ? "paid" : "free";
      booking.stripeSessionId = finalPrice > 0 ? `pi_test_${Date.now()}` : null;
      saveBooking(booking);
    }

    // Send e-postbekreftelse
    if (sauna) {
      await sendConfirmation("booking", {
        customerName,
        customerEmail,
        saunaName: sauna.name,
        bookingDate: selectedDate || "",
        bookingTime: selectedTime || "",
        bookingType: bookingType === "private" ? "Privat" : "Felles",
        totalPrice: finalPrice,
        bookingId,
      });
    }

    // Clear pending
    setPendingBookingId(null);
    setPaymentDeadline(null);
    localStorage.removeItem("danholmen_pending_booking_id");
    localStorage.removeItem("danholmen_payment_deadline");

    setBookingRef(bookingId);
    setIsBooked(true);
    showToast("Booking bekreftet! En e-postbekreftelse er sendt.", "success");
  };

  // ------------------------------------------------------------------
  // Validation per step
  // ------------------------------------------------------------------
  const canProceed = () => {
    switch (step) {
      case 1:
        return !!bookingType;
      case 2:
        return !!selectedDate && !!selectedTime;
      case 3:
        return (
          customerName.trim().length >= 2 &&
          customerEmail.includes("@") &&
          customerEmail.includes(".") &&
          customerPhone.length >= 8
        );
      case 4:
        return termsAccepted;
      default:
        return false;
    }
  };

  // ------------------------------------------------------------------
  // Not found
  // ------------------------------------------------------------------
  if (!sauna) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-off-white">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
              Badstue ikke funnet
            </h1>
            <p className="text-text-secondary mb-4">
              Badstuen du leter etter eksisterer ikke.
            </p>
            <button
              onClick={() => (window.location.href = "#/book")}
              className="btn-primary"
            >
              Se alle badstuer
            </button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Success screen
  // ------------------------------------------------------------------
  if (isBooked) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-off-white">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-6 sm:p-8 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-success" />
            </motion.div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-2">
              Booking bekreftet!
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              Din booking er registrert. En bekreftelse er sendt til{" "}
              {customerEmail}.
            </p>
            <div className="bg-off-white rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Referanse</span>
                <span className="font-mono text-text-primary">{bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Badstue</span>
                <span className="text-text-primary">{sauna.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Dato</span>
                <span className="text-text-primary">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tid</span>
                <span className="text-text-primary">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Type</span>
                <span className="text-text-primary">
                  {bookingType === "private" ? "Privat" : "Felles"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#DDD6CC]">
                <span className="text-text-muted">Total</span>
                <span className="font-semibold text-text-primary">
                  {finalPrice} kr
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetWizard}
                className="btn-secondary h-12 w-full flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Book en til
              </button>
              <button
                onClick={() => (window.location.href = "#/book")}
                className="btn-primary h-12 w-full"
              >
                Tilbake til oversikt
              </button>
            </div>
          </motion.div>
        </div>
        <PublicFooter />
      </div>
    );
  }


  // ------------------------------------------------------------------
  // Main render
  // ------------------------------------------------------------------
  return (
    <div className="min-h-[100dvh] flex flex-col bg-off-white">
      <PublicHeader />

      {/* Sauna hero */}
      <section className="relative h-44 sm:h-56 md:h-72 overflow-hidden">
        <img
          src={sauna.image}
          alt={sauna.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-teal/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => (window.location.href = "#/book")}
              className="flex items-center gap-1 text-white/80 text-sm mb-2 sm:mb-3 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Tilbake til oversikt</span>
              <span className="sm:hidden">Tilbake</span>
            </button>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {sauna.name}
            </h1>
            <div className="flex items-center gap-1.5 text-white/70 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{sauna.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Booking content */}
      <section className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-6 sm:py-8 w-full">
        {/* Payment simulation banner (shown when Stripe not configured) */}
        <PaymentSimulationBanner />

        {/* Payment expired message */}
        {paymentExpired && (
          <div className="bg-sauna-red/10 border border-sauna-red/20 rounded-xl px-4 py-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-sauna-red mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-sauna-red">
                  Reservasjonen er utløpt
                </p>
                <p className="text-xs text-sauna-red/80 mt-0.5">
                  Du brukte for lang tid. Velg tidspunktet på nytt og prøv igjen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Countdown timer (shown during payment) */}
        {pendingBookingId && paymentDeadline && !paymentExpired && (
          <div className="mb-4">
            <PaymentCountdown
              deadline={paymentDeadline}
              onExpire={handlePaymentExpired}
            />
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {getSteps(saunaSupportsBoth).map((s, idx) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              const isLast = idx === getSteps(saunaSupportsBoth).length - 1;

              return (
                <div key={s.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    {/* Circle */}
                    <div
                      className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
                        text-sm sm:text-base font-bold transition-all duration-200
                        ${isCompleted
                          ? "bg-success text-white"
                          : isActive
                            ? "bg-deep-teal text-white shadow-teal"
                            : "bg-cream text-text-muted border border-[#DDD6CC]"
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        s.num
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`
                        hidden sm:block text-[11px] font-medium transition-colors
                        ${isActive || isCompleted ? "text-text-primary" : "text-text-muted"}
                      `}
                    >
                      {s.label}
                    </span>
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-1 sm:mx-2 mt-[-18px] sm:mt-[-22px]
                        transition-colors duration-200
                        ${isCompleted ? "bg-success" : "bg-[#DDD6CC]"}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main wizard content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <AnimatePresence mode="wait">
              {/* ================================================================
                  STEP 1: Booking Type (only when sauna supports both modes)
              ================================================================= */}
              {step === 1 && saunaSupportsBoth && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6"
                >
                  <h2 className="font-display text-lg sm:text-xl font-bold text-text-primary mb-2">
                    Velg bookingtype
                  </h2>
                  <p className="text-sm text-text-muted mb-6">
                    Velg om du vil booke privat for gruppen din, eller delta på
                    fellesbadstue.
                  </p>

                  {/* Member benefits banner */}
                  <div className="mb-6 p-4 rounded-xl bg-[#FFF0F4] border border-[#EE4C84]/20">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#EE4C84] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-deep-teal mb-1">
                          Medlem? Få opptil 40% rabatt!
                        </p>
                        <p className="text-xs text-text-secondary">
                          Danholmen Medlem gir deg ubegrenset fellesbadstue, 40% rabatt på privatleie, og prioritert booking — kun 349 kr/mnd.{" "}
                          <button
                            onClick={() => navigate("/medlemskap")}
                            className="text-[#EE4C84] font-medium underline"
                          >
                            Bli medlem →
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Private option */}
                    <button
                      onClick={() => setBookingType("private")}
                      className={`
                        relative p-5 sm:p-6 rounded-xl border-2 text-left transition-all duration-200
                        ${bookingType === "private"
                          ? "border-deep-teal bg-deep-teal/5 shadow-teal"
                          : "border-[#DDD6CC] hover:border-teal-light/40 hover:bg-cream/50"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            bookingType === "private" ? "bg-deep-teal" : "bg-cream"
                          }`}
                        >
                          <Lock
                            className={`w-5 h-5 ${
                              bookingType === "private" ? "text-white" : "text-text-secondary"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-heading text-base font-semibold text-text-primary">
                            Privat booking
                          </h3>
                          <p className="text-xs text-text-muted">
                            {sauna.privatePrice} kr, opptil {sauna.capacity}{" "}
                            personer, 2 timer
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                        Book badstuen kun for din gruppe. Plass til opptil{" "}
                        {sauna.capacity} personer. Perfekt for vennegjenger,
                        familie eller bedrifter.
                      </p>
                      {bookingType === "private" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-deep-teal flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>

                    {/* Felles option */}
                    <button
                      onClick={() => setBookingType("felles")}
                      className={`
                        relative p-5 sm:p-6 rounded-xl border-2 text-left transition-all duration-200
                        ${bookingType === "felles"
                          ? "border-deep-teal bg-deep-teal/5 shadow-teal"
                          : "border-[#DDD6CC] hover:border-teal-light/40 hover:bg-cream/50"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            bookingType === "felles" ? "bg-deep-teal" : "bg-cream"
                          }`}
                        >
                          <Users
                            className={`w-5 h-5 ${
                              bookingType === "felles" ? "text-white" : "text-text-secondary"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-heading text-base font-semibold text-text-primary">
                            Felles badstue
                          </h3>
                          <p className="text-xs text-text-muted">
                            {sauna.fellesPrice} kr/person, del med andre
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                        Bli med på fellesbadstue og møt nye mennesker. En
                        sosial og avslappende opplevelse for alle.
                      </p>
                      {bookingType === "felles" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-deep-teal flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Membership badge */}
                  {sauna.offersMembership && (
                    <div className="mt-5 flex items-center gap-2 bg-vel-member/10 rounded-xl p-3">
                      <Shield className="w-4 h-4 text-vel-member" />
                      <p className="text-xs text-text-secondary">
                        Medlemskap tilgjengelig for denne badstuen. Logg inn for
                        rabatter.
                      </p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleNext}
                      disabled={!bookingType}
                      className={`btn-primary h-12 px-8 ${
                        !bookingType ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Neste
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ================================================================
                  STEP 2: Date & Time
              ================================================================= */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Calendar */}
                  <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-text-primary mb-1">
                      Velg dato
                    </h2>
                    <p className="text-sm text-text-muted mb-4">
                      Klikk på en dato for å se tilgjengelige tider.
                    </p>
                    <WizardCalendar
                      currentMonth={currentMonth}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      onChangeMonth={(offset) => {
                        const d = new Date(currentMonth);
                        d.setMonth(d.getMonth() + offset);
                        setCurrentMonth(d);
                      }}
                      dateAvailability={dateAvailability}
                    />
                  </div>

                  {/* Time slots */}
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6"
                    >
                      <h2 className="font-display text-lg sm:text-xl font-bold text-text-primary mb-1">
                        Velg tid
                      </h2>
                      <p className="text-sm text-text-muted mb-2">
                        {bookingType === "private"
                          ? "Velg en ledig tidsluke for privat booking."
                          : "Velg en ledig tidsluke for fellesbadstue."}{" "}
                        Økten varer 2 timer.
                      </p>
                      {/* Booking type info */}
                      <div className={`mb-4 px-3 py-2 rounded-lg text-xs ${
                        bookingType === "private"
                          ? "bg-brand-pink/10 text-brand-pink"
                          : "bg-teal/10 text-teal"
                      }`}>
                        {bookingType === "private"
                          ? "Privat booking: Hele tiden reserveres for din gruppe."
                          : "Felles booking: Andre kan booke til kapasiteten er full."}
                      </div>
                      <TimeSlotGrid
                        slots={timeSlots}
                        selectedTime={selectedTime}
                        onSelectTime={setSelectedTime}
                        bookingType={bookingType ?? "private"}
                      />
                    </motion.div>
                  )}

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePrev}
                      className="btn-ghost h-12 w-full sm:w-auto sm:px-8 order-2 sm:order-1"
                    >
                      Forrige
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className={`btn-primary h-12 w-full sm:w-auto sm:ml-auto sm:px-8 order-1 sm:order-2 ${
                        !canProceed() ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Neste
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ================================================================
                  STEP 3: Customer Details
              ================================================================= */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6"
                >
                  <h2 className="font-display text-lg sm:text-xl font-bold text-text-primary mb-1">
                    Dine opplysninger
                  </h2>
                  <p className="text-sm text-text-muted mb-5">
                    Fyll inn dine kontaktopplysninger for bookingen.
                  </p>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Navn <span className="text-sauna-red">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ditt fulle navn"
                        className="form-input w-full"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        E-post <span className="text-sauna-red">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="din@epost.no"
                        className="form-input w-full"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        Telefon <span className="text-sauna-red">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+47 000 00 000"
                        className="form-input w-full"
                      />
                    </div>

                    {/* Participants */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Antall personer <span className="text-sauna-red">*</span>
                      </label>
                      {bookingType === "felles" ? (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center text-lg font-bold text-text-primary">
                            1
                          </div>
                          <p className="text-sm text-text-secondary">
                            Fellesbadstue er for 1 person. Andre melder seg på
                            separat.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() =>
                                setParticipantCount((c) => Math.max(1, c - 1))
                              }
                              className="w-12 h-12 rounded-xl bg-cream text-text-primary flex items-center justify-center hover:bg-[#DDD6CC] transition-colors active:scale-95 touch-min"
                              aria-label="Minsk antall"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="text-xl font-bold text-text-primary w-8 text-center">
                              {participantCount}
                            </span>
                            <button
                              onClick={() =>
                                setParticipantCount((c) =>
                                  Math.min(sauna.capacity, c + 1)
                                )
                              }
                              className="w-12 h-12 rounded-xl bg-cream text-text-primary flex items-center justify-center hover:bg-[#DDD6CC] transition-colors active:scale-95 touch-min"
                              aria-label="Øk antall"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-xs text-text-muted mt-1">
                            Maks {sauna.capacity} personer
                          </p>
                        </>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="form-label flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Notater (valgfritt)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Eventuelle merknader..."
                        rows={3}
                        className="form-input w-full resize-none"
                      />
                    </div>

                    {/* Remember me */}
                    <label className="flex items-start gap-3 cursor-pointer pt-2">
                      <div className="relative flex items-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 border-[#DDD6CC] flex items-center justify-center
                            transition-all duration-150 shrink-0
                            peer-checked:bg-teal peer-checked:border-teal"
                        >
                          <Save className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-text-primary font-medium">
                          Husk meg til neste gang
                        </span>
                        <p className="text-xs text-text-muted">
                          Navn, e-post og telefon lagres i denne nettleseren
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Member login section */}
                  <div className="mt-6 pt-5 border-t border-[#DDD6CC]">
                    {!loggedInMember ? (
                      <div>
                        <div className="p-4 rounded-xl bg-[#F0F7F7] border border-teal/20 mb-4">
                          <p className="text-sm font-medium text-deep-teal mb-1">
                            Medlem?
                          </p>
                          <p className="text-sm text-text-secondary mb-3">
                            Logg inn på Min side for å få medlemsrabatt automatisk på denne bookingen.
                          </p>
                          <button
                            onClick={() => window.location.href = "#/min-side"}
                            className="text-sm font-medium text-teal hover:text-deep-teal transition-colors flex items-center gap-1"
                          >
                            <LogIn className="w-4 h-4" />
                            Logg inn som medlem
                          </button>
                        </div>

                        <button
                          onClick={() => setShowLogin((s) => !s)}
                          className="flex items-center gap-2 text-teal text-sm font-medium hover:underline"
                        >
                          <LogIn className="w-4 h-4" />
                          {showLogin
                            ? "Skjul innlogging"
                            : "Alternativt: Logg inn her"}
                        </button>

                        {showLogin && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-3 space-y-3 bg-off-white rounded-xl p-4"
                          >
                            <div>
                              <label className="form-label">E-post</label>
                              <input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="medlem@epost.no"
                                className="form-input w-full h-12"
                              />
                            </div>
                            <div>
                              <label className="form-label">Passord</label>
                              <input
                                type="password"
                                value={loginPassword}
                                onChange={(e) =>
                                  setLoginPassword(e.target.value)
                                }
                                placeholder="Passord"
                                className="form-input w-full h-12"
                              />
                            </div>
                            {loginError && (
                              <p className="text-xs text-sauna-red">
                                {loginError}
                              </p>
                            )}
                            <button
                              onClick={handleLogin}
                              className="w-full h-12 bg-deep-teal text-white font-medium rounded-xl hover:bg-teal transition-colors"
                            >
                              Logg inn
                            </button>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <p className="text-sm font-medium text-success">
                            Medlem logget inn
                          </p>
                        </div>
                        <p className="text-sm text-text-secondary">
                          {loggedInMember.firstName} {loggedInMember.lastName} —{" "}
                          {Math.round(memberDiscountRate * 100)}% rabatt gjelder automatisk
                        </p>
                        {loggedInMember.tier && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-deep-teal text-white">
                            {loggedInMember.tier}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setLoggedInMember(null);
                          }}
                          className="block mt-3 text-xs text-text-muted hover:text-sauna-red transition-colors"
                        >
                          Logg ut
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Discount code */}
                  {!isVelMember && (
                    <div className="mt-5 pt-5 border-t border-[#DDD6CC]">
                      <label className="form-label flex items-center gap-1.5 mb-2">
                        <Tag className="w-3.5 h-3.5" />
                        Rabattkode
                      </label>
                      <div className="flex gap-2 items-stretch">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => {
                            setDiscountCode(e.target.value);
                            setDiscountError("");
                          }}
                          placeholder="Skriv inn rabattkode"
                          className="form-input flex-1 min-h-[44px] text-base px-4"
                        />
                        <button
                          onClick={handleApplyDiscount}
                          className="btn-secondary px-5 shrink-0 min-h-[44px] text-sm font-medium"
                        >
                          Bruk
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-xs text-sauna-red mt-2">
                          {discountError}
                        </p>
                      )}
                      {discountApplied > 0 && (
                        <p className="text-xs text-success mt-2">
                          Rabattkode aktivert: -{discountApplied} kr
                        </p>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={handlePrev}
                      className="btn-ghost h-12 w-full sm:w-auto sm:px-8 order-2 sm:order-1"
                    >
                      Forrige
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className={`btn-primary h-12 w-full sm:w-auto sm:ml-auto sm:px-8 order-1 sm:order-2 ${
                        !canProceed() ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Neste
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ================================================================
                  STEP 4: Summary & Payment
              ================================================================= */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Summary card */}
                  <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6">
                    <h2 className="font-display text-lg sm:text-xl font-bold text-text-primary mb-4">
                      Oppsummering
                    </h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-text-muted shrink-0">Badstue</span>
                        <span className="text-text-primary text-right break-anywhere">
                          {sauna.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Type</span>
                        <span className="text-text-primary">
                          {bookingType === "private" ? "Privat" : "Felles"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Dato</span>
                        <span className="text-text-primary">
                          {selectedDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Tid</span>
                        <span className="text-text-primary">
                          {selectedTime} (
                          {parseInt(selectedTime?.split(":")[0] ?? "0") + 2}
                          :00)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Deltakere</span>
                        <span className="text-text-primary">
                          {bookingType === "private"
                            ? `${participantCount} personer`
                            : "1 person"}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-text-muted shrink-0">Navn</span>
                        <span className="text-text-primary text-right">
                          {customerName}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-text-muted shrink-0">E-post</span>
                        <span className="text-text-primary text-right break-all">
                          {customerEmail}
                        </span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-text-muted shrink-0">Telefon</span>
                        <span className="text-text-primary text-right">
                          {customerPhone}
                        </span>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="mt-5 pt-4 border-t border-[#DDD6CC] space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Grunnpris</span>
                        <span className="text-text-primary">{basePrice} kr</span>
                      </div>
                      {memberDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-success">
                            Medlemsrabatt ({Math.round(memberDiscountRate * 100)}%)
                          </span>
                          <span className="text-success">
                            -{memberDiscountAmount} kr
                          </span>
                        </div>
                      )}
                      {isVelMember && bookingType === "felles" && (
                        <div className="flex justify-between text-sm">
                          <span className="text-success">VEL-medlem</span>
                          <span className="text-success">Gratis</span>
                        </div>
                      )}
                      {discountApplied > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-success">Rabattkode</span>
                          <span className="text-success">
                            -{discountApplied} kr
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold pt-2 border-t border-[#DDD6CC]">
                        <span className="text-text-primary">Totalt</span>
                        <span className="text-deep-teal">{finalPrice} kr</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex items-center mt-0.5">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            transition-all duration-150 shrink-0
                            ${termsAccepted
                              ? "bg-deep-teal border-deep-teal"
                              : "border-[#DDD6CC] bg-white peer-focus:ring-2 peer-focus:ring-teal/30"
                            }
                          `}
                        >
                          {termsAccepted && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-text-secondary leading-relaxed">
                        Jeg godtar{" "}
                        <button
                          type="button"
                          onClick={() => setVilkarModalOpen(true)}
                          className="text-[#2A6B6B] underline font-medium"
                        >
                          vilkårene
                        </button>{" "}
                        og personvernerklæringen
                      </span>
                    </label>
                  </div>

                  {/* Terms modal */}
                  {vilkarModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                      {/* Backdrop */}
                      <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setVilkarModalOpen(false)}
                      />
                      {/* Modal content */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display text-lg font-bold text-deep-teal">
                            Vilkår for booking
                          </h3>
                          <button
                            onClick={() => setVilkarModalOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-cream transition-colors"
                          >
                            <X className="w-5 h-5 text-text-secondary" />
                          </button>
                        </div>
                        <div className="space-y-4 text-sm text-text-secondary">
                          <div>
                            <h4 className="font-semibold text-text-primary mb-1">1. Avbestilling</h4>
                            <p>Avbestilling må skje minst 24 timer før bookingtidspunktet for full refusjon. Ved avbestilling under 24 timer refunderes ikke beløpet.</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary mb-1">2. Bruk av badstue</h4>
                            <p>Badstuen må forlates i samme stand som ved ankomst. Ta med eget håndkle og tørr ved. All bruk skjer på eget ansvar.</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary mb-1">3. Forbud</h4>
                            <p>Medbrakt alkohol og røyking er ikke tillatt i badstueområdet. Overholdelse av reglene er påkrevd.</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary mb-1">4. Aldersgrense</h4>
                            <p>Barn under 16 år må være i følge med ansvarlig voksen. Alle brukere må kunne svømme.</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary mb-1">5. Ansvar</h4>
                            <p>Danholmen Badstuer er ikke ansvarlig for personlige eiendeler eller skader som oppstår under bruk av fasilitetene.</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary mb-1">6. Personvern</h4>
                            <p>Dine personopplysninger behandles i henhold til norsk personvernlovgivning (GDPR). Vi deler ikke dine opplysninger med tredjeparter uten ditt samtykke.</p>
                          </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-[#DDD6CC] flex gap-3">
                          <button
                            onClick={() => {
                              setTermsAccepted(true);
                              setVilkarModalOpen(false);
                            }}
                            className="btn-primary flex-1 h-11"
                          >
                            Godta vilkårene
                          </button>
                          <button
                            onClick={() => setVilkarModalOpen(false)}
                            className="btn-ghost h-11 px-4"
                          >
                            Lukk
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Payment button */}
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing || !termsAccepted}
                    className={`
                      w-full h-14 rounded-xl font-semibold text-white text-base
                      flex items-center justify-center gap-2
                      transition-all duration-200
                      ${isProcessing || !termsAccepted
                        ? "bg-text-muted cursor-not-allowed"
                        : "bg-stripe-blue hover:brightness-110 active:scale-[0.98]"
                      }
                    `}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Behandler...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        {finalPrice > 0
                          ? `Betal ${finalPrice} kr${isStripeConfigured() ? " med Stripe" : " (simulert)"}`
                          : "Fullfør booking gratis"}
                      </>
                    )}
                  </button>

                  {/* Payment mode indicator */}
                  <div className="text-center">
                    <p className="text-[11px] text-text-muted">
                      {isStripeConfigured()
                        ? "Sikker betaling via Stripe Checkout"
                        : "Simulert betaling — Konfigurer Stripe i stripeConfig.ts for ekte betaling"}
                    </p>
                  </div>

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePrev}
                      className="btn-ghost h-12 w-full sm:w-auto sm:px-8 order-2 sm:order-1"
                    >
                      Forrige
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ================================================================
              SIDEBAR — Sauna info, pricing, current selection
          ================================================================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Sauna info */}
            <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6">
              <h3 className="font-heading text-base font-semibold text-text-primary mb-3">
                Om badstuen
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {sauna.description}
              </p>
              <div className="space-y-2 text-xs sm:text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{sauna.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Opptil {sauna.capacity} personer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{sauna.sessionLength / 60} timer per økt</span>
                </div>
              </div>
              {sauna.offersMembership && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-vel-member/10 rounded-lg">
                  <Shield className="w-3.5 h-3.5 text-vel-member" />
                  <span className="text-xs text-text-secondary">
                    Medlemskap tilgjengelig
                  </span>
                </div>
              )}
            </div>

            {/* Price info */}
            <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6">
              <h3 className="font-heading text-base font-semibold text-text-primary mb-3">
                Prisoversikt
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Privat booking</span>
                  <span className="font-medium text-text-primary">
                    {sauna.privatePrice} kr (opptil {sauna.capacity} pers)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    Felles (per person)
                  </span>
                  <span className="font-medium text-text-primary">
                    {sauna.fellesPrice} kr
                  </span>
                </div>
              </div>
            </div>

            {/* Current selection summary (visible on steps 2-4) */}
            {step >= 2 && (selectedDate || selectedTime) && (
              <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 sm:p-6">
                <h3 className="font-heading text-base font-semibold text-text-primary mb-3">
                  Ditt valg
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Type</span>
                    <span className="font-medium text-text-primary">
                      {bookingType === "private" ? "Privat" : "Felles"}
                    </span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Dato</span>
                      <span className="font-medium text-text-primary">
                        {selectedDate}
                      </span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Tid</span>
                      <span className="font-medium text-text-primary">
                        {selectedTime}
                      </span>
                    </div>
                  )}
                  {step >= 3 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Deltakere</span>
                        <span className="font-medium text-text-primary">
                          {bookingType === "private" ? participantCount : 1}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#DDD6CC] flex justify-between">
                        <span className="text-text-muted">Estimert pris</span>
                        <span className="font-bold text-deep-teal">
                          {finalPrice} kr
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
