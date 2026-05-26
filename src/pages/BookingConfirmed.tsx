import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Calendar, ArrowLeft } from "lucide-react";

export default function BookingConfirmed() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Booking bekreftet!</h1>
        <p className="text-gray-600">
          Takk for din booking. Du vil motta en e-postbekreftelse med alle detaljer.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">Hva skjer nå?</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              E-postbekreftelse sendt
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Møt opp 5 minutter før din tid
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              Ta med håndkle og badetøy
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link to="/book" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Calendar className="h-4 w-4" />
            Book igjen
          </Button>
        </Link>
        <Link to="/min-side" className="flex-1">
          <Button className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Min side
          </Button>
        </Link>
      </div>
    </div>
  );
}
