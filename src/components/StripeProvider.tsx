import type { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY = "pk_test_51SampleKeyForDanholmenBadstuerTestModeOnly";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const stripe = getStripe();

  if (!stripe) {
    return (
      <div className="p-4 bg-sauna-red/10 border border-sauna-red/20 rounded-lg">
        <p className="text-sm text-sauna-red">
          Kunne ikke initialisere Stripe. Sjekk internettforbindelsen din.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Test mode banner */}
      <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 text-center">
        <p className="text-xs text-warning font-medium">
          Testmodus — Bruk testkort 4242 4242 4242 4242 for betaling
        </p>
      </div>
      <Elements stripe={stripe}>
        {children}
      </Elements>
    </>
  );
}

export function StripeTestBanner() {
  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-3 mb-6">
      <p className="text-sm text-warning font-medium text-center">
        Betaling i testmodus — Bruk kortnummer 4242 4242 4242 4242
      </p>
    </div>
  );
}
