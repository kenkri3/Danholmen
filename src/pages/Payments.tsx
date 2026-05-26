import { useState, useEffect } from "react";
import { getBookings, getSaunas } from "@/data/store";
import type { Booking, Sauna } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function Payments() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);

  useEffect(() => {
    const allBookings = getBookings().filter(
      (b) => b.paymentStatus === "paid" || b.paymentStatus === "awaiting_payment"
    );
    setBookings(allBookings);
    setSaunas(getSaunas());
  }, []);

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const exportCSV = () => {
    const headers = ["Dato", "Kunde", "E-post", "Type", "Badstue", "Beløp", "Status"];
    const rows = bookings.map((b) => [
      b.date,
      b.customerName,
      b.customerEmail,
      b.type === "private" ? "Privat" : "Felles",
      saunas.find((s) => s.id === b.saunaId)?.name || "",
      b.totalPrice.toString(),
      b.paymentStatus === "paid" ? "Betalt" : "Venter",
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `innbetalinger-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Innbetalinger</h1>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Eksport CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total inntekt</p>
              <p className="text-2xl font-bold">{totalRevenue.toLocaleString("nb-NO")} kr</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Transaksjoner</p>
              <p className="text-2xl font-bold">{bookings.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Ingen innbetalinger registrert ennå</p>
          <p className="text-sm text-gray-400">Innbetalinger vises her når bookinger er betalt</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{b.customerName}</p>
                      <p className="text-xs text-gray-500">{b.customerEmail}</p>
                    </div>
                    <p className="font-semibold">{b.totalPrice} kr</p>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-500">Badstue:</span>{" "}
                      {saunas.find((s) => s.id === b.saunaId)?.name || "—"}
                    </p>
                    <p>
                      <span className="text-gray-500">Dato:</span>{" "}
                      {b.date}
                    </p>
                    <p>
                      <span className="text-gray-500">Type:</span>{" "}
                      {b.type === "private" ? "Privat" : "Felles"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      b.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {b.paymentStatus === "paid" ? "Betalt" : "Venter betaling"}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Dato</th>
                  <th className="text-left px-4 py-3 font-medium">Kunde</th>
                  <th className="text-left px-4 py-3 font-medium">Badstue</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-right px-4 py-3 font-medium">Beløp</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{b.date}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.customerName}</p>
                      <p className="text-xs text-gray-500">{b.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      {saunas.find((s) => s.id === b.saunaId)?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {b.type === "private" ? "Privat" : "Felles"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {b.totalPrice} kr
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          b.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {b.paymentStatus === "paid" ? "Betalt" : "Venter"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
