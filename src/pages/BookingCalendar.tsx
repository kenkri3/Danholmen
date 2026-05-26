import { useEffect, useState, useMemo } from "react";
import { getBookings, getSaunas, saveBooking, deleteBooking } from "@/data/store";
import type { Booking, Sauna } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Users,
  Trash2,
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
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"
];

export default function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSauna, setSelectedSauna] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [newBooking, setNewBooking] = useState({
    saunaId: "",
    type: "private" as "private" | "shared",
    date: "",
    startTime: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    participants: 1,
    notes: "",
  });

  useEffect(() => {
    setBookings(getBookings());
    setSaunas(getSaunas());
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredSaunas = selectedSauna === "all" ? saunas : saunas.filter(s => s.id === selectedSauna);

  const getDayBookings = (date: Date) => {
    return bookings.filter(
      (b) =>
        isSameDay(new Date(b.date), date) &&
        (selectedSauna === "all" || b.saunaId === selectedSauna)
    );
  };

  const isSlotBooked = (saunaId: string, date: string, time: string) => {
    return bookings.some(
      (b) =>
        b.saunaId === saunaId &&
        b.date === date &&
        b.startTime === time &&
        b.status !== "cancelled"
    );
  };

  const isSlotBlocked = (saunaId: string, date: string, time: string) => {
    const slotBookings = bookings.filter(
      (b) =>
        b.saunaId === saunaId &&
        b.date === date &&
        b.startTime === time &&
        b.status !== "cancelled"
    );
    return slotBookings.some((b) => b.type === "private");
  };

  const handleAddBooking = () => {
    if (!newBooking.saunaId || !newBooking.date || !newBooking.startTime) return;

    const sauna = saunas.find((s) => s.id === newBooking.saunaId);
    if (!sauna) return;

    const startIdx = TIME_SLOTS.indexOf(newBooking.startTime);
    const endTime = startIdx >= 0 && startIdx < TIME_SLOTS.length - 1 ? TIME_SLOTS[startIdx + 1] : "22:00";

    const booking: Booking = {
      id: `booking-${Date.now()}`,
      saunaId: newBooking.saunaId,
      type: newBooking.type,
      date: newBooking.date,
      startTime: newBooking.startTime,
      endTime,
      customerName: newBooking.customerName || "Intern booking",
      customerEmail: newBooking.customerEmail || "",
      customerPhone: newBooking.customerPhone || "",
      participants: newBooking.participants,
      totalPrice: newBooking.type === "private" ? sauna.pricePerHour : sauna.sharedPrice * newBooking.participants,
      discountAmount: 0,
      memberDiscount: 0,
      paymentStatus: "free",
      status: "confirmed",
      isInternal: true,
      notes: newBooking.notes,
      createdAt: new Date().toISOString(),
    };

    saveBooking(booking);
    setBookings(getBookings());
    setDialogOpen(false);
    setNewBooking({
      saunaId: "",
      type: "private",
      date: "",
      startTime: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      participants: 1,
      notes: "",
    });
  };

  const handleDelete = () => {
    if (bookingToDelete) {
      deleteBooking(bookingToDelete.id);
      setBookings(getBookings());
    }
    setDeleteDialogOpen(false);
    setBookingToDelete(null);
  };

  const dayNames = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bookingkalender</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
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

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedSauna} onValueChange={setSelectedSauna}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Velg badstue" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle badstuer</SelectItem>
            {saunas.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setNewBooking({ ...newBooking, date: format(new Date(), "yyyy-MM-dd") });
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ny intern booking
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayBookings = getDayBookings(day);
              const hasPrivate = dayBookings.some((b) => b.type === "private");
              const hasShared = dayBookings.some((b) => b.type === "shared");
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={cn(
                    "min-h-[60px] sm:min-h-[80px] p-1.5 rounded-md border cursor-pointer transition-colors",
                    !isSameMonth(day, currentMonth) && "bg-gray-50 text-gray-300",
                    isSameMonth(day, currentMonth) && "bg-white hover:bg-gray-50",
                    isToday(day) && "ring-2 ring-primary ring-offset-1",
                    selectedDate && isSameDay(day, selectedDate) && "bg-primary/5 border-primary"
                  )}
                >
                  <div className="text-xs font-medium">{format(day, "d")}</div>
                  {dayBookings.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {hasPrivate && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" title="Privat" />
                      )}
                      {hasShared && (
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Felles" />
                      )}
                      {dayBookings.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{dayBookings.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(selectedDate, "EEEE d. MMMM yyyy", { locale: nb })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSaunas.map((sauna) => (
              <div key={sauna.id} className="mb-4 last:mb-0">
                <h3 className="text-sm font-semibold mb-2">{sauna.name}</h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                  {TIME_SLOTS.map((time) => {
                    const booked = isSlotBooked(sauna.id, format(selectedDate, "yyyy-MM-dd"), time);
                    const blocked = isSlotBlocked(sauna.id, format(selectedDate, "yyyy-MM-dd"), time);
                    const slotBookings = bookings.filter(
                      (b) =>
                        b.saunaId === sauna.id &&
                        b.date === format(selectedDate, "yyyy-MM-dd") &&
                        b.startTime === time &&
                        b.status !== "cancelled"
                    );
                    return (
                      <div
                        key={time}
                        className={cn(
                          "p-1.5 rounded-md text-center text-xs border",
                          blocked
                            ? "bg-red-50 border-red-200 text-red-700"
                            : booked
                            ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                            : "bg-green-50 border-green-200 text-green-700"
                        )}
                      >
                        <div className="font-medium">{time}</div>
                        {slotBookings.length > 0 ? (
                          <div className="mt-0.5 space-y-0.5">
                            {slotBookings.map((b) => (
                              <div
                                key={b.id}
                                className="flex items-center justify-between gap-1"
                              >
                                <span className="truncate max-w-[60px]">
                                  {b.type === "private" ? (
                                    <User className="h-3 w-3 inline" />
                                  ) : (
                                    <Users className="h-3 w-3 inline" />
                                  )}
                                  {" "}{b.customerName?.split(" ")[0] || "—"}
                                </span>
                                <button
                                  onClick={() => {
                                    setBookingToDelete(b);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-green-600 mt-0.5">Ledig</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ny intern booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Badstue</Label>
              <Select
                value={newBooking.saunaId}
                onValueChange={(v) => setNewBooking({ ...newBooking, saunaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg badstue" />
                </SelectTrigger>
                <SelectContent>
                  {saunas.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={newBooking.type}
                onValueChange={(v: "private" | "shared") => setNewBooking({ ...newBooking, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privat</SelectItem>
                  <SelectItem value="shared">Felles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dato</Label>
              <Input
                type="date"
                value={newBooking.date}
                onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tid</Label>
              <Select
                value={newBooking.startTime}
                onValueChange={(v) => setNewBooking({ ...newBooking, startTime: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg tid" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kundenavn</Label>
              <Input
                value={newBooking.customerName}
                onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                placeholder="Navn (valgfritt for intern)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Antall deltakere</Label>
              <Input
                type="number"
                min={1}
                value={newBooking.participants}
                onChange={(e) =>
                  setNewBooking({ ...newBooking, participants: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notater</Label>
              <Input
                value={newBooking.notes}
                onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                placeholder="Eventuelle notater"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddBooking}>Lagre booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Slett booking?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Er du sikker på at du vil slette bookingen for{" "}
            <strong>{bookingToDelete?.customerName}</strong> den{" "}
            {bookingToDelete?.date}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
