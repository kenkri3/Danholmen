import { useState } from "react";
import { Clock, User, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WAITLIST_KEY = "danholmen_waitlist";

export interface WaitlistEntry {
  id: string;
  saunaId: string;
  date: string;
  time: string;
  customerEmail: string;
  customerName: string;
  createdAt: string;
}

interface WaitingListProps {
  saunaId: string;
  date: string;
  time: string;
  onJoined: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getWaitlist(): WaitlistEntry[] {
  try {
    const raw = localStorage.getItem(WAITLIST_KEY);
    return raw ? (JSON.parse(raw) as WaitlistEntry[]) : [];
  } catch {
    return [];
  }
}

function saveWaitlist(entries: WaitlistEntry[]): void {
  localStorage.setItem(WAITLIST_KEY, JSON.stringify(entries));
}

export function WaitingList({ saunaId, date, time, onJoined }: WaitingListProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Vennligst fyll inn navn.");
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setError("Vennligst fyll inn en gyldig e-postadresse.");
      return;
    }

    setIsSubmitting(true);

    // Simuler nettverksforespørsel
    await new Promise((resolve) => setTimeout(resolve, 600));

    const entry: WaitlistEntry = {
      id: generateId(),
      saunaId,
      date,
      time,
      customerEmail: email.trim(),
      customerName: name.trim(),
      createdAt: new Date().toISOString(),
    };

    const list = getWaitlist();
    list.push(entry);
    saveWaitlist(list);

    setIsSubmitting(false);
    setJoined(true);
    onJoined();
  };

  if (joined) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-800 mb-1">
          Du er på ventelisten!
        </h3>
        <p className="text-sm text-green-700">
          Vi sender deg en e-post hvis tiden blir ledig.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFF8F0] border border-[#e8e2d9] rounded-xl p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Denne tiden er fullbooket
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Legg deg på venteliste, så kontakter vi deg hvis tiden blir ledig.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="waitlist-name" className="text-sm font-medium text-gray-700">
            Navn
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              id="waitlist-name"
              type="text"
              placeholder="Ditt navn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9 bg-white"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="waitlist-email" className="text-sm font-medium text-gray-700">
            E-post
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              id="waitlist-email"
              type="email"
              placeholder="din@epost.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 bg-white"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: "#EE4C84" }}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sender...
            </>
          ) : (
            "Legg meg på venteliste"
          )}
        </button>
      </div>
    </div>
  );
}
