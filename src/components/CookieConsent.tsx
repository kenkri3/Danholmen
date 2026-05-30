import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "danholmen_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#e8e2d9] shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-4">
        <Cookie className="w-5 h-5 text-[#EE4C84] flex-shrink-0 hidden md:block" />
        <p className="text-sm text-gray-700 flex-1 text-center md:text-left">
          Vi bruker informasjonskapsler (cookies) for å forbedre din opplevelse.
          Ved å fortsette godtar du vår{" "}
          <a
            href="/#/personvern"
            className="text-[#2A6B6B] underline hover:no-underline"
          >
            personvernerklæring
          </a>
          .
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
          >
            Avslå
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#0B3D4C" }}
          >
            Godta
          </button>
        </div>
        <button
          onClick={decline}
          className="md:hidden p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Lukk"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
