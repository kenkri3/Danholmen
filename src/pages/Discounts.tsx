import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Tag,
  TrendingUp,
  Banknote,
  Check,
  Copy,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { MobileBottomSheet } from "@/components/ui/MobileBottomSheet";
import { getDiscountCodes, saveDiscount, deleteDiscount } from "@/data/store";
import type { DiscountCode, DiscountType, AppliesTo } from "@/data/types";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const typeLabels: Record<DiscountType, string> = {
  percentage: "Prosent",
  fixed_amount: "Fast beløp",
};

const typeColors: Record<DiscountType, string> = {
  percentage: "bg-teal/10 text-teal",
  fixed_amount: "bg-warm-amber/10 text-warm-amber",
};

const appliesToLabels: Record<AppliesTo, string> = {
  all: "Alle",
  private: "Privat",
  felles: "Felles",
};

const appliesToColors: Record<AppliesTo, string> = {
  all: "bg-text-secondary/10 text-text-secondary",
  private: "bg-warm-amber/10 text-warm-amber",
  felles: "bg-teal/10 text-teal",
};

function generateId(): string {
  return `discount-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("no-NO", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function isExpiringSoon(validUntil: string): boolean {
  const until = new Date(validUntil);
  const now = new Date();
  const diff = until.getTime() - now.getTime();
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000; // 7 days
}

function isExpired(validUntil: string): boolean {
  return new Date(validUntil) < new Date();
}

// ------------------------------------------------------------------
// Stats Card
// ------------------------------------------------------------------
function StatCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card-base p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className={cn("font-mono text-xl font-bold", valueColor ?? "text-text-primary")}>
          {value}
        </p>
        <p className="text-[11px] text-text-muted">{label}</p>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------------
// Discount Form
// ------------------------------------------------------------------
function DiscountForm({
  discount,
  onSave,
  onCancel,
}: {
  discount: DiscountCode | null;
  onSave: (discount: DiscountCode) => void;
  onCancel: () => void;
}) {
  const isEdit = !!discount?.id;
  const [code, setCode] = useState(discount?.code ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(discount?.discountType ?? "percentage");
  const [discountValue, setDiscountValue] = useState<number>(discount?.discountValue ?? 20);
  const [appliesTo, setAppliesTo] = useState<AppliesTo>(discount?.appliesTo ?? "all");
  const [validFrom, setValidFrom] = useState(discount?.validFrom ?? new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(discount?.validUntil ?? "");
  const [noExpiry, setNoExpiry] = useState(!discount?.validUntil);
  const [usageLimit, setUsageLimit] = useState<string>(
    discount?.usageLimit?.toString() ?? ""
  );
  const [isActive, setIsActive] = useState(discount?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerateCode = () => {
    setCode(generateRandomCode());
    if (errors.code) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.code;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Rabattkode er påkrevd";
    if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
      errs.value = "Prosent må være mellom 1 og 100";
    }
    if (discountType === "fixed_amount" && discountValue <= 0) {
      errs.value = "Beløp må være større enn 0";
    }
    if (!validFrom) errs.validFrom = "Gyldig fra-dato er påkrevd";
    if (!noExpiry && !validUntil) errs.validUntil = "Gyldig til-dato er påkrevd";
    if (!noExpiry && validFrom && validUntil && validFrom > validUntil) {
      errs.dates = "Fra-dato må være før til-dato";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const limit = usageLimit.trim() ? parseInt(usageLimit, 10) : null;
    const payload: DiscountCode = {
      id: discount?.id ?? generateId(),
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      appliesTo,
      validFrom,
      validUntil: noExpiry ? "" : validUntil,
      usageLimit: limit,
      usageCount: discount?.usageCount ?? 0,
      isActive,
      createdBy: discount?.createdBy ?? "admin-1",
      createdAt: discount?.createdAt ?? new Date().toISOString(),
    };
    onSave(payload);
  };

  return (
    <div className="space-y-5">
      {/* Code */}
      <div>
        <label className="form-label">
          Rabattkode <span className="text-sauna-red">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SOMMER2025"
            className={cn("form-input flex-1 font-mono", errors.code && "form-input-error")}
          />
          <button
            onClick={handleGenerateCode}
            className="btn-ghost text-xs py-2.5 px-3 whitespace-nowrap"
            type="button"
          >
            Generer
          </button>
        </div>
        {errors.code && <p className="form-error">{errors.code}</p>}
      </div>

      {/* Discount Type */}
      <div>
        <label className="form-label">Rabattype</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDiscountType("percentage")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
              discountType === "percentage"
                ? "border-teal bg-teal/5"
                : "border-[#DDD6CC] bg-white hover:border-teal-light/50"
            )}
          >
            <span className="text-sm font-semibold text-text-primary">Prosentrabatt</span>
            <span className="text-[11px] text-text-muted">% avslag på totalen</span>
            {discountType === "percentage" && (
              <span className="w-5 h-5 bg-teal rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
          </button>
          <button
            onClick={() => setDiscountType("fixed_amount")}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
              discountType === "fixed_amount"
                ? "border-warm-amber bg-warm-amber/5"
                : "border-[#DDD6CC] bg-white hover:border-warm-amber/50"
            )}
          >
            <span className="text-sm font-semibold text-text-primary">Fast beløp</span>
            <span className="text-[11px] text-text-muted">kr avslag på totalen</span>
            {discountType === "fixed_amount" && (
              <span className="w-5 h-5 bg-warm-amber rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Value */}
      <div>
        <label className="form-label">
          {discountType === "percentage" ? "Prosent (1-100)" : "Beløp (kr)"}{" "}
          <span className="text-sauna-red">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            min={1}
            max={discountType === "percentage" ? 100 : undefined}
            className={cn(
              "form-input pr-10",
              errors.value && "form-input-error"
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">
            {discountType === "percentage" ? "%" : "kr"}
          </span>
        </div>
        {errors.value && <p className="form-error">{errors.value}</p>}
      </div>

      {/* Applies to */}
      <div>
        <label className="form-label">Gjelder for</label>
        <div className="relative">
          <select
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value as AppliesTo)}
            className="form-input appearance-none"
          >
            <option value="all">Alle bookinger</option>
            <option value="private">Kun privatbooking</option>
            <option value="felles">Kun fellesbooking</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Validity period */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
          Gyldighetsperiode
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">
              Fra dato <span className="text-sauna-red">*</span>
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className={cn("form-input", errors.validFrom && "form-input-error")}
            />
            {errors.validFrom && <p className="form-error">{errors.validFrom}</p>}
          </div>
          <div>
            <label className="form-label">Til dato</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              disabled={noExpiry}
              className={cn("form-input", noExpiry && "opacity-50 cursor-not-allowed", errors.validUntil && "form-input-error")}
            />
            {errors.validUntil && <p className="form-error">{errors.validUntil}</p>}
          </div>
        </div>
        {errors.dates && <p className="form-error mt-1">{errors.dates}</p>}
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={noExpiry}
            onChange={(e) => setNoExpiry(e.target.checked)}
            className="rounded border-[#DDD6CC] text-teal focus:ring-teal"
          />
          <span className="text-xs text-text-secondary">Uten utløpsdato</span>
        </label>
      </div>

      {/* Usage limit */}
      <div>
        <label className="form-label">Maks antall bruk</label>
        <input
          type="number"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          placeholder="Ubegrenset"
          min={1}
          className="form-input"
        />
        <p className="text-[11px] text-text-muted mt-1">
          La stå tom for ubegrenset bruk
        </p>
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

      {/* Preview */}
      <div className="rounded-xl border border-[#DDD6CC] p-4 bg-off-white/50">
        <p className="text-[10px] uppercase tracking-wide text-text-muted mb-2">Forhåndsvisning</p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold text-text-primary">
            {code || "KODE"}
          </span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
              typeColors[discountType]
            )}
          >
            {discountType === "percentage" ? `${discountValue}%` : `kr ${discountValue}`}
          </span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
              appliesToColors[appliesTo]
            )}
          >
            {appliesToLabels[appliesTo]}
          </span>
        </div>
        <p className="text-[11px] text-text-muted mt-1">
          {noExpiry
            ? `Gyldig fra ${formatDate(validFrom)} — ingen utløpsdato`
            : validUntil
              ? `Gyldig ${formatDate(validFrom)} — ${formatDate(validUntil)}`
              : `Gyldig fra ${formatDate(validFrom)}`}
          {usageLimit ? ` • Maks ${usageLimit} bruk` : " • Ubegrenset bruk"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} className="btn-primary flex-1">
          {isEdit ? "Lagre endringer" : "Opprett rabattkode"}
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
  discount,
  isOpen,
  onClose,
  onConfirm,
}: {
  discount: DiscountCode | null;
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
                <h3 className="font-semibold text-text-primary">Slett rabattkode</h3>
                <p className="font-mono text-xs text-text-secondary">{discount?.code}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Er du sikker på at du vil slette denne rabattkoden? Denne handlingen kan ikke angres.
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
// Main Discounts Page
// ------------------------------------------------------------------
export default function Discounts() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>(() => getDiscountCodes());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DiscountType | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<AppliesTo | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refresh = () => setDiscounts(getDiscountCodes());

  // Stats
  const stats = useMemo(() => {
    const active = discounts.filter((d) => d.isActive && !isExpired(d.validUntil));
    const totalUsage = discounts.reduce((sum, d) => sum + d.usageCount, 0);
    // Approximate savings (mock calculation)
    const totalSavings = discounts.reduce((sum, d) => {
      if (d.discountType === "fixed_amount") return sum + d.usageCount * d.discountValue;
      // Assume average booking of 500 kr for percentage
      return sum + d.usageCount * (500 * (d.discountValue / 100));
    }, 0);
    return {
      activeCount: active.length,
      totalUsage,
      totalSavings: Math.round(totalSavings),
    };
  }, [discounts]);

  // Filtered
  const filteredDiscounts = useMemo(() => {
    let result = [...discounts];

    if (searchQuery.trim()) {
      const q = searchQuery.toUpperCase();
      result = result.filter((d) => d.code.includes(q));
    }

    if (typeFilter !== "all") {
      result = result.filter((d) => d.discountType === typeFilter);
    }

    if (scopeFilter !== "all") {
      result = result.filter((d) => d.appliesTo === scopeFilter);
    }

    // Sort: active first, then by usage
    result.sort((a, b) => {
      const aExpired = isExpired(a.validUntil);
      const bExpired = isExpired(b.validUntil);
      if (aExpired !== bExpired) return aExpired ? 1 : -1;
      return b.usageCount - a.usageCount;
    });

    return result;
  }, [discounts, searchQuery, typeFilter, scopeFilter]);

  const handleAdd = () => {
    setEditingDiscount(null);
    setModalOpen(true);
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setModalOpen(true);
  };

  const handleSave = (discount: DiscountCode) => {
    saveDiscount(discount);
    refresh();
    setModalOpen(false);
    setEditingDiscount(null);
  };

  const handleDeleteClick = (discount: DiscountCode) => {
    setDeleteTarget(discount);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteDiscount(deleteTarget.id);
      refresh();
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = (discount: DiscountCode) => {
    const updated = { ...discount, isActive: !discount.isActive };
    saveDiscount(updated);
    refresh();
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // DataTable columns
  const columns = useMemo(
    () => [
      {
        key: "code",
        header: "Kode",
        render: (row: DiscountCode) => {
          const expired = isExpired(row.validUntil);
          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-mono text-sm font-semibold",
                  expired ? "text-text-muted line-through" : "text-text-primary"
                )}
              >
                {row.code}
              </span>
              {expired && (
                <span className="text-[10px] font-semibold uppercase bg-sauna-red/10 text-sauna-red px-1.5 py-0.5 rounded">
                  Utløpt
                </span>
              )}
              {!expired && isExpiringSoon(row.validUntil) && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-warning" title="Utløper snart">
                  <AlertCircle className="w-3 h-3" />
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "type",
        header: "Type",
        render: (row: DiscountCode) => (
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold",
              typeColors[row.discountType]
            )}
          >
            {typeLabels[row.discountType]}
          </span>
        ),
      },
      {
        key: "value",
        header: "Verdi",
        render: (row: DiscountCode) => (
          <span className="font-mono text-sm font-semibold text-text-primary">
            {row.discountType === "percentage" ? `${row.discountValue}%` : `kr ${row.discountValue}`}
          </span>
        ),
      },
      {
        key: "appliesTo",
        header: "Gjelder",
        render: (row: DiscountCode) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium",
              appliesToColors[row.appliesTo]
            )}
          >
            {appliesToLabels[row.appliesTo]}
          </span>
        ),
      },
      {
        key: "validity",
        header: "Gyldig periode",
        render: (row: DiscountCode) => (
          <span className="font-mono text-xs text-text-secondary">
            {formatDate(row.validFrom)}
            {row.validUntil ? ` – ${formatDate(row.validUntil)}` : " — ingen sluttdato"}
          </span>
        ),
      },
      {
        key: "usage",
        header: "Brukt",
        render: (row: DiscountCode) => {
          const limit = row.usageLimit;
          const count = row.usageCount;
          const percentage = limit ? Math.min(100, (count / limit) * 100) : 0;
          const fullyUsed = limit !== null && count >= limit;
          return (
            <div className="min-w-[80px]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-text-primary">
                  {count}
                  {limit !== null ? `/${limit}` : ""}
                </span>
                {fullyUsed && (
                  <span className="text-[10px] font-medium text-success">Fullt brukt</span>
                )}
              </div>
              {limit !== null && (
                <div className="w-full h-1 bg-cream rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      fullyUsed ? "bg-success" : "bg-teal"
                    )}
                  />
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        render: (row: DiscountCode) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row);
            }}
            className={cn(
              "w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5",
              row.isActive ? "bg-success" : "bg-text-muted"
            )}
          >
            <motion.div
              animate={{ x: row.isActive ? 20 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5 rounded-full bg-white shadow-sm"
            />
          </button>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "w-[100px]",
        render: (row: DiscountCode) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCode(row.code);
              }}
              className="p-1.5 rounded-md text-text-muted hover:text-teal hover:bg-cream transition-colors touch-target"
              title="Kopier kode"
            >
              {copiedCode === row.code ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
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
    [copiedCode]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Rabattkoder"
        description="Administrer kampanjer og rabattkoder"
        action={
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ny Rabattkode</span>
            <span className="sm:hidden">Ny</span>
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-6">
        <StatCard
          icon={<Tag className="w-5 h-5 text-teal" />}
          label="aktive koder"
          value={stats.activeCount}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-teal" />}
          label="ganger brukt"
          value={stats.totalUsage}
        />
        <StatCard
          icon={<Banknote className="w-5 h-5 text-warm-amber" />}
          label="spart for kunder"
          value={`kr ${stats.totalSavings.toLocaleString("no-NO")}`}
          valueColor="text-warm-amber"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk etter rabattkode..."
            className="w-full h-11 pl-10 pr-4 rounded-[10px] border-[1.5px] border-[#DDD6CC] bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-teal transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DiscountType | "all")}
              className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-[#DDD6CC] bg-white text-xs font-medium text-text-primary focus:outline-none focus:border-teal cursor-pointer"
            >
              <option value="all">Alle typer</option>
              <option value="percentage">Prosent</option>
              <option value="fixed_amount">Fast beløp</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>

          {/* Scope filter */}
          <div className="relative">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as AppliesTo | "all")}
              className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-[#DDD6CC] bg-white text-xs font-medium text-text-primary focus:outline-none focus:border-teal cursor-pointer"
            >
              <option value="all">Alle områder</option>
              <option value="private">Privat</option>
              <option value="felles">Felles</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table — Desktop */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredDiscounts}
          keyExtractor={(row) => row.id}
          onRowClick={handleEdit}
          emptyMessage={
            searchQuery || typeFilter !== "all" || scopeFilter !== "all"
              ? "Ingen rabattkoder matcher søket"
              : "Ingen rabattkoder ennå"
          }
          pageSize={15}
        />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredDiscounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Tag className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">
              {searchQuery || typeFilter !== "all" || scopeFilter !== "all"
                ? "Ingen rabattkoder matcher søket"
                : "Ingen rabattkoder ennå"}
            </p>
          </div>
        ) : (
          filteredDiscounts.map((d) => {
            const expired = isExpired(d.validUntil);
            const scopeLabel = appliesToLabels[d.appliesTo];
            const limit = d.usageLimit;
            const count = d.usageCount;
            const percentage = limit ? Math.min(100, (count / limit) * 100) : 0;
            const fullyUsed = limit !== null && count >= limit;
            return (
              <div key={d.id} className="bg-white rounded-xl border border-[#DDD6CC] p-4 space-y-2.5">
                {/* Code + value badge row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-mono text-base font-bold",
                        expired ? "text-text-muted line-through" : "text-text-primary"
                      )}
                    >
                      {d.code}
                    </span>
                    {expired && (
                      <span className="text-[10px] font-semibold uppercase bg-sauna-red/10 text-sauna-red px-1.5 py-0.5 rounded">
                        Utløpt
                      </span>
                    )}
                    {!expired && isExpiringSoon(d.validUntil) && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-warning" title="Utløper snart">
                        <AlertCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-off-white text-text-secondary">
                    {d.discountType === "percentage" ? `${d.discountValue}%` : `kr ${d.discountValue}`}
                  </span>
                </div>

                {/* Scope + type label + status row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", appliesToColors[d.appliesTo])}>
                      {scopeLabel}
                    </span>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", typeColors[d.discountType])}>
                      {typeLabels[d.discountType]}
                    </span>
                  </div>
                  <span className={d.isActive ? "text-success text-xs font-medium" : "text-text-muted text-xs font-medium"}>
                    {d.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>

                {/* Usage bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", fullyUsed ? "bg-success" : "bg-teal")}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted font-mono">
                    {count}{limit !== null ? `/${limit}` : "/∞"}
                  </span>
                  {fullyUsed && (
                    <span className="text-[10px] font-medium text-success">Fullt brukt</span>
                  )}
                </div>

                {/* Period + actions */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-text-muted font-mono">
                    {formatDate(d.validFrom)}
                    {d.validUntil ? ` – ${formatDate(d.validUntil)}` : " — ingen sluttdato"}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleCopyCode(d.code)}
                      className="p-2 rounded-md text-text-muted hover:text-teal hover:bg-cream transition-colors touch-target"
                      title="Kopier kode"
                    >
                      {copiedCode === d.code ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(d)}
                      className="p-2 rounded-md text-text-muted hover:text-teal hover:bg-cream transition-colors touch-target"
                      title="Rediger"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(d)}
                      className="p-2 rounded-md text-text-muted hover:text-sauna-red hover:bg-sauna-red/10 transition-colors touch-target"
                      title="Slett"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Empty state with quick ideas */}
      {filteredDiscounts.length === 0 && !searchQuery && typeFilter === "all" && scopeFilter === "all" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <p className="text-xs text-text-muted text-center mb-4">Eksempler på rabattkoder:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["SOMMER25", "VELKOMMEN", "VENN10"].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setSearchQuery("");
                  setEditingDiscount(null);
                  // Pre-fill with example
                  setModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#DDD6CC] bg-white text-xs font-mono text-text-secondary hover:border-teal hover:text-teal transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Desktop Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 glass-overlay hidden md:flex items-center justify-center p-4"
            onClick={() => {
              setModalOpen(false);
              setEditingDiscount(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="bg-white rounded-[20px] shadow-modal w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white rounded-t-[20px] border-b border-[#DDD6CC] px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-display text-xl font-bold text-text-primary">
                  {editingDiscount ? "Rediger Rabattkode" : "Ny Rabattkode"}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditingDiscount(null);
                  }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-off-white transition-colors touch-target"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <DiscountForm
                  key={editingDiscount?.id ?? "new"}
                  discount={editingDiscount}
                  onSave={handleSave}
                  onCancel={() => {
                    setModalOpen(false);
                    setEditingDiscount(null);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDiscount(null);
        }}
        title={editingDiscount ? "Rediger Rabattkode" : "Ny Rabattkode"}
      >
        <DiscountForm
          key={`mobile-${editingDiscount?.id ?? "new"}`}
          discount={editingDiscount}
          onSave={handleSave}
          onCancel={() => {
            setModalOpen(false);
            setEditingDiscount(null);
          }}
        />
      </MobileBottomSheet>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        discount={deleteTarget}
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </motion.div>
  );
}
