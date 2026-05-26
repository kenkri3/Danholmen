import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSaunas, getBookings, saveBooking } from "@/data/store";
import type { Sauna, Booking } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ChevronLeft, Clock, Calendar, User, Users, CreditCard, Info } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TIME_SLOTS = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

export default function BookingWidget() {
  const [searchParams] = useSearchParams();
  const saunaParam = searchParams.get("sauna");
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedSauna, setSelectedSauna] = useState<string>("");
  const [step, setStep] = useState(1);
  const [bookingType, setBookingType] = useState<"private" | "shared">("private");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [participants, setParticipants] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const allSaunas = getSaunas();
    setSaunas(allSaunas);
    setBookings(getBookings());
    if (saunaParam) {
      const found = allSaunas.find((s) => s.slug === saunaParam);
      if (found) {
        setSelectedSauna(found.id);
        if (found.bookingModes.length === 1) {
          setBookingType(found.bookingModes[0]);
          setStep(2);
        }
      }
    }
  }, [saunaParam]);

  const sauna = saunas.find((s) => s.id === selectedSauna);

  const isSlotAvailable = (date: string, time: string, type: "private" | "shared") => {
    if (!sauna) return false;
    const slotBookings = bookings.filter(
      (b) => b.saunaId === sauna.id && b.date === date && b.startTime === time && b.status !== "cancelled"
    );
    const hasPrivate = slotBookings.some((b) => b.type === "private");
    if (hasPrivate) return false;
    if (type === "private") return slotBookings.length === 0;
    const sharedCount = slotBookings.filter((b) => b.type === "shared").reduce((sum, b) => sum + b.participants, 0);
    return sharedCount < sauna.maxCapacity;
  };

  const handleSubmit = () => {
    if (!sauna || !selectedDate || !selectedTime || !customerName || !customerEmail) {
      setError("Fyll ut alle felter");
      return;
    }
    setLoading(true);
    const startIdx = TIME_SLOTS.indexOf(selectedTime);
    const endTime = startIdx >= 0 && startIdx < TIME_SLOTS.length - 1 ? TIME_SLOTS[startIdx + 1] : "22:00";
    const totalPrice = bookingType === "private" ? sauna.pricePerHour : sauna.sharedPrice * participants;
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
      paymentStatus: "paid",
      status: "confirmed",
      isInternal: false,
      notes: "",
      createdAt: new Date().toISOString(),
    };
    saveBooking(booking);
    setStep(5);
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto p-3 space-y-3 bg-white min-h-screen">
      {/* Sauna selector (if no sauna param) */}
      {step === 1 && !saunaParam && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Velg badstue</h2>
          <div className="space-y-2">
            {saunas.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSauna(s.id);
                  if (s.bookingModes.length === 1) {
                    setBookingType(s.bookingModes[0]);
                    setStep(2);
                  }
                }}
                className="w-full p-3 rounded-lg border text-left hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-gray-500">{s.location}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type selector */}
      {step === 1 && sauna && sauna.bookingModes.length > 1 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">{sauna.name} — Velg type</h2>
          <div className="grid grid-cols-2 gap-2">
            {sauna.bookingModes.includes("private") && (
              <button
                onClick={() => { setBookingType("private"); setStep(2); }}
                className="p-3 rounded-lg border text-center hover:bg-gray-50"
              >
                <User className="h-5 w-5 mx-auto mb-1" />
                <p className="text-sm font-medium">Privat</p>
                <p className="text-xs text-gray-500">{sauna.pricePerHour} kr/t</p>
              </button>
            )}
            {sauna.bookingModes.includes("shared") && (
              <button
                onClick={() => { setBookingType("shared"); setStep(2); }}
                className="p-3 rounded-lg border text-center hover:bg-gray-50"
              >
                <Users className="h-5 w-5 mx-auto mb-1" />
                <p className="text-sm font-medium">Felles</p>
                <p className="text-xs text-gray-500">{sauna.sharedPrice} kr/pers</p>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Date */}
      {step === 2 && sauna && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(step > 1 ? step - 1 : step)} className="p-1"><ChevronLeft className="h-4 w-4" /></button>
            <h2 className="font-semibold text-sm">Velg dato</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full h-11 px-3 rounded-md border"
          />
          {selectedDate && <Button size="sm" className="w-full" onClick={() => setStep(3)}>Neste</Button>}
        </div>
      )}

      {/* Time */}
      {step === 3 && sauna && selectedDate && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(2)} className="p-1"><ChevronLeft className="h-4 w-4" /></button>
            <h2 className="font-semibold text-sm">Velg tid</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((time) => {
              const available = isSlotAvailable(selectedDate, time, bookingType);
              const isSelected = selectedTime === time;
              return (
                <button
                  key={time}
                  onClick={() => available && setSelectedTime(time)}
                  disabled={!available}
                  className={cn(
                    "p-2 rounded-md border text-sm text-center transition-colors",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
                    !isSelected && available && "border-gray-200 hover:border-gray-300",
                    !available && "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
          {selectedTime && <Button size="sm" className="w-full" onClick={() => setStep(4)}>Neste</Button>}
        </div>
      )}

      {/* Info */}
      {step === 4 && sauna && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(3)} className="p-1"><ChevronLeft className="h-4 w-4" /></button>
            <h2 className="font-semibold text-sm">Dine opplysninger</h2>
          </div>
          <div className="text-xs bg-gray-50 p-2 rounded-md space-y-0.5">
            <p><strong>{sauna.name}</strong></p>
            <p>{selectedDate} • {selectedTime}</p>
            <p>{bookingType === "private" ? "Privat" : "Felles"}</p>
          </div>
          <div className="space-y-2">
            <div><Label className="text-xs">Navn *</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
            <div><Label className="text-xs">E-post *</Label><Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /></div>
            <div><Label className="text-xs">Telefon</Label><Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
            {bookingType === "shared" && (
              <div><Label className="text-xs">Deltakere</Label><Input type="number" min={1} max={sauna.maxCapacity} value={participants} onChange={(e) => setParticipants(Math.min(sauna.maxCapacity, Math.max(1, parseInt(e.target.value) || 1)))} /></div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm font-bold pt-1">
            <span>Totalt</span>
            <span>{bookingType === "private" ? sauna.pricePerHour : sauna.sharedPrice * participants} kr</span>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}
          <Button size="sm" className="w-full gap-1" onClick={handleSubmit} disabled={loading}>
            <CreditCard className="h-3.5 w-3.5" />{loading ? "Behandler..." : "Bekreft booking"}
          </Button>
        </div>
      )}

      {/* Success */}
      {step === 5 && (
        <div className="text-center space-y-3 py-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="font-bold text-lg">Booking bekreftet!</h2>
          <p className="text-sm text-gray-600">Du vil motta en e-postbekreftelse.</p>
          <Button size="sm" variant="outline" className="w-full" onClick={() => window.location.reload()}>Ny booking</Button>
        </div>
      )}
    </div>
  );
}
