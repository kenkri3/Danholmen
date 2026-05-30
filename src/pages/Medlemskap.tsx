import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Lock,
  User,
  Mail,
  Phone,
  MapPin,
  Home,
} from "lucide-react";
import { getSavedCustomer, saveCustomer, saveMember, setCurrentMember, getActiveMembershipTiers } from "@/data/store";
import type { MemberTier, LocalAssociation, MembershipTierConfig } from "@/data/types";
import { sendConfirmation } from "@/data/emailService";

const MEMBER_TIER: MemberTier = "danholmen";

export default function Medlemskap() {
  const navigate = useNavigate();

  const [availableTiers, setAvailableTiers] = useState<MembershipTierConfig[]>([]);
  const [selectedTier, setSelectedTier] = useState<MembershipTierConfig | null>(null);

  const [navn, setNavn] = useState("");
  const [epost, setEpost] = useState("");
  const [telefon, setTelefon] = useState("");
  const [adresse, setAdresse] = useState("");
  const [postnr, setPostnr] = useState("");
  const [passord, setPassord] = useState("");
  const [bekreftPassord, setBekreftPassord] = useState("");
  const [huskMeg, setHuskMeg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available membership tiers
  useEffect(() => {
    const tiers = getActiveMembershipTiers();
    setAvailableTiers(tiers);
    if (tiers.length === 1) {
      setSelectedTier(tiers[0]);
    }
  }, []);

  // Pre-fill from saved customer in localStorage
  useEffect(() => {
    const saved = getSavedCustomer();
    if (saved) {
      if (saved.name) setNavn(saved.name);
      if (saved.email) setEpost(saved.email);
      if (saved.phone) setTelefon(saved.phone);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier) {
      alert("Vennligst velg et medlemsnivå.");
      return;
    }
    if (!navn || !epost || !telefon || !adresse || !postnr || !passord) {
      alert("Vennligst fyll ut alle obligatoriske felt.");
      return;
    }
    if (passord !== bekreftPassord) {
      alert("Passordene matcher ikke.");
      return;
    }
    if (passord.length < 6) {
      alert("Passordet må være minst 6 tegn.");
      return;
    }

    // Save customer info if "Husk meg" is checked
    if (huskMeg) {
      saveCustomer({ name: navn, email: epost, phone: telefon });
    }

    setIsSubmitting(true);

    // Simulate 15-second payment processing
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Save membership — matches Member interface
    const [first, ...rest] = navn.split(" ");
    const memberData = {
      id: crypto.randomUUID(),
      firstName: first || navn,
      lastName: rest.join(" ") || "",
      email: epost,
      phone: telefon,
      password: passord,
      tier: MEMBER_TIER as MemberTier,
      localAssociation: null as LocalAssociation,
      localDiscountRate: 0,
      isActive: true,
      subscriptionPrice: selectedTier.price,
      joinedAt: new Date().toISOString(),
      expiresAt: "",
      bookingsCount: 0,
      totalSpent: 0,
      image: null as string | null,
    };
    saveMember(memberData);
    setCurrentMember(memberData); // Auto-login after purchase

    // Send e-postbekreftelse
    await sendConfirmation("membership", {
      customerName: navn,
      customerEmail: epost,
      membershipType: selectedTier.name,
      price: selectedTier.price,
      startDate: new Date().toLocaleDateString("nb-NO"),
      bookingId: memberData.id,
    });

    setIsSubmitting(false);
    alert("Takk for ditt medlemskap! En e-postbekreftelse er sendt til " + epost);
    navigate("/min-side");
  };

  const accentMap: Record<string, string> = {
    "brand-pink": "#EE4C84",
    teal: "#2A6B6B",
    "deep-teal": "#0B3D4C",
  };

  if (availableTiers.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F5F0EA" }}>
        <nav className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: "#0B3D4C" }}>
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <img src="/danholmen-logo.png" alt="Danholmen" className="h-10" />
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til forsiden
            </button>
          </div>
        </nav>
        <section style={{ backgroundColor: "#0B3D4C" }} className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Bli Medlem
            </h1>
          </div>
        </section>
        <main className="max-w-3xl mx-auto px-4 py-12 text-center">
          <Sparkles className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-text-secondary">Ingen medlemskap tilgjengelig for øyeblikket.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F0EA" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: "#0B3D4C" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src="/danholmen-logo.png" alt="Danholmen" className="h-10" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til forsiden
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ backgroundColor: "#0B3D4C" }} className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Bli Medlem
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl mx-auto">
            {availableTiers.length > 1
              ? "Velg medlemsnivå som passer deg best"
              : "Få ubegrenset tilgang til fellesbadstue og eksklusive rabatter"}
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Tier Selection (if multiple tiers) */}
        {availableTiers.length > 1 && !selectedTier && (
          <div className="grid gap-4">
            {availableTiers.map((tier) => {
              const accent = accentMap[tier.accentColor] ?? "#EE4C84";
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className="bg-white rounded-2xl border-2 p-6 md:p-8 shadow-lg text-left transition-all hover:scale-[1.01]"
                  style={{
                    borderColor: `${accent}40`,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-6 h-6" style={{ color: accent }} />
                        <h2 className="text-xl font-bold" style={{ color: "#0B3D4C" }}>
                          {tier.name}
                        </h2>
                        {tier.badge && (
                          <span
                            className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ backgroundColor: accent }}
                          >
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      {tier.subtitle && (
                        <p className="text-text-secondary text-sm mb-2">{tier.subtitle}</p>
                      )}
                      <p className="text-text-secondary text-sm mb-4">{tier.description}</p>
                      <ul className="space-y-1.5">
                        {tier.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                            <span className="text-gray-700 text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: accent, fontFamily: "'Playfair Display', serif" }}
                      >
                        {tier.price} kr
                      </span>
                      <span className="text-gray-500 text-sm ml-1">/{tier.periodLabel}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected tier info + back button (if multiple) */}
        {selectedTier && availableTiers.length > 1 && (
          <div
            className="bg-white rounded-2xl border-2 p-6 md:p-8 shadow-lg"
            style={{
              borderColor: "rgba(212, 134, 60, 0.3)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            }}
          >
            <button
              onClick={() => setSelectedTier(null)}
              className="text-sm text-teal hover:underline mb-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Velg et annet nivå
            </button>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles
                className="w-7 h-7"
                style={{ color: accentMap[selectedTier.accentColor] ?? "#EE4C84" }}
              />
              <h2 className="text-2xl font-bold" style={{ color: "#0B3D4C" }}>
                {selectedTier.name}
              </h2>
              {selectedTier.badge && (
                <span
                  className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ backgroundColor: accentMap[selectedTier.accentColor] ?? "#EE4C84" }}
                >
                  {selectedTier.badge}
                </span>
              )}
            </div>
            <div className="mb-6">
              <span
                className="text-5xl font-bold"
                style={{
                  color: accentMap[selectedTier.accentColor] ?? "#EE4C84",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {selectedTier.price} kr
              </span>
              <span className="text-lg text-gray-500 ml-2">/{selectedTier.periodLabel}</span>
            </div>
            <ul className="space-y-3 mb-6">
              {selectedTier.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
            <p className="text-text-secondary text-sm">{selectedTier.description}</p>
          </div>
        )}

        {/* Single tier display (no selection needed) */}
        {selectedTier && availableTiers.length === 1 && (
          <div
            className="bg-white rounded-2xl border-2 p-6 md:p-8 shadow-lg"
            style={{
              borderColor: "rgba(212, 134, 60, 0.3)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles
                className="w-7 h-7"
                style={{ color: accentMap[selectedTier.accentColor] ?? "#EE4C84" }}
              />
              <h2 className="text-2xl font-bold" style={{ color: "#0B3D4C" }}>
                {selectedTier.name}
              </h2>
              {selectedTier.badge && (
                <span
                  className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ backgroundColor: accentMap[selectedTier.accentColor] ?? "#EE4C84" }}
                >
                  {selectedTier.badge}
                </span>
              )}
            </div>

            <div className="mb-8">
              <span
                className="text-5xl font-bold"
                style={{
                  color: accentMap[selectedTier.accentColor] ?? "#EE4C84",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {selectedTier.price} kr
              </span>
              <span className="text-lg text-gray-500 ml-2">/{selectedTier.periodLabel}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {selectedTier.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>

            <div
              className="p-4 rounded-xl text-sm"
              style={{ backgroundColor: "#FFF0F4", color: "#8B6914" }}
            >
              Medlemskapet løper til det sies opp. 30 dagers oppsigelsestid.
            </div>
          </div>
        )}

        {/* Purchase form - only show when a tier is selected */}
        {selectedTier && (
          <div
            className="bg-white rounded-2xl border shadow-lg p-6 md:p-8"
            style={{
              borderColor: "rgba(212, 134, 60, 0.15)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: "#0B3D4C" }}>
              Dine opplysninger
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Navn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Navn <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ola Nordmann"
                    value={navn}
                    onChange={(e) => setNavn(e.target.value)}
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                    style={{ "--tw-ring-color": "#0B3D4C" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* E-post */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-post <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                  <input
                    type="email"
                    placeholder="ola@eksempel.no"
                    value={epost}
                    onChange={(e) => setEpost(e.target.value)}
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                    style={{ "--tw-ring-color": "#0B3D4C" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefon <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                  <input
                    type="tel"
                    placeholder="971 20 200"
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                    style={{ "--tw-ring-color": "#0B3D4C" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fakturaadresse <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                  <input
                    type="text"
                    placeholder="Storgata 1"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                    style={{ "--tw-ring-color": "#0B3D4C" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Postnummer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Postnummer <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="0155"
                    value={postnr}
                    onChange={(e) => setPostnr(e.target.value)}
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                    style={{ "--tw-ring-color": "#0B3D4C" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Passord */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Velg passord <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Minst 6 tegn"
                    value={passord}
                    onChange={(e) => setPassord(e.target.value)}
                    required
                    minLength={6}
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                    style={{ "--tw-ring-color": "#0B3D4C" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Bekreft passord */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bekreft passord <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Gjenta passordet"
                    value={bekreftPassord}
                    onChange={(e) => setBekreftPassord(e.target.value)}
                    required
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all text-sm"
                    style={{ "--tw-ring-color": "#0B3D4C" } as React.CSSProperties}
                  />
                </div>
              </div>

              {/* Husk meg checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={huskMeg}
                  onChange={(e) => setHuskMeg(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#0B3D4C] cursor-pointer"
                />
                <span className="text-sm text-gray-600">
                  Husk mine opplysninger til neste gang
                </span>
              </label>

              {/* Submit-knapp */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "#0B3D4C" }}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Behandler betaling...
                  </>
                ) : (
                  `Fullfør kjøp — ${selectedTier.price} kr/${selectedTier.periodLabel}`
                )}
              </button>
            </form>
          </div>
        )}

        {/* Payee/Swedbank Pay banner */}
        {selectedTier && (
          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: "#FFF0F4",
              borderColor: "rgba(212, 134, 60, 0.2)",
            }}
          >
            <Lock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#EE4C84" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#0B3D4C" }}>
                Sikker betaling
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                Betaling håndteres av Payee/Swedbank Pay. Alle transaksjoner er kryptert
                og sikret med banknivå sikkerhet.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Dette er en simulert betaling — ingen faktisk belastning vil finne sted.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: "#0B3D4C" }} className="py-10 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <img src="/danholmen-logo.png" alt="Danholmen" className="h-10 mx-auto mb-4 opacity-80" />
          <p className="text-white/70 text-sm mb-2">
            E-post:{" "}
            <a href="mailto:booking@danholmen.no" className="text-white/90 hover:text-white underline underline-offset-2">
              booking@danholmen.no
            </a>
          </p>
          <p className="text-white/70 text-sm mb-6">
            Tlf:{" "}
            <a href="tel:97120200" className="text-white/90 hover:text-white underline underline-offset-2">
              971 20 200
            </a>
          </p>
          <div className="border-t border-white/10 pt-6 mt-6">
            <p className="text-white/50 text-xs">
              &copy; {new Date().getFullYear()} Danholmen Badstuer. Alle rettigheter reservert.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
