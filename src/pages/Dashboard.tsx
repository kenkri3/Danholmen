import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBookings, getMembers, getSaunas, getPayments } from "@/data/store";
import type { Booking, Member, Sauna } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  Users,
  Flame,
  CreditCard,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { nb } from "date-fns/locale";

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    setBookings(getBookings());
    setMembers(getMembers());
    setSaunas(getSaunas());
  }, []);

  useEffect(() => {
    const revenue = bookings
      .filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "free")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    setTotalRevenue(revenue);
  }, [bookings]);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const thisMonthBookings = bookings.filter((b) =>
    isWithinInterval(new Date(b.date), { start: monthStart, end: monthEnd })
  );

  const activeMembers = members.filter((m) => m.isActive);
  const upcomingBookings = bookings
    .filter((b) => new Date(b.date) >= today && b.status !== "cancelled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const kpiCards = [
    {
      title: "Badstuer",
      value: saunas.length,
      icon: Flame,
      link: "/saunas",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      title: "Bookinger denne måned",
      value: thisMonthBookings.length,
      icon: CalendarDays,
      link: "/booking",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      title: "Aktive medlemmer",
      value: activeMembers.length,
      icon: Users,
      link: "/members",
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      title: "Inntekt denne måned",
      value: `${totalRevenue.toLocaleString("nb-NO")} kr`,
      icon: CreditCard,
      link: "/payments",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {format(today, "EEEE d. MMMM yyyy", { locale: nb })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <Link
                  to={card.link}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  Se mer <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-gray-500">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Kommende bookinger</CardTitle>
            <Link
              to="/booking"
              className="text-sm text-primary hover:underline"
            >
              Se alle
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Ingen kommende bookinger
            </p>
          ) : (
            <div className="divide-y">
              {upcomingBookings.map((booking) => {
                const sauna = saunas.find((s) => s.id === booking.saunaId);
                return (
                  <div
                    key={booking.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {sauna?.name || "Ukjent badstue"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.date), "EEEE d. MMMM", {
                          locale: nb,
                        })}{" "}
                        • {booking.startTime}-{booking.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {booking.customerName}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          booking.type === "private"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {booking.type === "private" ? "Privat" : "Felles"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          to="/saunas"
          className="flex items-center gap-2 p-3 rounded-lg border bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Flame className="h-4 w-4 text-orange-500" />
          Badstuer
        </Link>
        <Link
          to="/members"
          className="flex items-center gap-2 p-3 rounded-lg border bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <Users className="h-4 w-4 text-green-500" />
          Medlemmer
        </Link>
        <Link
          to="/booking"
          className="flex items-center gap-2 p-3 rounded-lg border bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <CalendarDays className="h-4 w-4 text-blue-500" />
          Kalender
        </Link>
        <Link
          to="/reports"
          className="flex items-center gap-2 p-3 rounded-lg border bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
        >
          <TrendingUp className="h-4 w-4 text-purple-500" />
          Rapporter
        </Link>
      </div>
    </div>
  );
}
