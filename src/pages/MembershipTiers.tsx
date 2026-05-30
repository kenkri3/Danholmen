import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  getMembershipTiers,
  saveMembershipTier,
  deleteMembershipTier,
} from "@/data/store";
import type { MembershipTierConfig } from "@/data/types";

const ACCENT_COLORS = [
  { value: "brand-pink", label: "Rosa", hex: "#EE4C84" },
  { value: "teal", label: "Teal", hex: "#2A6B6B" },
  { value: "deep-teal", label: "Dyp teal", hex: "#0B3D4C" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function generateId() {
  return `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const emptyTier = (): MembershipTierConfig => ({
  id: generateId(),
  name: "",
  subtitle: "",
  description: "",
  price: 0,
  periodLabel: "måned",
  benefits: [""],
  accentColor: "brand-pink",
  badge: "",
  ctaText: "Bli medlem",
  isActive: true,
  order: 0,
});

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function MembershipTiers() {
  const [tiers, setTiers] = useState<MembershipTierConfig[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<MembershipTierConfig | null>(null);
  const [form, setForm] = useState<MembershipTierConfig>(emptyTier());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteModal, setDeleteModal] = useState<MembershipTierConfig | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadTiers = useCallback(() => {
    setTiers(getMembershipTiers());
  }, []);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  /* ---- Toast ---- */
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* ---- Form helpers ---- */
  const openCreate = () => {
    const maxOrder = tiers.length > 0 ? Math.max(...tiers.map((t) => t.order)) : -1;
    setForm({ ...emptyTier(), order: maxOrder + 1 });
    setEditingTier(null);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (tier: MembershipTierConfig) => {
    setForm({ ...tier });
    setEditingTier(tier);
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTier(null);
    setErrors({});
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Navn er påkrevd";
    if (!form.description.trim()) e.description = "Beskrivelse er påkrevd";
    if (form.price < 0) e.price = "Pris kan ikke være negativ";
    if (!form.periodLabel.trim()) e.periodLabel = "Periode er påkrevd";
    if (!form.ctaText.trim()) e.ctaText = "Knappetekst er påkrevd";
    const validBenefits = form.benefits.filter((b) => b.trim() !== "");
    if (validBenefits.length === 0) e.benefits = "Minst én fordel er påkrevd";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    // Filter out empty benefits before saving
    const cleaned = {
      ...form,
      benefits: form.benefits.filter((b) => b.trim() !== ""),
      badge: form.badge?.trim() || undefined,
      subtitle: form.subtitle?.trim() || undefined,
    };
    saveMembershipTier(cleaned);
    loadTiers();
    closeModal();
    showToast(editingTier ? "Medlemsnivå oppdatert" : "Medlemsnivå opprettet");
  };

  const handleDelete = (tier: MembershipTierConfig) => {
    setDeleteModal(tier);
  };

  const confirmDelete = () => {
    if (deleteModal) {
      deleteMembershipTier(deleteModal.id);
      loadTiers();
      setDeleteModal(null);
      showToast("Medlemsnivå slettet");
    }
  };

  const moveTier = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === tiers.length - 1) return;
    const newTiers = [...tiers];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    const tempOrder = newTiers[index].order;
    newTiers[index].order = newTiers[swapIdx].order;
    newTiers[swapIdx].order = tempOrder;
    // Save all reordered tiers
    newTiers.forEach((t) => saveMembershipTier(t));
    loadTiers();
  };

  const toggleActive = (tier: MembershipTierConfig) => {
    const updated = { ...tier, isActive: !tier.isActive };
    saveMembershipTier(updated);
    loadTiers();
    showToast(updated.isActive ? "Medlemsnivå aktivert" : "Medlemsnivå deaktivert");
  };

  /* ---- Form field updaters ---- */
  const updateField = <K extends keyof MembershipTierConfig>(
    field: K,
    value: MembershipTierConfig[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const addBenefit = () => {
    setForm((prev) => ({ ...prev, benefits: [...prev.benefits, ""] }));
  };

  const updateBenefit = (index: number, value: string) => {
    setForm((prev) => {
      const newBenefits = [...prev.benefits];
      newBenefits[index] = value;
      return { ...prev, benefits: newBenefits };
    });
  };

  const removeBenefit = (index: number) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Medlemsnivåer"
        description="Administrer medlemsnivåer som vises på landingssiden"
        action={
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nytt nivå
          </button>
        }
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-deep-teal text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-sm">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-5 md:p-6"
      >
        {tiers.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-secondary font-medium mb-1">
              Ingen medlemsnivåer ennå
            </p>
            <p className="text-text-muted text-sm mb-4">
              Opprett ditt første medlemsnivå for å komme i gang
            </p>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-1" /> Opprett nivå
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tiers.map((tier, index) => {
              const colorOpt = ACCENT_COLORS.find(
                (c) => c.value === tier.accentColor
              );
              return (
                <div
                  key={tier.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    tier.isActive
                      ? "border-[#DDD6CC] bg-white"
                      : "border-[#DDD6CC]/50 bg-[#F5F0EA]/50 opacity-60"
                  }`}
                >
                  {/* Order indicator */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: colorOpt?.hex ?? "#EE4C84" }}
                  >
                    {tier.order + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary text-sm">
                        {tier.name}
                      </span>
                      {tier.badge && (
                        <span
                          className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{
                            backgroundColor: colorOpt?.hex ?? "#EE4C84",
                          }}
                        >
                          {tier.badge}
                        </span>
                      )}
                      {!tier.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/20 text-text-muted uppercase tracking-wide">
                          Inaktiv
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5 truncate">
                      {tier.price} kr/{tier.periodLabel} · {tier.benefits.length}{" "}
                      {tier.benefits.length === 1 ? "fordel" : "fordeler"} ·{" "}
                      {tier.ctaText}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Order arrows */}
                    <button
                      onClick={() => moveTier(index, "up")}
                      disabled={index === 0}
                      className="btn-ghost p-1.5 disabled:opacity-30"
                      title="Flytt opp"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveTier(index, "down")}
                      disabled={index === tiers.length - 1}
                      className="btn-ghost p-1.5 disabled:opacity-30"
                      title="Flytt ned"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-[#DDD6CC] mx-1" />
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(tier)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        tier.isActive ? "bg-teal" : "bg-[#DDD6CC]"
                      }`}
                      title={tier.isActive ? "Deaktiver" : "Aktiver"}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                          tier.isActive ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <div className="w-px h-5 bg-[#DDD6CC] mx-1" />
                    {/* Edit/Delete */}
                    <button
                      onClick={() => openEdit(tier)}
                      className="btn-ghost p-1.5"
                      title="Rediger"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tier)}
                      className="btn-ghost p-1.5 text-red-400 hover:text-red-500"
                      title="Slett"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ======== Create/Edit Modal ======== */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#DDD6CC]">
                <h2 className="font-display text-lg font-bold text-text-primary">
                  {editingTier ? "Rediger medlemsnivå" : "Nytt medlemsnivå"}
                </h2>
                <button onClick={closeModal} className="btn-ghost p-1.5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
                    Navn <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="f.eks. Basis"
                    className={`form-input w-full ${errors.name ? "border-red-400" : ""}`}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
                    Undertittel
                  </label>
                  <input
                    type="text"
                    value={form.subtitle ?? ""}
                    onChange={(e) => updateField("subtitle", e.target.value)}
                    placeholder="f.eks. Best for deg som starter opp"
                    className="form-input w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
                    Beskrivelse <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Kort beskrivelse av medlemsnivået"
                    rows={2}
                    className={`form-input w-full ${errors.description ? "border-red-400" : ""}`}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Price + Period row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
                      Pris (kr) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) =>
                        updateField("price", Number(e.target.value))
                      }
                      min={0}
                      className={`form-input w-full ${errors.price ? "border-red-400" : ""}`}
                    />
                    {errors.price && (
                      <p className="text-red-400 text-xs mt-1">{errors.price}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
                      Periode <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.periodLabel}
                      onChange={(e) =>
                        updateField("periodLabel", e.target.value)
                      }
                      placeholder="måned / år"
                      className={`form-input w-full ${errors.periodLabel ? "border-red-400" : ""}`}
                    />
                    {errors.periodLabel && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.periodLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-2">
                    Farge
                  </label>
                  <div className="flex gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => updateField("accentColor", color.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          form.accentColor === color.value
                            ? "border-teal bg-[rgba(26,107,124,0.04)]"
                            : "border-[#DDD6CC] hover:border-teal-light/50"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-sm text-text-primary">
                          {color.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
                    Badge
                  </label>
                  <input
                    type="text"
                    value={form.badge ?? ""}
                    onChange={(e) => updateField("badge", e.target.value)}
                    placeholder="f.eks. Mest populær"
                    className="form-input w-full"
                  />
                </div>

                {/* CTA Text */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-1.5">
                    Knappetekst <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) => updateField("ctaText", e.target.value)}
                    placeholder="f.eks. Bli medlem"
                    className={`form-input w-full ${errors.ctaText ? "border-red-400" : ""}`}
                  />
                  {errors.ctaText && (
                    <p className="text-red-400 text-xs mt-1">{errors.ctaText}</p>
                  )}
                </div>

                {/* Benefits */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-[0.06em] text-text-secondary mb-2">
                    Fordeler <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    {form.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) =>
                            updateBenefit(index, e.target.value)
                          }
                          placeholder={`Fordel ${index + 1}`}
                          className="form-input flex-1"
                        />
                        {form.benefits.length > 1 && (
                          <button
                            onClick={() => removeBenefit(index)}
                            className="btn-ghost p-2 text-red-400 hover:text-red-500"
                            title="Fjern fordel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.benefits && (
                    <p className="text-red-400 text-xs mt-1">{errors.benefits}</p>
                  )}
                  <button
                    onClick={addBenefit}
                    className="btn-ghost text-sm mt-2 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Legg til fordel
                  </button>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => updateField("isActive", !form.isActive)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      form.isActive ? "bg-teal" : "bg-[#DDD6CC]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
                        form.isActive ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-text-primary">
                    {form.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-[#DDD6CC]">
                <button onClick={closeModal} className="btn-ghost">
                  Avbryt
                </button>
                <button onClick={handleSave} className="btn-primary">
                  {editingTier ? "Lagre endringer" : "Opprett nivå"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======== Delete Confirmation Modal ======== */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setDeleteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-text-primary">
                    Slett medlemsnivå
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Er du sikker på at du vil slette{" "}
                    <strong>{deleteModal.name}</strong>?
                  </p>
                </div>
              </div>
              <p className="text-xs text-text-muted mb-6">
                Denne handlingen kan ikke angres. Medlemsnivået vil fjernes
                permanent fra systemet.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="btn-ghost"
                >
                  Avbryt
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" /> Slett
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
