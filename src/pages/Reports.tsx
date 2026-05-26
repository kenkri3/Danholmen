import { useState, useEffect } from "react";
import { getBookings, getSaunas, getMembers } from "@/data/store";
import type { Booking, Sauna, Member } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { nb } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    setBookings(getBookings());
    setSaunas(getSaunas());
    setMembers(getMembers());
  }, []);

  const [year, monthStr] = selectedMonth.split("-");
  const monthDate = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const monthBookings = bookings.filter((b) =>
    isWithinInterval(new Date(b.date), { start: monthStart, end: monthEnd })
  );

  const revenueBySauna = saunas.map((sauna) => ({
    ...sauna,
    revenue: monthBookings
      .filter((b) => b.saunaId === sauna.id && (b.paymentStatus === "paid" || b.paymentStatus === "free"))
      .reduce((sum, b) => sum + b.totalPrice, 0),
    count: monthBookings.filter((b) => b.saunaId === sauna.id).length,
  }));

  const totalRevenue = revenueBySauna.reduce((sum, s) => sum + s.revenue, 0);
  const totalBookings = monthBookings.length;
  const activeMembers = members.filter((m) => m.isActive).length;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Danholmen Badstuer - Månedsrapport", 14, 20);
    doc.setFontSize(12);
    doc.text(format(monthDate, "MMMM yyyy", { locale: nb }), 14, 28);

    doc.setFontSize(14);
    doc.text("Oversikt", 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [["Måling", "Verdi"]],
      body: [
        ["Totale bookinger", totalBookings.toString()],
        ["Total inntekt", `${totalRevenue.toLocaleString("nb-NO")} kr`],
        ["Aktive medlemmer", activeMembers.toString()],
      ],
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22] },
    });

    const yAfter = (doc as any).lastAutoTable?.finalY || 70;
    doc.setFontSize(14);
    doc.text("Inntekt per badstue", 14, yAfter + 15);
    autoTable(doc, {
      startY: yAfter + 18,
      head: [["Badstue", "Bookinger", "Inntekt"]],
      body: revenueBySauna.map((s) => [s.name, s.count.toString(), `${s.revenue.toLocaleString("nb-NO")} kr`]),
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(`danholmen-rapport-${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Rapporter</h1>
        <div className="flex gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
          <Button onClick={generatePDF} className="gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Ingen rapporter generert ennå</p>
          <p className="text-sm text-gray-400">Når bookinger kommer inn, vil rapporter vises her</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{totalBookings}</p>
                <p className="text-xs text-gray-500">Bookinger</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString("nb-NO")} kr</p>
                <p className="text-xs text-gray-500">Inntekt</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{activeMembers}</p>
                <p className="text-xs text-gray-500">Aktive medlemmer</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-2xl font-bold">{saunas.length}</p>
                <p className="text-xs text-gray-500">Badstuer</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Inntekt per badstue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenueBySauna.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.count} bookinger</p>
                    </div>
                    <p className="font-semibold text-sm">{s.revenue.toLocaleString("nb-NO")} kr</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
