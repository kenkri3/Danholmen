import { useEffect } from "react";
import { getBookings, saveBooking, getPendingPaymentBookings } from "@/data/store";

export function useExpiredCleanup() {
  useEffect(() => {
    const pendingBookings = getPendingPaymentBookings();
    const now = new Date().toISOString();
    let cleaned = 0;

    for (const booking of pendingBookings) {
      if (booking.paymentDeadline && booking.paymentDeadline < now) {
        // Cancel expired booking
        const updated = {
          ...booking,
          status: "cancelled" as const,
          paymentStatus: "pending" as const,
        };
        saveBooking(updated);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[AutoCleanup] Cancelled ${cleaned} expired booking(s)`);
    }
  }, []);
}
