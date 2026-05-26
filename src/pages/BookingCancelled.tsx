import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, Calendar, ArrowLeft } from "lucide-react";

export default function BookingCancelled() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold">Betaling avbrutt</h1>
        <p className="text-gray-600">
          Din booking ble ikke fullført. Ingen betaling har blitt trukket.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">Hva nå?</h2>
          <p className="text-sm text-gray-600">
            Du kan prøve igjen eller kontakte oss hvis du opplever problemer med betalingen.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link to="/book" className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <Calendar className="h-4 w-4" />
            Prøv igjen
          </Button>
        </Link>
        <Link to="/book" className="flex-1">
          <Button className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </Button>
        </Link>
      </div>
    </div>
  );
}
