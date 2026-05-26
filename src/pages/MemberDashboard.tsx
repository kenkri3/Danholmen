import { useState, useEffect } from "react";
import { getBookings, getSaunas, getMembers } from "@/data/store";
import type { Booking, Sauna, Member } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Calendar, User, Mail, LogIn, LogOut } from "lucide-react";
import { format, isAfter } from "date-fns";
import { nb } from "date-fns/locale";

export default function MemberDashboard() {
  const [email, setEmail] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setSaunas(getSaunas());
  }, []);

  const handleLogin = () => {
    setError("");
    const members = getMembers();
    const found = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setMember(found);
      setLoggedIn(true);
      const memberBookings = getBookings().filter(
        (b) => b.customerEmail.toLowerCase() === email.toLowerCase()
      );
      setBookings(memberBookings);
    } else {
      setError("Ingen medlem funnet med denne e-posten");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setMember(null);
    setEmail("");
    setBookings([]);
  };

  const upcomingBookings = bookings.filter((b) =>
    isAfter(new Date(b.date), new Date()) && b.status !== "cancelled"
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastBookings = bookings.filter((b) =>
    !isAfter(new Date(b.date), new Date()) && b.status !== "cancelled"
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!loggedIn) {
    return (
      <div className="max-w-sm mx-auto px-4 py-12 space-y-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold">Min side</h1>
          <p className="text-sm text-gray-500">
            Logg inn med e-post for å se dine bookinger og medlemskap
          </p>
        </div>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="memberEmail">E-post</Label>
              <Input
                id="memberEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}
            <Button className="w-full h-11 gap-2" onClick={handleLogin}>
              <LogIn className="h-4 w-4" />
              Logg inn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Min side</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            {member?.email}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
          <LogOut className="h-4 w-4" />
          Logg ut
        </Button>
      </div>

      {/* Membership card */}
      {member && (
        <Card className={member.isActive ? "border-green-200 bg-green-50/50" : "border-gray-200"}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                <span className="font-semibold">
                  {member.tier === "danholmen" ? "Danholmen Medlem" : `VEL - ${member.localAssociation || ""}`}
                </span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${member.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {member.isActive ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Navn:</span> {member.name}</p>
              <p><span className="text-gray-500">Telefon:</span> {member.phone || "—"}</p>
              <p><span className="text-gray-500">Gyldig til:</span> {member.endDate}</p>
              {member.tier === "danholmen" && (
                <p className="text-green-700 text-xs mt-1">
                  Ubegrenset fellesøkter • 40% rabatt på privatleie • 1 gratis gjestepass/mnd
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming bookings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kommende bookinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">Ingen kommende bookinger</p>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((b) => {
                const sauna = saunas.find((s) => s.id === b.saunaId);
                return (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{sauna?.name || "Ukjent"}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(b.date), "EEEE d. MMMM", { locale: nb })} • {b.startTime}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${b.type === "private" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {b.type === "private" ? "Privat" : "Felles"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tidligere bookinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastBookings.slice(0, 5).map((b) => {
                const sauna = saunas.find((s) => s.id === b.saunaId);
                return (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-70">
                    <div>
                      <p className="font-medium text-sm">{sauna?.name || "Ukjent"}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(b.date), "EEEE d. MMMM", { locale: nb })} • {b.startTime}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{b.totalPrice} kr</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
