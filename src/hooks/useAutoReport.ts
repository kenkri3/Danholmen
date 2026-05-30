import { useEffect } from "react";
import { getBookings, getSaunas } from "@/data/store";

export interface MonthlyReport {
  month: string;
  year: number;
  totalRevenue: number;
  totalBookings: number;
  bookingsBySauna: Record<string, number>;
  revenueBySauna: Record<string, number>;
  generatedAt: string;
}

const REPORTS_KEY = "danholmen_auto_reports";

export function useAutoReport() {
  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Check if report already generated this month
    const existing = localStorage.getItem(REPORTS_KEY);
    const reports: MonthlyReport[] = existing ? JSON.parse(existing) : [];

    if (reports.some((r) => r.month === currentMonth)) {
      return; // Already generated
    }

    // Generate report
    const bookings = getBookings().filter((b) => b.status === "confirmed");
    const saunas = getSaunas();

    const monthBookings = bookings.filter((b) => b.date.startsWith(currentMonth));

    const totalRevenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const bookingsBySauna: Record<string, number> = {};
    const revenueBySauna: Record<string, number> = {};

    for (const sauna of saunas) {
      const saunaBookings = monthBookings.filter((b) => b.saunaId === sauna.id);
      bookingsBySauna[sauna.name] = saunaBookings.length;
      revenueBySauna[sauna.name] = saunaBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    }

    const report: MonthlyReport = {
      month: currentMonth,
      year: now.getFullYear(),
      totalRevenue,
      totalBookings: monthBookings.length,
      bookingsBySauna,
      revenueBySauna,
      generatedAt: now.toISOString(),
    };

    reports.push(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    console.log(`[AutoReport] Generated report for ${currentMonth}`);
  }, []);
}

export function getAutoReports(): MonthlyReport[] {
  const existing = localStorage.getItem(REPORTS_KEY);
  return existing ? JSON.parse(existing) : [];
}
