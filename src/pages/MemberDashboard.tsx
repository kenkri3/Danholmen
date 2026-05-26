import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  CalendarDays,
  Tag,
  LogOut,
  Loader2,
  Check,
  X,
  MapPin,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  getCurrentMember,
  clearCurrentMember,
  getMemberBookings,
  getSaunas,
} from "@/data/store";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Member, Booking, Sauna } from "@/data/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function saunaMatchesAssociation(sauna: Sauna, association: string): boolean {
  const n = sauna.name.toLowerCase();
  const l = sauna.location.toLowerCase();
  const a = association.toLowerCase();

  if (a === "araas") {
    return n.includes("årås") || n.includes("araas") || l.includes("årås") || l.includes("araas");
  }
  if (a === "ormelet") {
    return n.includes("ormelet") || l.includes("ormelet");
  }
  if (a === "medo") {
    return n.includes("medø") || n.includes("medo") || l.includes("medø") || l.includes("medo");
  }
  return n.includes(a) || l.includes(a);
}

function getDiscountedPrice(basePrice: number, discountRate: number): number {
  return Math.round(basePrice * (1 - discountRate));
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const current = getCurrentMember();
    if (current) {
      setMember(current);
      setBookings(getMemberBookings(current.id));
      setSaunas(getSaunas());
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    clearCurrentMember();
    navigate("/book");
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-off-white">
        <Loader2 className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-off-white">
        <PublicHeader />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <User className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
              Ingen tilgang
            </h1>
            <p className="text-text-secondary mb-6">
              Du må logge inn for å se din medlemsside.
            </p>
            <button onClick={() => navigate("/book")} className="btn-primary">
              Gå til booking
            </button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  /* ----- sauna access helpers ----- */
  const isVel = member.tier === "vel";
  const isPaid = member.tier === "danholmen";

  const matchingSauna = isVel
    ? saunas.find((s) =>
        member.localAssociation
          ? saunaMatchesAssociation(s, member.localAssociation)
          : false
      )
    : undefined;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-off-white">
      <PublicHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 md:px-6 py-8 w-full">
        {/* Member header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  {member.firstName.charAt(0)}
                  {member.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="font-display text-xl md:text-2xl font-bold text-text-primary">
                  Hei, {member.firstName}!
                </h1>
                <p className="text-sm text-text-secondary">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.tier === "vel" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-[rgba(124,58,237,0.12)] text-vel-member">
                  Vel-medlem (gratis)
                </span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-text-secondary hover:text-sauna-red text-sm px-3 py-2 rounded-lg hover:bg-sauna-red/5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logg ut
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4">
            <CalendarDays className="w-5 h-5 text-teal mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {bookings.length}
            </p>
            <p className="text-xs text-text-secondary">Bookinger</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4">
            <Tag className="w-5 h-5 text-warm-amber mb-2" />
            <p className="text-2xl font-bold text-text-primary">
              {member.localDiscountRate > 0
                ? `${Math.round(member.localDiscountRate * 100)}%`
                : "—"}
            </p>
            <p className="text-xs text-text-secondary">Lokal rabatt</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Medlemsnivå
            </p>
            <p className="text-sm font-semibold text-text-primary">
              {member.tier === "vel" ? "VEL Medlem" : "Danholmen Medlem"}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">
              Totalt brukt
            </p>
            <p className="text-lg font-bold text-text-primary">
              {member.totalSpent.toLocaleString("no-NO")} kr
            </p>
          </div>
        </motion.div>

        {/* ========== DINE BADSTUER ========== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">
            Dine badstuer
          </h2>

          {/* Vel-member info banner */}
          {isVel && matchingSauna && (
            <div className="bg-vel-member/8 border border-vel-member/20 rounded-xl p-4 mb-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-vel-member flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                Som VEL-medlem i{" "}
                <span className="font-medium text-text-primary">
                  {member.localAssociation === "araas"
                    ? "Arås Båthavn"
                    : member.localAssociation === "ormelet"
                      ? "Ormelet Vel"
                      : member.localAssociation === "medo"
                        ? "Medø Slipp"
                        : member.localAssociation}
                </span>{" "}
                gjelder rabatten din kun for{" "}
                <span className="font-medium text-text-primary">
                  {matchingSauna.name}
                </span>
                . På andre badstuer betaler du full pris.
              </p>
            </div>
          )}

          {isVel && !matchingSauna && member.localAssociation && (
            <div className="bg-sauna-red/8 border border-sauna-red/20 rounded-xl p-4 mb-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-sauna-red flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                Vi fant ingen badstue knyttet til{" "}
                <span className="font-medium">
                  {member.localAssociation}
                </span>
                . Rabatten gjelder ikke for øyeblikket.
              </p>
            </div>
          )}

          {/* Sauna cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saunas.map((sauna) => {
              /* ---- determine access ---- */
              let hasDiscount = false;
              let badgeLabel = "";
              let badgeColor: "green" | "red" | "gray" = "gray";

              if (isVel) {
                if (
                  member.localAssociation &&
                  saunaMatchesAssociation(sauna, member.localAssociation)
                ) {
                  hasDiscount = true;
                  badgeLabel = "Rabatt gjelder";
                  badgeColor = "green";
                } else {
                  hasDiscount = false;
                  badgeLabel = "Ikke inkludert";
                  badgeColor = "red";
                }
              } else if (isPaid) {
                // Paid members get discount on all saunas (all saunas in the
                // system offer membership benefits by virtue of being listed)
                hasDiscount = true;
                badgeLabel = "Medlemsfordeler";
                badgeColor = "green";
              }

              const discountRate = hasDiscount ? member.localDiscountRate : 0;
              const privPrice = getDiscountedPrice(
                sauna.privatePrice,
                discountRate
              );
              const fellesPrice = getDiscountedPrice(
                sauna.fellesPrice,
                discountRate
              );

              return (
                <motion.div
                  key={sauna.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden"
                >
                  <div className="p-4">
                    {/* Top row: image + info */}
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={sauna.image}
                        alt={sauna.name}
                        className="w-[60px] h-[60px] rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {sauna.name}
                        </h3>
                        <div className="flex items-center gap-1 text-text-secondary mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="text-xs truncate">
                            {sauna.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="mb-3">
                      {badgeColor === "green" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#3A9E6F]/10 text-[#3A9E6F]">
                          <Check className="w-3 h-3" />
                          {badgeLabel}
                        </span>
                      )}
                      {badgeColor === "red" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#C44B6B]/10 text-[#C44B6B]">
                          <X className="w-3 h-3" />
                          {badgeLabel}
                        </span>
                      )}
                      {badgeColor === "gray" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-text-muted">
                          {badgeLabel}
                        </span>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-0.5">
                        <p className="text-xs text-text-muted">
                          Privat:{" "}
                          <span className="font-semibold text-text-primary">
                            {privPrice} kr
                          </span>
                          {discountRate > 0 && (
                            <span className="text-[10px] text-text-muted line-through ml-1">
                              {sauna.privatePrice} kr
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted">
                          Felles:{" "}
                          <span className="font-semibold text-text-primary">
                            {fellesPrice} kr
                          </span>
                          {discountRate > 0 && (
                            <span className="text-[10px] text-text-muted line-through ml-1">
                              {sauna.fellesPrice} kr
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Book button */}
                    <button
                      onClick={() => navigate(`/book/${sauna.publicSlug}`)}
                      className="w-full flex items-center justify-center gap-1.5 bg-warm-amber hover:bg-amber-light text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-amber-btn hover:shadow-amber-btn-hover transition-all duration-200"
                    >
                      Book her
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bookings list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">
            Mine bookinger
          </h2>

          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-8 text-center">
              <CalendarDays className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">
                Du har ingen bookinger ennå.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking, idx) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="bg-white rounded-xl border border-[#DDD6CC] shadow-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-off-white flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-xs font-semibold text-text-primary">
                        {booking.date.slice(5).replace("-", "/")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {booking.startTime}–{booking.endTime}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {booking.type === "private"
                          ? "Privat booking"
                          : booking.type === "felles"
                            ? "Felles badstue"
                            : "Intern booking"}
                        {booking.participantCount > 0 &&
                          ` · ${booking.participantCount} pers`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">
                      {booking.totalPrice > 0
                        ? `${booking.totalPrice} kr`
                        : "Gratis"}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <PublicFooter />
    </div>
  );
}
