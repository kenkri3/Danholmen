import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  Crown,
  HeartHandshake,
  Check,
  ChevronDown,
  Settings,
  Star,
  Zap,
  Gift,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { MobileBottomSheet } from "@/components/ui/MobileBottomSheet";
import { getMembers, saveMember, deleteMember } from "@/data/store";
import type { Member, MemberTier, LocalAssociation } from "@/data/types";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Tier labels, colours, prices  (two tiers only)
// ------------------------------------------------------------------
const tierLabels: Record<MemberTier, string> = {
  danholmen: "Danholmen Medlem",
  vel: "VEL Medlem",
};

const tierColors: Record<MemberTier, string> = {
  danholmen: "bg-[rgba(212,175,55,0.12)] text-[#D4AF37]",
  vel: "bg-[rgba(124,58,237,0.12)] text-vel-member",
};

const tierPrices: Record<MemberTier, number> = {
  danholmen: 349,
  vel: 0,
};

const associationLabels: Record<string, string> = {
  araas: "Arås Båthavn",
  ormelet: "Ormelet Vel",
  medo: "Medø Slipp",
};

const associationDiscounts: Record<string, number> = {
  araas: 0.25,
  ormelet: 0.5,
  medo: 0.5,
};

// ------------------------------------------------------------------
// System Config (local storage based — for tier availability)
// ------------------------------------------------------------------
const SYS_CONFIG_KEY = "danholmen_system_config";

interface SystemConfig {
  availableTiers: MemberTier[];
}

function getSystemConfig(): SystemConfig {
  try {
    const raw = localStorage.getItem(SYS_CONFIG_KEY);
    if (raw) return JSON.parse(raw) as SystemConfig;
  } catch { /* ignore */ }
  // Default: danholmen tier only
  return { availableTiers: ["danholmen"] };
}

function saveSystemConfig(config: SystemConfig): void {
  localStorage.setItem(SYS_CONFIG_KEY, JSON.stringify(config));
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function generateId(): string {
  return `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

// ------------------------------------------------------------------
// Stats Pill
// ------------------------------------------------------------------
function StatPill({
  icon,
  label,
  value,
  colorClass,
  borderClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass?: string;
  borderClass?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center gap-2.5 bg-white border rounded-full px-4 py-2.5 shadow-card",
        borderClass ?? "border-[#DDD6CC]"
      )}
    >
      <span className={cn("flex-shrink-0", colorClass ?? "text-text-secondary")}>
        {icon}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-lg font-bold text-text-primary">{value}</span>
        <span className="text-[11px] text-text-muted">{label}</span>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Tier Selector Button
// ------------------------------------------------------------------
function TierButton({
  tier,
  selected,
  onClick,
}: {
  tier: MemberTier;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200",
        selected
          ? tier === "vel"
            ? "border-vel-member bg-vel-member/5"
            : "border-[#D4AF37] bg-[#D4AF37]/5"
          : "border-[#DDD6CC] bg-white hover:border-[#D4AF37]/30"
      )}
    >
      {tier === "danholmen" && <Crown className="w-5 h-5 text-[#D4AF37]" />}
      {tier === "vel" && <HeartHandshake className="w-5 h-5 text-vel-member" />}
      <span className="text-xs font-semibold text-text-primary">
        {tierLabels[tier]}
      </span>
      {tier === "vel" ? (
        <span className="text-[10px] text-vel-member">Gratis</span>
      ) : (
        <span className="text-[10px] text-text-muted">kr {tierPrices[tier]}/mnd</span>
      )}
      {selected && (
        <span
          className={cn(
            "absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center",
            tier === "vel" ? "bg-vel-member" : "bg-[#D4AF37]"
          )}
        >
          <Check className="w-2.5 h-2.5 text-white" />
        </span>
      )}
    </button>
  );
}

// ------------------------------------------------------------------
// Member Form
// ------------------------------------------------------------------
function MemberForm({
  member,
  availableTiers,
  onSave,
  onCancel,
}: {
  member: Member | null;
  availableTiers: MemberTier[];
  onSave: (member: Member) => void;
  onCancel: () => void;
}) {
  const isEdit = !!member?.id;
  const memberTier = (member?.tier ?? "danholmen") as MemberTier;

  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [password, setPassword] = useState(member?.password ?? "");
  const [tier, setTier] = useState<MemberTier>(memberTier);
  const [localAssociation, setLocalAssociation] = useState<LocalAssociation>(
    member?.localAssociation ?? null
  );
  const [isActive, setIsActive] = useState(member?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subscriptionPrice = tier === "vel" ? 0 : tierPrices[tier];
  const localDiscountRate = localAssociation ? associationDiscounts[localAssociation] : 0;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Fornavn er påkrevd";
    if (!lastName.trim()) errs.lastName = "Etternavn er påkrevd";
    if (!email.trim()) errs.email = "E-post er påkrevd";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Ugyldig e-post";
    if (!phone.trim()) errs.phone = "Telefon er påkrevd";
    if (!isEdit && !password.trim()) errs.password = "Passord er påkrevd";
    if (tier === "vel" && !localAssociation) errs.localAssociation = "Lokal forening er påkrevd for VEL-medlemmer";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: Member = {
      id: member?.id ?? generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: password.trim() || member?.password || "",
      tier: tier as MemberTier,
      localAssociation,
      localDiscountRate,
      isActive,
      subscriptionPrice,
      joinedAt: member?.joinedAt ?? new Date().toISOString().split("T")[0],
      expiresAt: member?.expiresAt ?? "2025-12-31",
      bookingsCount: member?.bookingsCount ?? 0,
      totalSpent: member?.totalSpent ?? 0,
      image: member?.image ?? null,
    };
    onSave(payload);
  };

  // Tier options: vel + available paid tiers
  const allTierOptions: MemberTier[] = ["vel", ...availableTiers];

  return (
    <div className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">
            Fornavn <span className="text-sauna-red">*</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ola"
            className={cn("form-input", errors.firstName && "form-input-error")}
          />
          {errors.firstName && <p className="form-error">{errors.firstName}</p>}
        </div>
        <div>
          <label className="form-label">
            Etternavn <span className="text-sauna-red">*</span>
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nordmann"
            className={cn("form-input", errors.lastName && "form-input-error")}
          />
          {errors.lastName && <p className="form-error">{errors.lastName}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="form-label">
          E-post <span className="text-sauna-red">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ola@example.com"
          className={cn("form-input", errors.email && "form-input-error")}
        />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="form-label">
          Telefon <span className="text-sauna-red">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+47 912 34 567"
          className={cn("form-input", errors.phone && "form-input-error")}
        />
        {errors.phone && <p className="form-error">{errors.phone}</p>}
      </div>

      {/* Password (only for new members) */}
      {!isEdit && (
        <div>
          <label className="form-label">
            Passord <span className="text-sauna-red">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className={cn("form-input", errors.password && "form-input-error")}
          />
          {errors.password && <p className="form-error">{errors.password}</p>}
        </div>
      )}

      {/* Tier selector — 2 options: Danholmen + Vel */}
      <div>
        <label className="form-label">
          Medlemsnivå <span className="text-sauna-red">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {allTierOptions.map((t) => (
            <TierButton
              key={t}
              tier={t}
              selected={tier === t}
              onClick={() => setTier(t)}
            />
          ))}
        </div>
        {tier === "vel" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 rounded-xl border border-vel-member/30 bg-vel-member/5 p-3 space-y-2"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[rgba(124,58,237,0.12)] text-vel-member">
              <HeartHandshake className="w-3 h-3" />
              VEL-medlem (gratis)
            </span>
            <p className="text-[11px] text-text-muted leading-relaxed">
              VEL-medlemmer betaler ikke månedspris. Lokal forening er påkrevd. Rabatter gjelder fortsatt.
            </p>
          </motion.div>
        )}
        {tier === "danholmen" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3 space-y-2"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[rgba(212,175,55,0.12)] text-[#D4AF37]">
              <Crown className="w-3 h-3" />
              Danholmen Medlem — 349 kr/mnd
            </span>
            <ul className="text-[11px] text-text-muted leading-relaxed space-y-1">
              <li className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#D4AF37]" />Gjelder ALLE 3 badstuer</li>
              <li className="flex items-center gap-1"><Star className="w-3 h-3 text-[#D4AF37]" />Ubegrenset gratis fellesøkter</li>
              <li className="flex items-center gap-1"><Gift className="w-3 h-3 text-[#D4AF37]" />40% rabatt på privatleie</li>
              <li className="flex items-center gap-1"><UserPlus className="w-3 h-3 text-[#D4AF37]" />1 gratis gjestepass/mnd til fellesøkter</li>
            </ul>
          </motion.div>
        )}
      </div>

      {/* Local Association */}
      <div>
        <label className="form-label">
          Lokal forening{tier === "vel" && <span className="text-sauna-red"> *</span>}
        </label>
        <select
          value={localAssociation ?? ""}
          onChange={(e) => {
            const val = e.target.value || null;
            setLocalAssociation(val as LocalAssociation);
          }}
          className={cn("form-input", errors.localAssociation && "form-input-error")}
        >
          <option value="">Ingen</option>
          <option value="araas">Arås Båthavn (25% rabatt)</option>
          <option value="ormelet">Ormelet Vel (50% rabatt)</option>
          <option value="medo">Medø Slipp (50% rabatt)</option>
        </select>
        {errors.localAssociation && <p className="form-error">{errors.localAssociation}</p>}
      </div>

      {/* Price preview */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-text-muted">Månedspris:</span>
        {tier === "vel" ? (
          <span className="font-mono text-sm font-bold text-vel-member">Gratis</span>
        ) : (
          <span className="font-mono text-sm font-semibold text-text-primary">
            kr {subscriptionPrice}
          </span>
        )}
      </div>

      {/* Status toggle (edit only) */}
      {isEdit && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Aktiv status</span>
          <button
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5",
              isActive ? "bg-success" : "bg-text-muted"
            )}
          >
            <motion.div
              animate={{ x: isActive ? 20 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} className="btn-primary flex-1">
          {isEdit ? "Lagre endringer" : "Opprett medlem"}
        </button>
        <button onClick={onCancel} className="btn-ghost">
          Avbryt
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Delete Confirmation Modal
// ------------------------------------------------------------------
function DeleteConfirmModal({
  member,
  isOpen,
  onClose,
  onConfirm,
}: {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sauna-red/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-sauna-red" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Slett medlem</h3>
                <p className="text-xs text-text-secondary">
                  {member?.firstName} {member?.lastName}
                </p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Er du sikker på at du vil slette dette medlemmet? Denne handlingen kan ikke angres.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="btn-ghost flex-1">
                Avbryt
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="btn-danger flex-1"
              >
                Slett
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ------------------------------------------------------------------
// Danholmen Membership Info Card
// ------------------------------------------------------------------
function DanholmenInfoCard() {
  return (
    <div className="mt-6 bg-white rounded-2xl border border-[#D4AF37]/30 shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-[#D4AF37]" />
        <h2 className="font-display text-base font-semibold text-text-primary">
          Danholmen Medlem — 349 kr/mnd
        </h2>
      </div>
      <p className="text-xs text-text-muted mb-4">
        Ét medlemsnivå som gjelder for ALLE 3 badstuer. Ingen grunnleggende/premium/platinum-nivåer.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
          <Star className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">Ubegrenset fellesøkter</p>
            <p className="text-[11px] text-text-muted">Gratis tilgang til alle fellesøkter</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
          <Gift className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">40% rabatt på privatleie</p>
            <p className="text-[11px] text-text-muted">Gjelder alle 3 badstuer</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
          <UserPlus className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">1 gratis gjestepass/mnd</p>
            <p className="text-[11px] text-text-muted">Til fellesøkter</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
          <Zap className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary">Alle 3 badstuer</p>
            <p className="text-[11px] text-text-muted">Arås, Ormelet & Medø Slipp</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// System Config Section
// ------------------------------------------------------------------
function TierConfigSection({
  config,
  onChange,
}: {
  config: SystemConfig;
  onChange: (config: SystemConfig) => void;
}) {
  // Only one paid tier now: danholmen
  const paidTiers: MemberTier[] = ["danholmen"];

  const toggleTier = (tier: MemberTier) => {
    const current = config.availableTiers;
    const isActive = current.includes(tier);

    // Prevent turning off the only paid tier
    if (isActive) {
      return; // Cannot turn off danholmen — it's the only tier
    }

    const next = isActive
      ? current.filter((t) => t !== tier)
      : [...current, tier];
    onChange({ ...config, availableTiers: next });
  };

  return (
    <div className="mt-8 bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Settings className="w-4 h-4 text-text-secondary" />
        <h2 className="font-display text-base font-semibold text-text-primary">
          Medlemsnivåer — Hva tilbys
        </h2>
      </div>
      <p className="text-xs text-text-muted mb-4">
        Danholmen Medlem (349 kr/mnd) er det eneste betalte medlemsnivået. VEL-medlemskap er alltid tilgjengelig for lokale foreningsmedlemmer.
      </p>
      <div className="space-y-3">
        {paidTiers.map((tier) => {
          const isActive = config.availableTiers.includes(tier);
          return (
            <div
              key={tier}
              className="flex items-center justify-between py-2 border-b border-[#DDD6CC] last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                <span className="text-sm font-medium text-text-primary">
                  {tierLabels[tier]}
                </span>
                <span className="text-xs text-text-muted">
                  kr {tierPrices[tier]}/mnd
                </span>
              </div>
              <button
                onClick={() => toggleTier(tier)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5",
                  isActive ? "bg-[#D4AF37]" : "bg-text-muted"
                )}
                title={isActive ? "Deaktiver" : "Aktiver"}
              >
                <motion.div
                  animate={{ x: isActive ? 20 : 0 }}
                  transition={{ duration: 0.2, type: "spring", stiffness: 500, damping: 30 }}
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main Members Page
// ------------------------------------------------------------------
export default function Members() {
  const [members, setMembers] = useState<Member[]>(() => getMembers());
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<MemberTier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [sysConfig, setSysConfig] = useState<SystemConfig>(() => getSystemConfig());

  const refresh = () => setMembers(getMembers());

  // Stats — 3 counts: Total, Danholmen, Vel
  const stats = useMemo(() => {
    return {
      total: members.length,
      danholmen: members.filter((m) => m.tier === "danholmen").length,
      vel: members.filter((m) => m.tier === "vel").length,
    };
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone.includes(q)
      );
    }

    if (tierFilter !== "all") {
      result = result.filter((m) => m.tier === tierFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((m) =>
        statusFilter === "active" ? m.isActive : !m.isActive
      );
    }

    return result;
  }, [members, searchQuery, tierFilter, statusFilter]);

  const handleAdd = () => {
    setEditingMember(null);
    setModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  const handleSave = (member: Member) => {
    saveMember(member);
    refresh();
    setModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteClick = (member: Member) => {
    setDeleteTarget(member);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMember(deleteTarget.id);
      refresh();
      setDeleteTarget(null);
    }
  };

  const handleConfigChange = (config: SystemConfig) => {
    setSysConfig(config);
    saveSystemConfig(config);
  };

  // DataTable columns
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Medlem",
        render: (row: Member) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {getInitials(row.firstName, row.lastName)}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {row.firstName} {row.lastName}
              </p>
              <p className="text-[11px] text-text-muted">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        key: "tier",
        header: "Nivå",
        render: (row: Member) => {
          const t = row.tier as MemberTier;
          return (
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold",
                tierColors[t]
              )}
            >
              {tierLabels[t]}
              {t === "vel" && (
                <span className="ml-1 text-[10px] opacity-80">(Gratis)</span>
              )}
            </span>
          );
        },
      },
      {
        key: "localAssociation",
        header: "Forening",
        render: (row: Member) =>
          row.localAssociation ? (
            <span
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium",
                row.localAssociation === "araas"
                  ? "bg-teal/10 text-teal"
                  : row.localAssociation === "ormelet"
                    ? "bg-brand-pink/10 text-brand-pink"
                    : "bg-blue-50 text-blue-600"
              )}
            >
              {associationLabels[row.localAssociation]} ({Math.round(row.localDiscountRate * 100)}%)
            </span>
          ) : (
            <span className="text-text-muted text-xs">—</span>
          ),
      },
      {
        key: "subscriptionPrice",
        header: "Pris/mnd",
        render: (row: Member) => {
          const t = row.tier as MemberTier;
          return t === "vel" ? (
            <span className="font-mono text-xs font-bold text-vel-member">Gratis</span>
          ) : (
            <span className="font-mono text-xs font-semibold text-text-primary">
              kr {row.subscriptionPrice}
            </span>
          );
        },
      },
      {
        key: "bookingsCount",
        header: "Bookinger",
        render: (row: Member) => (
          <span className="font-mono text-xs text-text-primary">{row.bookingsCount}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row: Member) => (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                row.isActive ? "bg-success" : "bg-sauna-red"
              )}
            />
            <span className={cn("text-xs", row.isActive ? "text-success" : "text-sauna-red")}>
              {row.isActive ? "Aktiv" : "Inaktiv"}
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-[80px]",
        render: (row: Member) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              className="p-1.5 rounded-md text-text-muted hover:text-teal hover:bg-cream transition-colors touch-target"
              title="Rediger"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row);
              }}
              className="p-1.5 rounded-md text-text-muted hover:text-sauna-red hover:bg-sauna-red/10 transition-colors touch-target"
              title="Slett"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Medlemmer"
        description="Medlemshåndtering og medlemsnivåer"
        action={
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nytt Medlem</span>
            <span className="sm:hidden">Ny</span>
          </button>
        }
      />

      {/* Stats Row — 3 counts: Total, Danholmen, Vel */}
      <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
        <StatPill icon={<Users className="w-4 h-4" />} label="medlemmer" value={stats.total} />
        <StatPill
          icon={<Crown className="w-4 h-4" />}
          label="Danholmen"
          value={stats.danholmen}
          colorClass="text-[#D4AF37]"
        />
        <StatPill
          icon={<HeartHandshake className="w-4 h-4" />}
          label="VEL"
          value={stats.vel}
          colorClass="text-vel-member"
          borderClass="border-vel-member/30"
        />
      </div>

      {/* Danholmen Medlem Info Card */}
      <DanholmenInfoCard />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4 mb-6 space-y-4">
        {/* Search + Tier filter row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søk etter navn, e-post eller telefon..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDD6CC] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Tier filter dropdown */}
            <div className="relative">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as MemberTier | "all")}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[#DDD6CC] text-sm text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal cursor-pointer"
              >
                <option value="all">Alle nivåer</option>
                <option value="danholmen">Danholmen Medlem</option>
                <option value="vel">VEL-medlem</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
            {/* Status filter dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[#DDD6CC] text-sm text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal cursor-pointer"
              >
                <option value="all">Alle status</option>
                <option value="active">Aktive</option>
                <option value="inactive">Inaktive</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Members Table — Desktop */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredMembers}
          keyExtractor={(row) => row.id}
          emptyMessage={
            searchQuery || tierFilter !== "all" || statusFilter !== "all"
              ? "Ingen medlemmer matcher søket"
              : "Ingen medlemmer ennå"
          }
          pageSize={10}
        />
      </div>

      {/* Members Cards — Mobile */}
      <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">
              {searchQuery || tierFilter !== "all" || statusFilter !== "all"
                ? "Ingen medlemmer matcher søket"
                : "Ingen medlemmer ennå"}
            </p>
          </div>
        ) : (
          filteredMembers.map((m) => {
            const tierBadgeClass = cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold",
              tierColors[m.tier as MemberTier]
            );
            const associationBadgeClass = cn(
              "inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium",
              m.localAssociation === "araas"
                ? "bg-teal/10 text-teal"
                : m.localAssociation === "ormelet"
                  ? "bg-brand-pink/10 text-brand-pink"
                  : m.localAssociation === "medo"
                    ? "bg-blue-50 text-blue-600"
                    : ""
            );
            return (
              <div key={m.id} className="bg-white rounded-xl border border-[#DDD6CC] p-4 space-y-3">
                {/* Name row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-sm font-bold text-teal shrink-0">
                    {getInitials(m.firstName, m.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary text-base truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-sm text-text-muted truncate">{m.email}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(m)}
                      className="p-2 text-text-muted hover:text-teal"
                      title="Rediger"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(m)}
                      className="p-2 text-text-muted hover:text-sauna-red"
                      title="Slett"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Tier + association */}
                <div className="flex flex-wrap gap-2">
                  <span className={tierBadgeClass}>
                    {tierLabels[m.tier as MemberTier]}
                    {m.tier === "vel" && (
                      <span className="ml-1 text-[10px] opacity-80">(Gratis)</span>
                    )}
                  </span>
                  {m.localAssociation && (
                    <span className={associationBadgeClass}>
                      {associationLabels[m.localAssociation]} ({Math.round(m.localDiscountRate * 100)}%)
                    </span>
                  )}
                </div>
                {/* Info row */}
                <div className="flex items-center justify-between text-sm">
                  {m.tier === "vel" ? (
                    <span className="font-mono text-xs font-bold text-vel-member">Gratis</span>
                  ) : (
                    <span className="text-text-muted">kr {m.subscriptionPrice}/mnd</span>
                  )}
                  <span className="text-text-muted">{m.bookingsCount} bookinger</span>
                  <span className={m.isActive ? "text-success" : "text-text-muted"}>
                    {m.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal (desktop) */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 glass-overlay hidden md:flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-text-primary">
                  {editingMember ? "Rediger medlem" : "Nytt medlem"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-off-white transition-colors touch-target"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <MemberForm
                member={editingMember}
                availableTiers={sysConfig.availableTiers}
                onSave={handleSave}
                onCancel={() => setModalOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Bottom Sheet (mobile) */}
      <MobileBottomSheet
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? "Rediger medlem" : "Nytt medlem"}
      >
        <MemberForm
          member={editingMember}
          availableTiers={sysConfig.availableTiers}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </MobileBottomSheet>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        member={deleteTarget}
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* System Config Section — Tier Availability */}
      <TierConfigSection config={sysConfig} onChange={handleConfigChange} />
    </motion.div>
  );
}
