import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  ArrowRight,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import { nb } from "date-fns/locale";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { getSaunas, getBookings } from "@/data/store";
import type { Booking, Sauna } from "@/data/types";

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
];

const COLORS = {
  available: "#3A9E6F", // green
  partial: "#D4863C", // amber
  booked: "#C44B6B", // red
  past: "#DDD6CC", // gray
};

type SlotStatus = "available" | "partial" | "booked" | "past";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getNorwegianMonthDate(d: Date): string {
  return format(d, "d. MMMM yyyy", { locale: nb });
}

function getSlotStatus(
  slotTime: string,
  todayStr: string,
  bookingsForSaunaToday: Booking[],
  now: Date
): SlotStatus {
  const slotHour = parseInt(slotTime.split(":")[0], 10);
  const slotDate = parseISO(`${todayStr}T${slotTime}:00`);

  // Past time?
  if (isBefore(slotDate, now)) {
    return "past";
  }

  // Find booking at this exact slot
  const booking = bookingsForSaunaToday.find((b) => b.startTime === slotTime);

  if (!booking) {
    return "available";
  }

  // Internal booking → fully booked
  if (booking.isInternal || booking.type === "internal") {
    return "booked";
  }

  // Private booking → fully booked
  if (booking.type === "private") {
    return "booked";
  }

  // Felles booking → partial if spots left, else booked
  if (booking.type === "felles") {
    // For felles, we consider it partial (some spots may be left)
    // In a real app we'd check capacity vs participantCount
    return booking.participantCount < 10 ? "partial" : "booked";
  }

  return "available";
}

function getStatusColor(status: SlotStatus): string {
  switch (status) {
    case "available":
      return COLORS.available;
    case "partial":
      return COLORS.partial;
    case "booked":
      return COLORS.booked;
    case "past":
      return COLORS.past;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function PublicBooking() {
  const navigate = useNavigate();
  const saunas = getSaunas();
  const allBookings = getBookings();

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  // Build availability map for each sauna
  const saunaAvailability = useMemo(() => {
    const map: Record<
      string,
      { sauna: Sauna; slots: { time: string; status: SlotStatus }[] }
    > = {};

    for (const sauna of saunas) {
      const saunaBookingsToday = allBookings.filter(
        (b) => b.saunaId === sauna.id && b.date === todayStr && b.status !== "cancelled"
      );

      const slots = TIME_SLOTS.map((time) => ({
        time,
        status: getSlotStatus(time, todayStr, saunaBookingsToday, today),
      }));

      map[sauna.id] = { sauna, slots };
    }

    return map;
  }, [saunas, allBookings, todayStr, today]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-off-white">
      <PublicHeader />

      {/* Hero section */}
      <section className="relative bg-deep-teal overflow-hidden">
        <img
          src="/hero-sauna.jpg"
          alt="Nordisk badstueopplevelse"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-deep-teal/60 to-deep-teal/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Book din badstueopplevelse
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              Velg mellom våre tre unike badstuer i Tønsberg, Nøtterøy og Tjøme.
              Privat booking for grupper, eller fellesbadstue for en sosial
              opplevelse.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sauna cards */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16 w-full">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-xl md:text-2xl font-bold text-text-primary mb-6 md:mb-8 text-center"
        >
          Våre badstuer
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saunas.map((sauna, idx) => (
            <motion.div
              key={sauna.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              onClick={() => navigate(`/book/${sauna.publicSlug}`)}
              className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden cursor-pointer card-hover"
            >
              {/* Sauna image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={sauna.image}
                  alt={sauna.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-deep-teal/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wide">
                    {sauna.type === "floating"
                      ? "Flytende"
                      : sauna.type === "wood-fired"
                        ? "Vedfyrt"
                        : "Elektrisk"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-heading text-base font-semibold text-text-primary mb-2">
                  {sauna.name}
                </h3>
                <div className="flex items-center gap-1.5 text-text-secondary text-sm mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{sauna.location}</span>
                </div>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                  {sauna.description}
                </p>

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Opptil {sauna.capacity} pers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sauna.sessionLength / 60} timer</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between pt-3 border-t border-[#DDD6CC]">
                  <div className="space-y-0.5">
                    <p className="text-xs text-text-muted">
                      Privat:{" "}
                      <span className="font-semibold text-text-primary">
                        {sauna.privatePrice} kr
                      </span>
                    </p>
                    <p className="text-xs text-text-muted">
                      Felles:{" "}
                      <span className="font-semibold text-text-primary">
                        {sauna.fellesPrice} kr/pers
                      </span>
                    </p>
                  </div>
                  <button className="flex items-center gap-1 bg-warm-amber hover:bg-amber-light text-white text-sm font-medium px-4 py-2 rounded-lg shadow-amber-btn hover:shadow-amber-btn-hover transition-all duration-200">
                    Book nå
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========== DAGENS OVERSIKT ========== */}
      <section className="bg-white border-t border-[#DDD6CC]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display text-xl md:text-2xl font-bold text-text-primary mb-2 text-center">
              Dagens tilgjengelighet
            </h2>
            <p className="text-center text-text-secondary text-sm mb-8 capitalize">
              {getNorwegianMonthDate(today)}
            </p>

            {/* Sauna rows */}
            <div className="space-y-6">
              {saunas.map((sauna) => {
                const avail = saunaAvailability[sauna.id];
                if (!avail) return null;

                return (
                  <div
                    key={sauna.id}
                    className="rounded-2xl border border-[#DDD6CC] shadow-card p-4 md:p-5"
                  >
                    {/* Sauna header */}
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={sauna.image}
                        alt={sauna.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">
                          {sauna.name}
                        </h3>
                        <p className="text-xs text-text-secondary flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {sauna.location}
                        </p>
                      </div>
                    </div>

                    {/* Time bar - responsive grid, NO horizontal scroll */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {avail.slots.map((slot) => {
                        const color = getStatusColor(slot.status);
                        const isClickable = slot.status === "available";

                        return (
                          <button
                            key={slot.time}
                            onClick={() => {
                              if (isClickable) {
                                navigate(`/book/${sauna.publicSlug}`);
                              }
                            }}
                            disabled={!isClickable}
                            className={`
                              h-9 sm:h-10 rounded-lg transition-all duration-200
                              flex flex-col items-center justify-center gap-0.5
                              ${isClickable ? "cursor-pointer hover:opacity-80 active:scale-95" : "cursor-default"}
                            `}
                            style={{ backgroundColor: color }}
                            title={`${slot.time}: ${slot.status}`}
                          >
                            <span className="text-[9px] sm:text-[10px] text-white font-medium drop-shadow-sm">
                              {slot.time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS.available }}
                />
                <span className="text-xs text-text-secondary">Ledig</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS.partial }}
                />
                <span className="text-xs text-text-secondary">Begrenset</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS.booked }}
                />
                <span className="text-xs text-text-secondary">Opptatt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: COLORS.past }}
                />
                <span className="text-xs text-text-secondary">Passert</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
