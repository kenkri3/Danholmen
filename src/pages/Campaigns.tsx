import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Megaphone,
  TrendingUp,
  Banknote,
  Check,
  Copy,
  ChevronDown,
  AlertCircle,
  Sun,
  Snowflake,
  CalendarHeart,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { getCampaigns, saveCampaign, deleteCampaign, getSaunas } from "@/data/store";
import type { Campaign } from "@/data/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function generateId(): string {
  return `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function formatPeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = format(start, "d. MMM", { locale: nb });
  const endStr = format(end, sameYear ? "d. MMM" : "d. MMM yyyy", { locale: nb });
  return `${startStr} – ${endStr} ${sameYear ? start.getFullYear() : ""}`;
}

function isExpired(endDate: string): boolean {
  return new Date(endDate + "T23:59:59") < new Date();
}

function isExpiringSoon(endDate: string): boolean {
  const end = new Date(endDate + "T23:59:59");
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

// ------------------------------------------------------------------
// Templates
// ------------------------------------------------------------------
interface CampaignTemplate {
  label: string;
  icon: React.ReactNode;
  campaign: Partial<Campaign>;
}

function getTemplates(): CampaignTemplate[] {
  const year = new Date().getFullYear();
  return [
    {
      label: "Sommerkampanje",
      icon: <Sun className="w-4 h-4 text-brand-pink" />,
      campaign: {
        name: `Sommerkampanje ${year}`,
        description: "20% avslag på alle badstuer gjennom sommeren",
        discountPercent: 20,
        discountCode: `SOMMER${year}`,
        startDate: `${year}-06-01`,
        endDate: `${year}-08-31`,
        maxUses: 100,
        isActive: true,
        appliesToAllSaunas: true,
        saunaIds: [],
      },
    },
    {
      label: "Vinterkampanje",
      icon: <Snowflake className="w-4 h-4 text-teal" />,
      campaign: {
        name: `Vinterkampanje ${year}`,
        description: "25% avslag på alle badstuer i vintermånedene",
        discountPercent: 25,
        discountCode: `VINTER${year}`,
        startDate: `${year}-12-01`,
        endDate: `${year + 1}-02-28`,
        maxUses: 0,
        isActive: true,
        appliesToAllSaunas: true,
        saunaIds: [],
      },
    },
    {
      label: "Helgerabatt",
      icon: <CalendarHeart className="w-4 h-4 text-sauna-red" />,
      campaign: {
        name: `Helgerabatt ${year}`,
        description: "15% avslag på alle badstuer i helgene (lør–søn)",
        discountPercent: 15,
        discountCode: `HELGE${year}`,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        maxUses: 200,
        isActive: true,
        appliesToAllSaunas: true,
        saunaIds: [],
      },
    },
    {
      label: "Første booking",
      icon: <Sparkles className="w-4 h-4 text-brand-pink" />,
      campaign: {
        name: "Første booking",
        description: "30% avslag for nye kunder på første booking. Én gang per kunde.",
        discountPercent: 30,
        discountCode: "FORSTEBOOKING",
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        maxUses: 50,
        isActive: true,
        appliesToAllSaunas: true,
        saunaIds: [],
      },
    },
  ];
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
// Campaign Form
// ------------------------------------------------------------------
function CampaignForm({
  campaign,
  onSave,
  onCancel,
}: {
  campaign: Campaign | null;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
}) {
  const saunas = getSaunas();
  const isEdit = !!campaign?.id;
  const [name, setName] = useState(campaign?.name ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [discountPercent, setDiscountPercent] = useState<number>(campaign?.discountPercent ?? 20);
  const [discountCode, setDiscountCode] = useState(campaign?.discountCode ?? "");
  const [startDate, setStartDate] = useState(campaign?.startDate ?? new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(campaign?.endDate ?? "");
  const [maxUses, setMaxUses] = useState<number>(campaign?.maxUses ?? 0);
  const [isActive, setIsActive] = useState(campaign?.isActive ?? true);
  const [appliesToAllSaunas, setAppliesToAllSaunas] = useState(campaign?.appliesToAllSaunas ?? true);
  const [selectedSaunaIds, setSelectedSaunaIds] = useState<string[]>(campaign?.saunaIds ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerateCode = () => {
    setDiscountCode(generateCode());
    if (errors.discountCode) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.discountCode;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Navn er påkrevd";
    if (!discountCode.trim()) errs.discountCode = "Rabattkode er påkrevd";
    if (discountPercent < 1 || discountPercent > 100) errs.discountPercent = "Rabatt må være mellom 1 og 100%";
    if (!startDate) errs.startDate = "Startdato er påkrevd";
    if (!endDate) errs.endDate = "Sluttdato er påkrevd";
    if (startDate && endDate && startDate > endDate) errs.dates = "Startdato må være før sluttdato";
    if (!appliesToAllSaunas && selectedSaunaIds.length === 0) errs.saunas = "Velg minst én badstue";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: Campaign = {
      id: campaign?.id ?? generateId(),
      name: name.trim(),
      description: description.trim(),
      discountPercent,
      discountCode: discountCode.trim().toUpperCase(),
      startDate,
      endDate,
      maxUses,
      currentUses: campaign?.currentUses ?? 0,
      isActive,
      appliesToAllSaunas,
      saunaIds: appliesToAllSaunas ? [] : selectedSaunaIds,
      createdAt: campaign?.createdAt ?? new Date().toISOString(),
    };
    onSave(payload);
  };

  const toggleSauna = (saunaId: string) => {
    setSelectedSaunaIds((prev) =>
      prev.includes(saunaId) ? prev.filter((id) => id !== saunaId) : [...prev, saunaId]
    );
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="form-label">
          Navn <span className="text-sauna-red">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sommerkampanje 2026"
          className={cn("form-input", errors.name && "form-input-error")}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="form-label">Beskrivelse</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kort beskrivelse av kampanjen..."
          rows={3}
          className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-[#DDD6CC] bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-teal transition-all duration-200 resize-none"
        />
      </div>

      {/* Discount % */}
      <div>
        <label className="form-label">
          Rabatt % <span className="text-sauna-red">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            min={1}
            max={100}
            className={cn("form-input pr-10", errors.discountPercent && "form-input-error")}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">
            %
          </span>
        </div>
        {errors.discountPercent && <p className="form-error">{errors.discountPercent}</p>}
      </div>

      {/* Discount Code */}
      <div>
        <label className="form-label">
          Rabattkode <span className="text-sauna-red">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder="SOMMER2026"
            className={cn("form-input flex-1 font-mono", errors.discountCode && "form-input-error")}
          />
          <button
            onClick={handleGenerateCode}
            className="btn-ghost text-xs py-2.5 px-3 whitespace-nowrap"
            type="button"
          >
            Generer
          </button>
        </div>
        {errors.discountCode && <p className="form-error">{errors.discountCode}</p>}
      </div>

      {/* Period */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
          Kampanjeperiode
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">
              Startdato <span className="text-sauna-red">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={cn("form-input", errors.startDate && "form-input-error")}
            />
            {errors.startDate && <p className="form-error">{errors.startDate}</p>}
          </div>
          <div>
            <label className="form-label">
              Sluttdato <span className="text-sauna-red">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={cn("form-input", errors.endDate && "form-input-error")}
            />
            {errors.endDate && <p className="form-error">{errors.endDate}</p>}
          </div>
        </div>
        {errors.dates && <p className="form-error mt-1">{errors.dates}</p>}
      </div>

      {/* Max uses */}
      <div>
        <label className="form-label">Maks antall bruk</label>
        <input
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(Number(e.target.value))}
          min={0}
          className="form-input"
        />
        <p className="text-[11px] text-text-muted mt-1">
          0 = ubegrenset antall bruk
        </p>
      </div>

      {/* Applies to saunas */}
      <div>
        <label className="form-label">Gjelder for</label>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={appliesToAllSaunas}
            onChange={(e) => setAppliesToAllSaunas(e.target.checked)}
            className="rounded border-[#DDD6CC] text-teal focus:ring-teal w-4 h-4"
          />
          <span className="text-sm text-text-secondary">Alle badstuer</span>
        </label>
        {!appliesToAllSaunas && (
          <div className="space-y-2 ml-6">
            {saunas.map((sauna) => (
              <label key={sauna.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSaunaIds.includes(sauna.id)}
                  onChange={() => toggleSauna(sauna.id)}
                  className="rounded border-[#DDD6CC] text-teal focus:ring-teal w-4 h-4"
                />
                <span className="text-sm text-text-secondary">{sauna.name}</span>
              </label>
            ))}
            {errors.saunas && <p className="form-error">{errors.saunas}</p>}
          </div>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Aktiv</span>
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

      {/* Preview */}
      <div className="rounded-xl border border-[#DDD6CC] p-4 bg-off-white/50">
        <p className="text-[10px] uppercase tracking-wide text-text-muted mb-2">Forhåndsvisning</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg font-bold text-text-primary">
            {discountCode || "KODE"}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-pink/10 text-brand-pink">
            {discountPercent}%
          </span>
          {name && (
            <span className="text-xs text-text-secondary">{name}</span>
          )}
        </div>
        {startDate && endDate && (
          <p className="text-[11px] text-text-muted mt-1">
            {formatPeriod(startDate, endDate)}
            {maxUses > 0 ? ` • Maks ${maxUses} bruk` : " • Ubegrenset bruk"}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={handleSubmit} className="btn-primary flex-1">
          {isEdit ? "Lagre endringer" : "Opprett kampanje"}
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
  campaign,
  isOpen,
  onClose,
  onConfirm,
}: {
  campaign: Campaign | null;
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
                <h3 className="font-semibold text-text-primary">Slett kampanje</h3>
                <p className="font-mono text-xs text-text-secondary">{campaign?.name}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Er du sikker på at du vil slette denne kampanjen? Denne handlingen kan ikke angres.
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
// Main Campaigns Page
// ------------------------------------------------------------------
export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => getCampaigns());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const saunas = getSaunas();
  const refresh = () => setCampaigns(getCampaigns());

  // Stats
  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.isActive && !isExpired(c.endDate));
    const totalUsage = campaigns.reduce((sum, c) => sum + c.currentUses, 0);
    // Approximate discount given (assume avg booking 500 kr)
    const totalDiscount = campaigns.reduce((sum, c) => {
      return sum + c.currentUses * (500 * (c.discountPercent / 100));
    }, 0);
    return {
      activeCount: active.length,
      totalUsage,
      totalDiscount: Math.round(totalDiscount),
    };
  }, [campaigns]);

  // Filtered
  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.discountCode.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => (statusFilter === "active" ? c.isActive : !c.isActive));
    }

    // Sort: active first, then by current usage
    result.sort((a, b) => {
      const aExpired = isExpired(a.endDate);
      const bExpired = isExpired(b.endDate);
      if (aExpired !== bExpired) return aExpired ? 1 : -1;
      return b.currentUses - a.currentUses;
    });

    return result;
  }, [campaigns, searchQuery, statusFilter]);

  const handleAdd = () => {
    setEditingCampaign(null);
    setModalOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setModalOpen(true);
  };

  const handleSave = (campaign: Campaign) => {
    saveCampaign(campaign);
    refresh();
    setModalOpen(false);
    setEditingCampaign(null);
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setDeleteTarget(campaign);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteCampaign(deleteTarget.id);
      refresh();
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = (campaign: Campaign) => {
    const updated = { ...campaign, isActive: !campaign.isActive };
    saveCampaign(updated);
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

  const handleApplyTemplate = (template: CampaignTemplate) => {
    const now = new Date().toISOString();
    const newCampaign: Campaign = {
      id: generateId(),
      name: template.campaign.name ?? "",
      description: template.campaign.description ?? "",
      discountPercent: template.campaign.discountPercent ?? 20,
      discountCode: template.campaign.discountCode ?? generateCode(),
      startDate: template.campaign.startDate ?? now.split("T")[0],
      endDate: template.campaign.endDate ?? now.split("T")[0],
      maxUses: template.campaign.maxUses ?? 0,
      currentUses: 0,
      isActive: template.campaign.isActive ?? true,
      appliesToAllSaunas: template.campaign.appliesToAllSaunas ?? true,
      saunaIds: template.campaign.saunaIds ?? [],
      createdAt: now,
    };
    setEditingCampaign(newCampaign);
    setModalOpen(true);
  };

  const getSaunaNames = (campaign: Campaign) => {
    if (campaign.appliesToAllSaunas) return "Alle";
    return campaign.saunaIds
      .map((id) => saunas.find((s) => s.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "Ingen";
  };

  // DataTable columns
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Kampanje",
        render: (row: Campaign) => {
          const expired = isExpired(row.endDate);
          return (
            <div className="flex items-center gap-2">
              <span className={cn("font-semibold text-sm", expired ? "text-text-muted line-through" : "text-text-primary")}>
                {row.name}
              </span>
              {expired && (
                <span className="text-[10px] font-semibold uppercase bg-sauna-red/10 text-sauna-red px-1.5 py-0.5 rounded">
                  Utløpt
                </span>
              )}
              {!expired && isExpiringSoon(row.endDate) && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-warning" title="Utløper snart">
                  <AlertCircle className="w-3 h-3" />
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "description",
        header: "Beskrivelse",
        render: (row: Campaign) => (
          <span className="text-xs text-text-secondary line-clamp-1">{row.description}</span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        render: (row: Campaign) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-text-primary">{row.discountCode}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCode(row.discountCode);
              }}
              className="p-1 rounded-md text-text-muted hover:text-teal hover:bg-cream transition-colors"
              title="Kopier kode"
            >
              {copiedCode === row.discountCode ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        ),
      },
      {
        key: "discount",
        header: "Rabatt",
        render: (row: Campaign) => (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-pink/10 text-brand-pink">
            {row.discountPercent}%
          </span>
        ),
      },
      {
        key: "period",
        header: "Periode",
        render: (row: Campaign) => (
          <span className="font-mono text-xs text-text-secondary">{formatPeriod(row.startDate, row.endDate)}</span>
        ),
      },
      {
        key: "usage",
        header: "Brukt",
        render: (row: Campaign) => {
          const limit = row.maxUses;
          const count = row.currentUses;
          const percentage = limit > 0 ? Math.min(100, (count / limit) * 100) : 0;
          const fullyUsed = limit > 0 && count >= limit;
          return (
            <div className="min-w-[80px]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-text-primary">
                  {count}
                  {limit > 0 ? ` / ${limit}` : " / ∞"}
                </span>
                {fullyUsed && (
                  <span className="text-[10px] font-medium text-success">Fullt brukt</span>
                )}
              </div>
              {limit > 0 && (
                <div className="w-full h-1 bg-cream rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full", fullyUsed ? "bg-success" : "bg-teal")}
                  />
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "saunas",
        header: "Badstuer",
        render: (row: Campaign) => (
          <span className="text-xs text-text-secondary">{getSaunaNames(row)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row: Campaign) => (
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
        render: (row: Campaign) => (
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
    [copiedCode]
  );

  const templates = getTemplates();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="Kampanjer"
        description="Tidsbegrensede rabattkampanjer"
        action={
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ny kampanje</span>
            <span className="sm:hidden">Ny</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 mb-6">
        <StatCard
          icon={<Megaphone className="w-5 h-5 text-teal" />}
          label="aktive kampanjer"
          value={stats.activeCount}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-teal" />}
          label="totalt brukt"
          value={stats.totalUsage}
        />
        <StatCard
          icon={<Banknote className="w-5 h-5 text-brand-pink" />}
          label="rabatt gitt (est.)"
          value={`kr ${stats.totalDiscount.toLocaleString("no-NO")}`}
          valueColor="text-brand-pink"
        />
      </div>

      {/* Quick Templates */}
      {campaigns.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Hurtigoppretting fra mal
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {templates.map((template) => (
              <button
                key={template.label}
                onClick={() => handleApplyTemplate(template)}
                className="card-base p-3 flex items-center gap-2 text-left hover:border-teal-light/50 transition-all duration-200"
              >
                {template.icon}
                <span className="text-sm font-medium text-text-primary">{template.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søk etter kampanje..."
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

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="appearance-none h-10 pl-3 pr-8 rounded-lg border border-[#DDD6CC] bg-white text-xs font-medium text-text-primary focus:outline-none focus:border-teal cursor-pointer"
          >
            <option value="all">Alle statuser</option>
            <option value="active">Aktive</option>
            <option value="inactive">Inaktive</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Data Table — Desktop */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredCampaigns}
          keyExtractor={(row) => row.id}
          onRowClick={handleEdit}
          emptyMessage={
            searchQuery || statusFilter !== "all"
              ? "Ingen kampanjer matcher søket"
              : "Ingen kampanjer ennå. Opprett din første kampanje for å tiltrekke flere kunder."
          }
          pageSize={15}
        />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Megaphone className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm text-center px-4">
              {searchQuery || statusFilter !== "all"
                ? "Ingen kampanjer matcher søket"
                : "Ingen kampanjer ennå. Opprett din første kampanje for å tiltrekke flere kunder."}
            </p>
          </div>
        ) : (
          filteredCampaigns.map((c) => {
            const expired = isExpired(c.endDate);
            const limit = c.maxUses;
            const count = c.currentUses;
            const percentage = limit > 0 ? Math.min(100, (count / limit) * 100) : 0;
            const fullyUsed = limit > 0 && count >= limit;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-base p-4 space-y-3"
              >
                {/* Name + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("font-semibold text-sm truncate", expired ? "text-text-muted line-through" : "text-text-primary")}>
                      {c.name}
                    </span>
                    {expired && (
                      <span className="text-[10px] font-semibold uppercase bg-sauna-red/10 text-sauna-red px-1.5 py-0.5 rounded flex-shrink-0">
                        Utløpt
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleStatus(c)}
                    className="flex-shrink-0"
                  >
                    {c.isActive ? (
                      <ToggleRight className="w-6 h-6 text-success" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-text-muted" />
                    )}
                  </button>
                </div>

                {/* Description */}
                {c.description && (
                  <p className="text-xs text-text-secondary line-clamp-2">{c.description}</p>
                )}

                {/* Code + discount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-text-primary">{c.discountCode}</span>
                    <button
                      onClick={() => handleCopyCode(c.discountCode)}
                      className="p-1 rounded-md text-text-muted hover:text-teal hover:bg-cream transition-colors"
                    >
                      {copiedCode === c.discountCode ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-pink/10 text-brand-pink">
                    {c.discountPercent}%
                  </span>
                </div>

                {/* Period */}
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <CalendarHeart className="w-3.5 h-3.5" />
                  <span className="font-mono">{formatPeriod(c.startDate, c.endDate)}</span>
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
                    {count}{limit > 0 ? ` / ${limit}` : " / ∞"}
                  </span>
                  {fullyUsed && (
                    <span className="text-[10px] font-medium text-success">Fullt brukt</span>
                  )}
                </div>

                {/* Saunas */}
                <div className="text-xs text-text-secondary">
                  Badstuer: <span className="font-medium">{getSaunaNames(c)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#F5F0EB]">
                  <button
                    onClick={() => handleEdit(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-teal bg-teal/5 rounded-lg hover:bg-teal/10 transition-colors touch-target"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Rediger
                  </button>
                  <button
                    onClick={() => handleDeleteClick(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-sauna-red bg-sauna-red/5 rounded-lg hover:bg-sauna-red/10 transition-colors touch-target"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Slett
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4"
            onClick={() => {
              setModalOpen(false);
              setEditingCampaign(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#F5F0EB] flex items-center justify-between z-10">
                <h2 className="font-display text-lg font-bold text-text-primary">
                  {editingCampaign?.id ? "Rediger kampanje" : "Ny kampanje"}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditingCampaign(null);
                  }}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-cream transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {/* Templates for new campaigns */}
                {!editingCampaign?.id && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
                      Velg mal
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map((template) => (
                        <button
                          key={template.label}
                          onClick={() => handleApplyTemplate(template)}
                          className="flex items-center gap-2 p-2.5 rounded-lg border border-[#DDD6CC] hover:border-teal-light/50 hover:bg-teal/5 transition-all text-left"
                        >
                          {template.icon}
                          <span className="text-xs font-medium text-text-primary">{template.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#F5F0EB]">
                      <p className="text-[10px] text-text-muted">Eller fyll ut skjemaet under:</p>
                    </div>
                  </div>
                )}
                <CampaignForm
                  campaign={editingCampaign}
                  onSave={handleSave}
                  onCancel={() => {
                    setModalOpen(false);
                    setEditingCampaign(null);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        campaign={deleteTarget}
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
