import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSaunas, getBookings, saveBooking } from "@/data/store";
import type { Sauna, Booking } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Calendar,
  Clock,
  Check,
  CreditCard,
  Info,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { STRIPE_PUBLISHABLE_KEY, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL } from "@/data/stripeConfig";
import { loadStripe } from "@stripe/stripe-js";

const TIME_SLOTS = [
  "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"
];

export default function SingleSaunaBooking() {
  const { saunaSlug } = useParams<{ saunaSlug: string }>();
  const navigate = useNavigate();
  const [sauna, setSauna] = useState<Sauna | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [step, setStep] = useState(1);

  const [bookingType, setBookingType] = useState<"private" | "shared">("private");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [participants, setParticipants] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const saunas = getSaunas();
    const found = saunas.find((s) => s.slug === saunaSlug);
    if (found) {
      setSauna(found);
      // Auto-select type if only one mode available
      if (found.bookingModes.length === 1) {
        setBookingType(found.bookingModes[0]);
        setStep(2);
      }
    }
    setBookings(getBookings());
  }, [saunaSlug]);

  if (!sauna) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Badstue ikke funnet</p>
      </div>
    );
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const isSlotAvailable = (date: string, time: string, type: "private" | "shared") => {
    const slotBookings = bookings.filter(
      (b) =>
        b.saunaId === sauna.id &&
        b.date === date &&
        b.startTime === time &&
        b.status !== "cancelled"
    );
    const hasPrivate = slotBookings.some((b) => b.type === "private");
    if (hasPrivate) return false;
    if (type === "private") return slotBookings.length === 0;
    const sharedCount = slotBookings
      .filter((b) => b.type === "shared")
      .reduce((sum, b) => sum + b.participants, 0);
    return sharedCount < sauna.maxCapacity;
  };

  const getSlotStatus = (date: string, time: string) => {
    const slotBookings = bookings.filter(
      (b) =>
        b.saunaId === sauna.id &&
        b.date === date &&
        b.startTime === time &&
        b.status !== "cancelled"
    );
    const hasPrivate = slotBookings.some((b) => b.type === "private");
    if (hasPrivate) return { status: "blocked", label: "Opptatt", count: 0, max: 0 };
    const sharedCount = slotBookings
      .filter((b) => b.type === "shared")
      .reduce((sum, b) => sum + b.participants, 0);
    return {
      status: sharedCount >= sauna.maxCapacity ? "full" : "available",
      label: sharedCount >= sauna.maxCapacity ? "Fullt" : `${sharedCount}/${sauna.maxCapacity}`,
      count: sharedCount,
      max: sauna.maxCapacity,
    };
  };

  const calculatePrice = () => {
    if (!sauna) return 0;
    let price = bookingType === "private" ? sauna.pricePerHour : sauna.sharedPrice * participants;
    // Apply discount code (mock - would check against stored codes)
    if (discountCode) {
      price = price * 0.9; // 10% mock discount
    }
    return Math.round(price);
  };

  const totalPrice = calculatePrice();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (!selectedDate || !selectedTime || !customerName || !customerEmail) {
      setError("Vennligst fyll ut alle obligatoriske felter");
      setLoading(false);
      return;
    }

    const startIdx = TIME_SLOTS.indexOf(selectedTime);
    const endTime = startIdx >= 0 && startIdx < TIME_SLOTS.length - 1 ? TIME_SLOTS[startIdx + 1] : "22:00";

    const booking: Booking = {
      id: `booking-${Date.now()}`,
      saunaId: sauna.id,
      type: bookingType,
      date: selectedDate,
      startTime: selectedTime,
      endTime,
      customerName,
      customerEmail,
      customerPhone,
      participants,
      totalPrice,
      discountAmount: 0,
      memberDiscount: 0,
      paymentStatus: "awaiting_payment",
      status: "awaiting_payment",
      paymentDeadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      isInternal: false,
      notes,
      createdAt: new Date().toISOString(),
    };

    saveBooking(booking);

    // Simulate Stripe redirect or go to confirmation
    // In production, this would redirect to Stripe Checkout
    if (STRIPE_PUBLISHABLE_KEY !== "pk_test_YOUR_KEY_HERE") {
      try {
        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          // Mock checkout session creation
          setTimeout(() => {
            booking.paymentStatus = "paid";
            booking.status = "confirmed";
            saveBooking(booking);
            navigate("/booking-confirmed");
          }, 1500);
          return;
        }
      } catch {
        // Fall through to simulated payment
      }
    }

    // Simulated payment for demo
    setTimeout(() => {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      saveBooking(booking);
      navigate("/booking-confirmed");
    }, 1500);
  };

  const stepLabels = ["Type", "Dato", "Tid", "Info"];
  const actualSteps = sauna.bookingModes.length === 1 ? ["Dato", "Tid", "Info"] : stepLabels;
  const actualStep = sauna.bookingModes.length === 1 ? step - 1 : step;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">{sauna.name}</h1>
        <p className="text-sm text-gray-500">{sauna.location}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2">
        {actualSteps.map((label, i) => {
          const stepNum = sauna.bookingModes.length === 1 ? i + 2 : i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  isActive && "bg-primary text-white",
                  isDone && "bg-green-500 text-white",
                  !isActive && !isDone && "bg-gray-200 text-gray-500"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs hidden sm:inline",
                  isActive && "font-medium text-primary",
                  isDone && "text-green-600",
                  !isActive && !isDone && "text-gray-400"
                )}
              >
                {label}
              </span>
              {i < actualSteps.length - 1 && (
                <div className="w-6 h-px bg-gray-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Type */}
      {step === 1 && sauna.bookingModes.length > 1 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Velg bookingtype</h2>
            <div className="grid grid-cols-2 gap-3">
              {sauna.bookingModes.includes("private") && (
                <button
                  onClick={() => {
                    setBookingType("private");
                    setStep(2);
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 text-center space-y-2 transition-colors",
                    bookingType === "private"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <User className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold">Privat</p>
                  <p className="text-sm text-gray-500">{sauna.pricePerHour} kr/t</p>
                  <p className="text-xs text-gray-400">Hele badstuen for deg</p>
                </button>
              )}
              {sauna.bookingModes.includes("shared") && (
                <button
                  onClick={() => {
                    setBookingType("shared");
                    setStep(2);
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 text-center space-y-2 transition-colors",
                    bookingType === "shared"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Users className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold">Felles</p>
                  <p className="text-sm text-gray-500">{sauna.sharedPrice} kr/pers</p>
                  <p className="text-xs text-gray-400">Deler med andre</p>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date */}
      {step === 2 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Velg dato
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: nb })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isSelected = selectedDate === dateStr;
                const isPast = isBefore(day, startOfDay(new Date()));
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isPast && setSelectedDate(dateStr)}
                    disabled={isPast}
                    className={cn(
                      "min-h-[44px] p-1 rounded-md text-sm transition-colors",
                      isSelected && "bg-primary text-white",
                      !isSelected && isToday(day) && "bg-orange-50 text-orange-600 border border-orange-200",
                      !isSelected && !isToday(day) && !isPast && "hover:bg-gray-100",
                      isPast && "text-gray-300 cursor-not-allowed"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <div className="flex justify-end">
                <Button onClick={() => setStep(3)}>Neste: Velg tid</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Time */}
      {step === 3 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Velg tid — {format(new Date(selectedDate), "EEEE d. MMMM", { locale: nb })}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map((time) => {
                const available = isSlotAvailable(selectedDate, time, bookingType);
                const slotStatus = getSlotStatus(selectedDate, time);
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => available && setSelectedTime(time)}
                    disabled={!available}
                    className={cn(
                      "p-3 rounded-lg border text-center transition-colors",
                      isSelected && "border-primary bg-primary/5 ring-2 ring-primary",
                      !isSelected && available && "border-gray-200 hover:border-gray-300 bg-white",
                      !available && "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    <p className="font-medium">{time}</p>
                    <p className="text-xs">
                      {available
                        ? bookingType === "shared"
                          ? slotStatus.label
                          : "Ledig"
                        : slotStatus.label}
                    </p>
                  </button>
                );
              })}
            </div>
            {selectedTime && (
              <div className="flex justify-end">
                <Button onClick={() => setStep(4)}>Neste: Dine opplysninger</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Customer Info */}
      {step === 4 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Dine opplysninger</h2>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <p><strong>{sauna.name}</strong></p>
              <p>{format(new Date(selectedDate), "EEEE d. MMMM yyyy", { locale: nb })}</p>
              <p>{selectedTime} — {(() => {
                const idx = TIME_SLOTS.indexOf(selectedTime);
                return idx >= 0 && idx < TIME_SLOTS.length - 1 ? TIME_SLOTS[idx + 1] : "22:00";
              })()}</p>
              <p className="capitalize">{bookingType === "private" ? "Privat booking" : "Felles booking"}</p>
              {bookingType === "shared" && <p>{participants} deltaker{participants > 1 ? "e" : ""}</p>}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ditt fulle navn"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-post *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+47 000 00 000"
                />
              </div>
              {bookingType === "shared" && (
                <div className="space-y-1.5">
                  <Label htmlFor="participants">Antall deltakere</Label>
                  <Input
                    id="participants"
                    type="number"
                    min={1}
                    max={sauna.maxCapacity}
                    value={participants}
                    onChange={(e) => setParticipants(Math.min(sauna.maxCapacity, Math.max(1, parseInt(e.target.value) || 1)))}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="discount">Rabattkode</Label>
                <Input
                  id="discount"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Valgfritt"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notater</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Eventuelle spesielle ønsker"
                />
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Totalt</span>
                <span>{totalPrice} kr</span>
              </div>
              {discountCode && (
                <p className="text-sm text-green-600">Rabattkode aktivert (-10%)</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                <Info className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(3)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Tilbake
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  "Behandler..."
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Betal {totalPrice} kr
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
