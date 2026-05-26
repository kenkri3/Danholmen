import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSaunas } from "@/data/store";
import type { Sauna } from "@/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, MapPin, Users, ArrowRight, Clock } from "lucide-react";

export default function PublicBooking() {
  const [saunas, setSaunas] = useState<Sauna[]>([]);

  useEffect(() => {
    setSaunas(getSaunas());
  }, []);

  return (
    <div className="space-y-6 py-6 max-w-5xl mx-auto px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Book badstue</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Velg en av våre 3 badstuer i Tønsberg-området. Privat eller felles — du velger!
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {saunas.map((sauna) => (
          <Card key={sauna.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
              <Flame className="h-16 w-16 text-orange-300" />
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-lg">{sauna.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {sauna.location}
                </p>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{sauna.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-500">
                  <Users className="h-4 w-4" />
                  {sauna.capacity} pers
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  {sauna.openingHours.open}-{sauna.openingHours.close}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <p className="text-gray-500">Privat</p>
                  <p className="font-semibold">{sauna.pricePerHour} kr/t</p>
                </div>
                <div className="text-sm text-right">
                  <p className="text-gray-500">Felles</p>
                  <p className="font-semibold">{sauna.sharedPrice} kr/pers</p>
                </div>
              </div>
              <Link to={`/book/${sauna.slug}`}>
                <Button className="w-full gap-2 mt-1">
                  Book nå
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Membership CTA */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100">
        <CardContent className="p-6 text-center space-y-3">
          <h3 className="font-bold text-lg">Bli Danholmen-medlem</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Kun 349 kr/mnd. Ubegrenset fellesøkter, 40% rabatt på privatleie, 
            og 1 gratis gjestepass per måned.
          </p>
          <Link to="/min-side">
            <Button variant="outline">Les mer om medlemskap</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
