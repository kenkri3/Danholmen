import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Flame,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  ArrowDown,
  Menu,
  X,
  Check,
  Waves,
  Sparkles,
  Phone,
  Mail,
  Building2,
  FileText,
  Shield,
  Contact,
  Logs,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Droplets,
  Ban,
  Trash2,
  Info,
  User,
} from "lucide-react";
import { getSaunas, getWebsiteImages, getActiveMembershipTiers, getCampaigns } from "@/data/store";
import type { Sauna, WebsiteImages, MembershipTierConfig, Campaign } from "@/data/types";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                 */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

function FadeInSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Staggered children wrapper                                        */
/* ------------------------------------------------------------------ */
function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.15 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Rules Accordion                                                   */
/* ------------------------------------------------------------------ */
const rules = [
  {
    icon: Droplets,
    title: "Vannbruk",
    content:
      "Bruk KUN ferskvann på steinene. Saltvann skader ovnen umiddelbart og skaper svært ubehagelig lukt. Tøm askebeholderen og brennkammeret jevnlig – dette er avgjørende for trekk, varmeeffekt og luftkvalitet.",
  },
  {
    icon: Thermometer,
    title: "Oppvarming",
    content:
      "IKKE kast vann på ovnen før den er glovarm! Hvis du kaster vann på kalde steiner, kjøler du bare ned ovnen ytterligere og mister varmen. Vær tålmodig og la ovnen bli skikkelig varm først.",
  },
  {
    icon: Ban,
    title: "Forbud",
    content:
      "Det er strengt forbudt å røyke i badstueene. Inntak av alkohol inne i badstueene er heller ikke tillatt. Dette gjelder alle våre lokasjoner uten unntak.",
  },
  {
    icon: Trash2,
    title: "Renhold & Orden",
    content:
      "Bruk alltid to håndklær – ett til å sitte på og ett til tørk. Svab gulvet og tørk opp vann før du forlater badstuen. Rydd opp etter deg – det kommer gjester etter deg som ønsker en ren badstue.",
  },
  {
    icon: Shield,
    title: "Ansvar",
    content:
      "All bading, ferdsel på området og bruk av fasilitetene skjer på eget ansvar. Barn under 16 år må ha voksent tilsyn. Ved skader på utstyr eller eiendom forårsaket av kunden, er kunden ansvarlig.",
  },
  {
    icon: CalendarDays,
    title: "Avbestilling",
    content:
      "Full refusjon ved avbestilling mer enn 48 timer før. 50% refusjon ved avbestilling 24–48 timer før. Ingen refusjon ved avbestilling under 24 timer før. Booking er bindende ved betaling.",
  },
];

function RulesAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {rules.map((rule, i) => {
        const Icon = rule.icon;
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border border-[#DDD6CC] rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 text-left transition-colors hover:bg-[#F5F0EA]/50"
            >
              <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-teal" />
              </div>
              <span className="flex-1 font-display font-semibold text-deep-teal text-sm md:text-base">
                {rule.title}
              </span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-text-muted flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0" />
              )}
            </button>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 md:px-5 md:pb-5"
              >
                <p className="text-text-secondary text-sm leading-relaxed pl-12">
                  {rule.content}
                </p>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Membership Card                                                   */
/* ------------------------------------------------------------------ */
function MembershipCard({
  tier,
  onCta,
}: {
  tier: MembershipTierConfig;
  onCta: () => void;
}) {
  const accentMap: Record<string, string> = {
    "brand-pink": "#EE4C84",
    teal: "#2A6B6B",
    "deep-teal": "#0B3D4C",
  };
  const accent = accentMap[tier.accentColor] ?? "#EE4C84";

  return (
    <div className="bg-white rounded-3xl border-2 shadow-card p-6 md:p-8 relative overflow-visible h-full flex flex-col">
      {/* Badge — positioned OUTSIDE the card, overlapping the top edge */}
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className="text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide whitespace-nowrap shadow-sm"
            style={{ backgroundColor: accent }}
          >
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
          style={{ backgroundColor: `${accent}15` }}
        >
          <Sparkles className="w-7 h-7" style={{ color: accent }} />
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-bold text-deep-teal mb-0">
          {tier.name}
        </h3>
        {tier.subtitle && (
          <p className="text-text-secondary text-sm mt-1">{tier.subtitle}</p>
        )}
        <div className="flex items-baseline justify-center gap-1 mt-3">
          <span
            className="font-display text-4xl md:text-5xl font-bold"
            style={{ color: accent }}
          >
            {tier.price}
          </span>
          <span className="text-text-secondary text-lg">
            kr/{tier.periodLabel}
          </span>
        </div>
        <p className="text-text-secondary text-sm mt-2 max-w-xs mx-auto">
          {tier.description}
        </p>
      </div>

      {/* Benefits */}
      <ul className="space-y-3 mb-8 flex-1">
        {tier.benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-success" />
            </div>
            <span className="text-text-primary text-sm">{benefit}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onCta}
        className="w-full text-center py-3.5 rounded-xl text-white text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{ backgroundColor: accent, boxShadow: `0 4px 16px ${accent}40` }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.filter = "brightness(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.filter = "brightness(1)";
        }}
      >
        {tier.ctaText}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [images, setImages] = useState<WebsiteImages | null>(null);
  const [tiers, setTiers] = useState<MembershipTierConfig[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  /* ---- Load data ------------------------------------------------- */
  useEffect(() => {
    setSaunas(getSaunas().filter((s) => s.isActive));
    setImages(getWebsiteImages());
    setTiers(getActiveMembershipTiers());
    setCampaigns(getCampaigns().filter((c) => c.isActive));
  }, []);

  /* ---- Scroll listener for navbar -------------------------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- Close mobile menu on resize ------------------------------- */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const heroImage = images?.heroImage ?? "";
  const overlayOpacity = images?.heroOverlayOpacity ?? 0.55;

  const scrollToSaunas = () => {
    const el = document.getElementById("badstuer");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  /* ---- Helpers for descriptions ---------------------------------- */
  const getShortDescription = (sauna: Sauna) => {
    const sentences = sauna.description
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);
    if (sentences.length >= 2) {
      return `${sentences[0]}. ${sentences[1]}.`;
    }
    return sauna.description.slice(0, 140) + "...";
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-off-white">
      {/* ============================================================ */}
      {/*  NAVBAR                                                     */}
      {/* ============================================================ */}
      <nav
        className={[
          "w-full z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* ---- Logo ---------------------------------------------- */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 group"
            >
              <div
                className={[
                  "transition-all duration-300 rounded-lg px-1.5 py-1",
                  scrolled ? "bg-transparent" : "bg-white/90 shadow-lg",
                ].join(" ")}
              >
                <img
                  src="/danholmen-logo.png"
                  alt="Danholmen"
                  className="h-7 md:h-9 w-auto block"
                />
              </div>
            </button>

            {/* ---- Desktop nav --------------------------------------- */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => navigate("/book")}
                className="btn-primary text-sm"
              >
                Book badstue
              </button>
              <button
                onClick={() => navigate("/login")}
                className={[
                  "text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-lg",
                  scrolled
                    ? "text-text-secondary hover:text-deep-teal hover:bg-cream"
                    : "text-white/80 hover:text-white hover:bg-white/10",
                ].join(" ")}
              >
                Logg inn
              </button>
              <button
                onClick={() => navigate("/login-medlem")}
                className={[
                  "text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-lg flex items-center gap-1.5",
                  scrolled
                    ? "text-teal hover:text-deep-teal hover:bg-cream"
                    : "text-white/80 hover:text-white hover:bg-white/10",
                ].join(" ")}
              >
                <User className="w-4 h-4" />
                Min side
              </button>
            </div>

            {/* ---- Mobile hamburger ---------------------------------- */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={[
                "md:hidden p-2 rounded-lg transition-colors",
                scrolled
                  ? "text-deep-teal hover:bg-cream"
                  : "text-white hover:bg-white/10",
              ].join(" ")}
              aria-label="Meny"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ---- Mobile menu ----------------------------------------- */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-cream shadow-lg"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  navigate("/book");
                  setMobileOpen(false);
                }}
                className="btn-primary text-sm w-full text-center"
              >
                Book badstue
              </button>
              <button
                onClick={() => {
                  navigate("/login");
                  setMobileOpen(false);
                }}
                className="btn-secondary text-sm w-full text-center"
              >
                Logg inn
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ============================================================ */}
      {/*  HERO                                                       */}
      {/* ============================================================ */}
      <section className="relative w-full -mt-16 md:-mt-20">
        {/* Background image */}
        <div className="relative w-full min-h-[100dvh] flex items-center justify-center">
          {/* Campaign banner */}
          {campaigns.length > 0 && (
            <div className="absolute top-20 left-0 right-0 z-20 px-4">
              <div className="max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-[#EE4C84]/30">
                <p className="text-sm font-medium text-center text-deep-teal">
                  🎉 {campaigns[0].name}: {campaigns[0].discountPercent}% rabatt med kode{" "}
                  <span className="font-bold text-[#EE4C84]">{campaigns[0].discountCode}</span>
                </p>
              </div>
            </div>
          )}

          {/* Video background - seasonal */}
          <video
            autoPlay
            muted
            loop
            playsInline
            key={images?.heroVideoSeason ?? "summer"}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source 
              src={`/hero-video-${images?.heroVideoSeason ?? "summer"}.mp4`} 
              type="video/mp4" 
            />
          </video>
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />

          {/* Content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-16">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="font-display text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 md:mb-6"
            >
              Tett på naturen,
              <br />
              Tett på varmen
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed"
            >
              Velg mellom drop-in, privat leie, eller gunstig medlemskap.
              Nyt våre autentiske, vedfyrte badstuer – husk kun å ta med egen ved!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <button
                onClick={() => navigate("/book")}
                className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto"
              >
                Book nå
              </button>
              <button
                onClick={scrollToSaunas}
                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white font-medium rounded-lg px-8 py-3.5 transition-all duration-200 hover:bg-white/20 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Se våre badstuer
                <ArrowDown className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Scroll-down hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ArrowDown className="w-5 h-5 text-white/50" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  BADSTUER                                                   */}
      {/* ============================================================ */}
      <section id="badstuer" className="w-full py-16 md:py-24 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-10 md:mb-14">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-deep-teal mb-3">
              Våre badstuer
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              Tre unike badstueopplevelser i Tønsberg-området. Velg den
              som passer deg best.
            </p>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {saunas.map((sauna) => {
              const cardImage =
                images?.saunaCards[sauna.id] ?? sauna.image ?? "";
              return (
                <StaggerItem key={sauna.id}>
                  <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden card-hover h-full flex flex-col">
                    {/* Card image */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F5F0EA]">
                      {cardImage ? (
                        <img
                          src={cardImage}
                          alt={sauna.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Flame className="w-12 h-12 text-[#DDD6CC]" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-deep-teal text-xs font-semibold px-3 py-1.5 rounded-full">
                          <MapPin className="w-3 h-3" />
                          {sauna.location}
                        </span>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 md:p-6 flex flex-col flex-1">
                      <h3 className="font-display text-xl md:text-2xl font-bold text-deep-teal mb-2">
                        {sauna.name}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed mb-4 flex-1">
                        {getShortDescription(sauna)}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-4 text-sm text-text-muted mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {sauna.capacity} pers
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4" />
                          Vedfyrt
                        </span>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-2 mb-5">
                        <span className="text-deep-teal font-semibold text-sm">
                          Privat: {sauna.privatePrice} kr
                        </span>
                        <span className="text-text-muted text-xs">/</span>
                        <span className="text-teal font-medium text-sm">
                          Felles: {sauna.fellesPrice} kr/pers
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-2 text-xs text-success">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="font-medium">Tilgjengelig for booking</span>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  VIKTIG: TA MED EGEN VED                                     */}
      {/* ============================================================ */}
      <section className="w-full py-8 md:py-10" style={{ backgroundColor: "#FFF0F4" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 p-5 md:p-6 rounded-2xl border-2 border-brand-pink/30 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-pink/10 flex items-center justify-center flex-shrink-0">
                  <Logs className="w-6 h-6 text-brand-pink" />
                </div>
                <div>
                  <h3 className="font-display text-lg md:text-xl font-bold text-deep-teal">
                    Ta med egen ved
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Alle våre badstuer er vedfyrte — husk å ta med tørr ved!
                  </p>
                </div>
              </div>
              <div className="hidden md:block w-px h-10 bg-cream" />
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <AlertTriangle className="w-4 h-4 text-brand-pink" />
                <span>Vann på steinene må være ferskvann</span>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  MEDLEMSKAP                                                  */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24" style={{ backgroundColor: "#F5F0EA" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-10 md:mb-14">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-deep-teal mb-3">
              Medlemskap
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              Velg medlemskap som passer deg. Alle gir tilgang til fellesbadstue og rabatter.
            </p>
          </FadeInSection>

          {tiers.length === 0 ? (
            <FadeInSection className="text-center">
              <p className="text-text-muted">Ingen medlemskap tilgjengelig for øyeblikket.</p>
            </FadeInSection>
          ) : (
            <StaggerContainer className={`grid gap-6 md:gap-8 ${tiers.length === 1 ? "max-w-md mx-auto" : tiers.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 md:grid-cols-3"}`}>
              {tiers.map((tier) => (
                <StaggerItem key={tier.id}>
                  <MembershipCard tier={tier} onCta={() => navigate("/medlemskap")} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SLIK FUNGERER DET                                             */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24 bg-off-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-10 md:mb-14">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-deep-teal mb-3">
              Slik fungerer det
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              Tre enkle steg til din badstueopplevelse.
            </p>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-4xl mx-auto">
            {/* Step 1 */}
            <StaggerItem>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal/10 mb-4">
                  <CalendarDays className="w-8 h-8 text-teal" />
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-pink text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                  1
                </div>
                <h3 className="font-display text-xl font-bold text-deep-teal mb-2">
                  Velg badstue
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Velg mellom våre tre unike badstuer i
                  Tønsberg-området.
                </p>
              </div>
            </StaggerItem>

            {/* Step 2 */}
            <StaggerItem>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal/10 mb-4">
                  <Clock className="w-8 h-8 text-teal" />
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-pink text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                  2
                </div>
                <h3 className="font-display text-xl font-bold text-deep-teal mb-2">
                  Book tid
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Velg dato og tid som passer deg. Betal enkelt med kort.
                </p>
              </div>
            </StaggerItem>

            {/* Step 3 */}
            <StaggerItem>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-pink/10 mb-4">
                  <Flame className="w-8 h-8 text-brand-pink" />
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-pink text-white text-sm font-bold flex items-center justify-center mx-auto mb-3">
                  3
                </div>
                <h3 className="font-display text-xl font-bold text-deep-teal mb-2">
                  Nyt varmen
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Kom til en ferdig oppvarmet badstue og nyt en time med
                  varme og velvære.
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {/* Connecting line (desktop only) */}
          <div className="hidden md:block max-w-2xl mx-auto -mt-40 relative z-0">
            <div className="flex justify-between px-20">
              <div className="w-full h-0.5 bg-cream" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  REGLER & INFO                                               */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-10 md:mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-deep-teal mb-3">
              Regler & Vilkår
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              Les gjennom reglene før du booker — det er viktig for alles
              opplevelse.
            </p>
          </FadeInSection>

          <FadeInSection>
            {/* Warning box */}
            <div className="mb-8 p-4 md:p-5 rounded-xl border-2 border-brand-pink/30 bg-[#FFF0F4] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-brand-pink flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-deep-teal text-sm mb-1">
                  VIKTIG: Ta med egen ved
                </h4>
                <p className="text-text-secondary text-sm">
                  Alle våre badstuer er vedfyrte. Du må ta med din egen
                  tørr ved. Ikke kast vann på ovnen før den er
                  glovarm — det kjøler ned steinene og minker varmen.
                  Bruk <strong className="text-deep-teal">KUN ferskvann</strong>{" "}
                  på steinene (aldri saltvann!).
                </p>
              </div>
            </div>

            {/* Rules accordion */}
            <RulesAccordion />
          </FadeInSection>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  GOOGLE MAPS                                                 */}
      {/* ============================================================ */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-10 md:mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-deep-teal mb-3">
              Finn frem
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              Alle våre badstuer ligger i vakre omgivelser ved vannet.
              Klikk på kartet for veibeskrivelse.
            </p>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {saunas.map((sauna) => (
              <StaggerItem key={sauna.id}>
                <div className="rounded-2xl overflow-hidden border-2 border-[#DDD6CC] shadow-card">
                  <iframe
                    src={sauna.googleMapsEmbed ?? `https://www.google.com/maps?q=${encodeURIComponent(sauna.location)}&z=14&output=embed`}
                    width="100%"
                    height="240"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={sauna.name}
                    className="block"
                  />
                  <div className="p-4 bg-white">
                    <h3 className="font-display font-bold text-deep-teal text-base mb-1">
                      {sauna.name}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {sauna.location}
                    </p>
                    <a
                      href={sauna.mapsUrl ?? `https://www.google.com/maps?q=${encodeURIComponent(sauna.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-teal hover:text-deep-teal transition-colors mt-2 font-medium"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Åpne i Google Maps
                    </a>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer className="w-full bg-deep-teal text-white/80 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {/* ---- Column 1: Brand ----------------------------------- */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <img
                  src="/danholmen-logo.png"
                  alt="Danholmen"
                  className="h-14 w-auto brightness-100"
                />
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs mb-4">
                Tett på naturen, Tett på varmen. Din gateway til
                autentiske badstuopplevelser i Tønsberg og Færder.
              </p>
              <p className="text-white/40 text-xs">
                Drives av Vestfold Båt og Utleie AS
              </p>
            </div>

            {/* ---- Column 2: Contact --------------------------------- */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Kontakt
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <span>Danholmen 25, 3128 Nøtterøy</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Mail className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <a
                    href="mailto:booking@danholmen.no"
                    className="hover:text-white transition-colors"
                  >
                    booking@danholmen.no
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Phone className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <a
                    href="tel:+4797120200"
                    className="hover:text-white transition-colors"
                  >
                    971 20 200
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Shield className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <span>Org.nr: 927 033 062</span>
                </li>
              </ul>
            </div>

            {/* ---- Column 3: Quick links ----------------------------- */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Hurtiglenker
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => navigate("/book")}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <CalendarDays className="w-4 h-4" />
                    Book badstue
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/login")}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Contact className="w-4 h-4" />
                    Kontakt oss
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/personvern")}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Personvern
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/vilkar")}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Vilkår
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* ---- Login row for admin & members ---------------------- */}
          <div className="border-t border-white/10 mt-10 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-200 border border-white/10 hover:border-white/20"
              >
                <User className="w-4 h-4" />
                Logg inn
              </button>
              <span className="hidden sm:inline text-white/30">|</span>
              <button
                onClick={() => navigate("/login-medlem")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal/30 hover:bg-teal/40 text-white text-sm font-medium transition-all duration-200 border border-teal/30 hover:border-teal/40"
              >
                <User className="w-4 h-4" />
                Min side
              </button>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="text-white/40 text-xs text-center sm:text-left">
                Er du administrator eller medlem?
              </span>
            </div>
          </div>

          {/* ---- Copyright divider ---------------------------------- */}
          <div className="border-t border-white/10 mt-6 pt-6 text-center">
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} Danholmen Badstuer. Alle rettigheter reservert.
            </p>
          </div>
        </div>
      </footer>
    </div>
   );
}
