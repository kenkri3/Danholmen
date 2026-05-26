import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, RotateCcw, Calendar } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { getBookingById } from "@/data/store";
import type { Booking } from "@/data/types";

export default function BookingConfirmed() {
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Get pending booking ID from localStorage
    const pendingId = localStorage.getItem("danholmen_pending_booking_id");
    if (pendingId) {
      const found = getBookingById(pendingId);
      if (found) {
        // Check for session_id in URL (from Stripe redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get("session_id");

        // Update booking to confirmed
        found.status = "confirmed";
        found.paymentStatus = found.totalPrice > 0 ? "paid" : "free";
        if (sessionId) {
          found.stripeSessionId = sessionId;
        }
        // Save updated booking
        const allBookings = JSON.parse(localStorage.getItem("danholmen_bookings") || "[]");
        const idx = allBookings.findIndex((b: Booking) => b.id === pendingId);
        if (idx >= 0) {
          allBookings[idx] = found;
          localStorage.setItem("danholmen_bookings", JSON.stringify(allBookings));
        }
        setBooking(found);
      }
    }

    // Clear pending booking from localStorage
    localStorage.removeItem("danholmen_pending_booking_id");
    localStorage.removeItem("danholmen_payment_deadline");

    // Clean up URL
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
  }, []);

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
            Betaling bekreftet!
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Din booking er bekreftet. Takk for din betaling!
          </p>

          {booking && (
            <div className="bg-off-white rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Referanse</span>
                <span className="font-mono text-text-primary">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Dato</span>
                <span className="text-text-primary">{booking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tid</span>
                <span className="text-text-primary">
                  {booking.startTime} - {booking.endTime}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#DDD6CC]">
                <span className="text-text-muted">Total</span>
                <span className="font-semibold text-text-primary">
                  {booking.totalPrice} kr
                </span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 bg-deep-teal/5 rounded-xl p-4 text-left mb-6">
            <Mail className="w-5 h-5 text-deep-teal mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Bekreftelse på e-post
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                En bekreftelse med alle detaljer er sendt til din e-postadresse.
                Sjekk innboksen din (og søppelpost om nødvendig).
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => (window.location.href = "#/book")}
              className="btn-primary h-12 w-full flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Se alle badstuer
            </button>
            <button
              onClick={() => (window.location.href = "#/widget")}
              className="btn-secondary h-12 w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Book en ny
            </button>
          </div>
        </motion.div>
      </div>
      <PublicFooter />
    </div>
  );
}
