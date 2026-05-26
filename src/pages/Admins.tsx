import { useState, useEffect } from "react";
import { getAdmins, getPayments } from "@/data/store";
import type { Admin } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function Admins() {
  const [admins, setAdmins] = useState<Admin[]>([]);

  useEffect(() => {
    setAdmins(getAdmins());
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Administratorer</h1>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Navn</th>
              <th className="text-left px-4 py-3 font-medium">E-post</th>
              <th className="text-left px-4 py-3 font-medium">Rolle</th>
              <th className="text-left px-4 py-3 font-medium">Opprettet</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{admin.name}</td>
                <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                    {admin.role === "superadmin" ? "Superadmin" : admin.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(admin.createdAt), "d. MMM yyyy", { locale: nb })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500">
        Kun én administrator i systemet. Kontakt support for å endre.
      </p>
    </div>
  );
}

export function Payments() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    // Payments are stored in bookings with paymentStatus = paid
    const bookings = getPayments ? getPayments() : [];
    setPayments(bookings);
  }, []);

  const exportCSV = () => {
    const headers = ["Dato", "Kunde", "Type", "Badstue", "Beløp", "Status"];
    const rows = payments.map((p) => [
      p.date,
      p.customerName,
      p.type,
      p.saunaName,
      p.totalPrice,
      p.paymentStatus,
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Innbetalinger</h1>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Eksport CSV
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Ingen innbetalinger registrert ennå</p>
          <p className="text-sm text-gray-400">Innbetalinger vises her når bookinger er betalt</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Dato</th>
                <th className="text-left px-4 py-3 font-medium">Kunde</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-right px-4 py-3 font-medium">Beløp</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{p.date}</td>
                  <td className="px-4 py-3 font-medium">{p.customerName}</td>
                  <td className="px-4 py-3">{p.type}</td>
                  <td className="px-4 py-3 text-right">{p.totalPrice} kr</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                      Betalt
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
