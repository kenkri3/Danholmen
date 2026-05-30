import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

interface ForgotPasswordProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ForgotPassword({ open, onOpenChange }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async () => {
    setError("");

    if (!email.trim()) {
      setError("Vennligst fyll inn e-postadressen din.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Vennligst fyll inn en gyldig e-postadresse.");
      return;
    }

    setIsSubmitting(true);

    // Simuler API-kall for å sende tilbakestilling
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    // Nullstill tilstand når modal lukkes
    setEmail("");
    setSubmitted(false);
    setError("");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)]">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">
            {submitted ? "E-post sendt" : "Glemt passord?"}
          </DialogTitle>
          <DialogDescription>
            {submitted
              ? "Sjekk innboksen din for videre instruksjoner."
              : "Skriv inn e-postadressen din, så sender vi deg instruksjoner for å tilbakestille passordet."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              Hvis denne e-posten er registrert, vil du motta instruksjoner for
              å tilbakestille passordet.
            </p>
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-sm text-[#2A6B6B] hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til innlogging
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">
                E-post
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="din@epost.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
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
              style={{ backgroundColor: "#0B3D4C" }}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Sender...
                </>
              ) : (
                "Send nytt passord"
              )}
            </button>

            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Avbryt
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
