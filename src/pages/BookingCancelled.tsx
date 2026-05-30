import { useEffect } from "react";
import { motion } from "framer-motion";
import { XCircle, RotateCcw, Calendar, AlertTriangle } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { deleteBooking } from "@/data/store";

export default function BookingCancelled() {
  useEffect(() => {
    // Get pending booking ID from localStorage
    const pendingId = localStorage.getItem("danholmen_pending_booking_id");

    if (pendingId) {
      // Delete the pending booking (free the slot)
      deleteBooking(pendingId);
      // Clear localStorage
      localStorage.removeItem("danholmen_pending_booking_id");
      localStorage.removeItem("danholmen_payment_deadline");
    }

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
            className="w-16 h-16 rounded-full bg-sauna-red/10 flex items-center justify-center mx-auto mb-4"
          >
            <XCircle className="w-8 h-8 text-sauna-red" />
          </motion.div>

          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary mb-2">
            Betaling avbrutt
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Du avbrøt betalingen. Ingen betaling er gjennomført og tidsrommet er nå ledig igjen.
          </p>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Ingen bekreftelse sendt
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Din booking er ikke registrert. Hvis du fortsatt vil booke,
                kan du starte på nytt nedenfor.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => (window.location.href = "#/widget")}
              className="btn-primary h-12 w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Prøv igjen
            </button>
            <button
              onClick={() => (window.location.href = "#/book")}
              className="btn-secondary h-12 w-full flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Se alle badstuer
            </button>
          </div>
        </motion.div>
      </div>
      <PublicFooter />
    </div>
  );
}
