import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Copy,
  Check,
  MapPin,
  Users,
  Clock,
  ToggleLeft,
  ToggleRight,
  X,
  Dumbbell,
  Tag,
  Building2,
  ImagePlus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { getSaunas, saveSauna, deleteSauna, generateGoogleMapsUrl, generateGoogleMapsEmbedUrl } from "@/data/store";
import type { Sauna, SaunaType, BookingMode } from "@/data/types";

const saunaTypeLabel = (type: SaunaType) => {
  switch (type) {
    case "floating":
      return "Flytende";
    case "wood-fired":
      return "Vedfyrt";
    case "electric":
      return "Elektrisk";
    default:
      return type;
  }
};

const bookingModeLabel = (modes: BookingMode[]) => {
  if (modes.length === 2) return "Privat & Felles";
  if (modes.length === 1) return modes[0] === "private" ? "Privat" : "Felles";
  return "Ingen valgt";
};

const emptySauna: Omit<Sauna, "id" | "createdAt"> = {
  name: "",
  slug: "",
  publicSlug: "",
  type: "floating",
  location: "",
  description: "",
  privatePrice: 500,
  fellesPrice: 179,
  capacity: 10,
  sessionLength: 120,
  operatingHours: {
    weekday: { start: "06:00", end: "22:00" },
    weekend: { start: "06:00", end: "22:00" },
  },
  isActive: true,
  image: "/sauna-default.jpg",
  images: [],
  bookingModes: ["private", "shared"],
  offersMembership: false,
  offersVelDiscount: false,
  velDiscountRate: 0,
  localAssociationName: null,
  basicPrice: 0,
  premiumPrice: 0,
  platinumPrice: 0,
};

export default function Saunas() {
  const [saunas, setSaunas] = useState<Sauna[]>(getSaunas());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSauna, setEditingSauna] = useState<Sauna | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Sauna, "id" | "created">>({
    ...emptySauna,
  } as Omit<Sauna, "id" | "created">);

  const openAdd = () => {
    setEditingSauna(null);
    setForm({ ...emptySauna, id: undefined, createdAt: undefined } as unknown as Sauna);
    setModalOpen(true);
  };

  const openEdit = (sauna: Sauna) => {
    setEditingSauna(sauna);
    setForm({ ...sauna });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSauna(null);
  };

  const handleSave = () => {
    const saunaToSave: Sauna = {
      ...form,
      id: editingSauna?.id ?? `sauna-${Date.now()}`,
      createdAt: editingSauna?.createdAt ?? new Date().toISOString(),
      mapsUrl: form.mapsUrl ?? (form.location ? generateGoogleMapsUrl(form.location) : null),
      googleMapsEmbed: form.googleMapsEmbed ?? (form.location ? generateGoogleMapsEmbedUrl(form.location) : null),
    } as Sauna;

    saveSauna(saunaToSave);
    setSaunas(getSaunas());
    closeModal();
  };

  const handleDelete = (id: string) => {
    deleteSauna(id);
    setSaunas(getSaunas());
    setDeleteConfirm(null);
  };

  const updateForm = <K extends keyof Sauna>(key: K, value: Sauna[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Badstuer"
        description="Oversikt og innstillinger for alle badstuelokasjoner"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-pink hover:bg-pink-light text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-amber-btn hover:shadow-amber-btn-hover transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ny badstue</span>
          </button>
        }
      />

      {/* Sauna grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {saunas.map((sauna, idx) => (
          <motion.div
            key={sauna.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden card-hover"
          >
            {/* Image */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={sauna.image}
                alt={sauna.name}
                className="w-full h-full object-cover"
              />
              {/* Multi-image indicator */}
              {sauna.images && sauna.images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ImagePlus className="w-3 h-3" />
                  {sauna.images.length} bilder
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="bg-deep-teal/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wide">
                  {saunaTypeLabel(sauna.type)}
                </span>
              </div>
              {!sauna.isActive && (
                <div className="absolute top-3 right-3">
                  <span className="bg-sauna-red/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full uppercase tracking-wide">
                    Inaktiv
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading text-base font-semibold text-text-primary">
                  {sauna.name}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(sauna)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-teal hover:bg-teal/5 transition-colors"
                    title="Rediger"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(sauna.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-sauna-red hover:bg-sauna-red/5 transition-colors"
                    title="Slett"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-text-secondary text-sm mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span>{sauna.location}</span>
              </div>

              {/* Membership badges */}
              {sauna.offersMembership && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-1 bg-teal/10 text-teal text-[11px] font-medium px-2 py-0.5 rounded-full">
                    <Dumbbell className="w-3 h-3" />
                    Medlemskap tilbys
                  </span>
                  {sauna.offersVelDiscount && (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />
                      Vel-rabatt: {Math.round(sauna.velDiscountRate * 100)}%
                    </span>
                  )}
                </div>
              )}

              {sauna.localAssociationName && (
                <div className="flex items-center gap-1.5 text-text-muted text-xs mb-3">
                  <Building2 className="w-3 h-3" />
                  <span>{sauna.localAssociationName}</span>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-text-muted mb-2">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Opptil {sauna.capacity} pers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{sauna.sessionLength / 60} timer</span>
                </div>
              </div>

              {/* Booking modes */}
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-4">
                <span className="font-medium">Booking:</span>
                <span>{bookingModeLabel(sauna.bookingModes)}</span>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-off-white rounded-lg px-3 py-2">
                  <span className="text-text-muted">Privat</span>
                  <p className="font-semibold text-text-primary">{sauna.privatePrice} kr</p>
                </div>
                <div className="bg-off-white rounded-lg px-3 py-2">
                  <span className="text-text-muted">Felles</span>
                  <p className="font-semibold text-text-primary">{sauna.fellesPrice} kr</p>
                </div>
                {sauna.offersMembership && (
                  <div className="bg-teal/5 rounded-lg px-3 py-2 col-span-2">
                    <span className="text-teal text-[10px]">Danholmen Medlem</span>
                    <p className="font-semibold text-teal">{sauna.basicPrice} kr/mnd</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 text-xs text-success bg-success/5 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>Aktiv på nettsiden</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD6CC]">
                <h2 className="font-display text-lg font-bold text-text-primary">
                  {editingSauna ? "Rediger badstue" : "Ny badstue"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-off-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-5">
                {/* Basic info */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Grunnleggende info
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="form-label">Navn</label>
                      <input
                        className="form-input"
                        value={form.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          updateForm("name", name);
                          // Auto-generer slug hvis brukeren ikke har skrevet inn manuelt
                          if (!editingSauna) {
                            const slug = name
                              .toLowerCase()
                              .replace(/[^a-z0-9\s-]/g, "")  // fjern spesialtegn
                              .replace(/\s+/g, "-")           // erstatt mellomrom med -
                              .replace(/-+/g, "-")            // fjern doble -
                              .trim();
                            if (slug) {
                              updateForm("slug", slug);
                              updateForm("publicSlug", slug);
                            }
                          }
                        }}
                        placeholder="Badstuens navn"
                      />
                    </div>
                    <div>
                      <label className="form-label">Slug (intern)</label>
                      <input
                        className="form-input"
                        value={form.slug}
                        onChange={(e) =>
                          updateForm("slug", e.target.value)
                        }
                        placeholder="badstue-slug"
                      />
                    </div>
                    <div>
                      <label className="form-label">Offentlig slug</label>
                      <input
                        className="form-input"
                        value={form.publicSlug}
                        onChange={(e) =>
                          updateForm("publicSlug", e.target.value)
                        }
                        placeholder="offentlig-slug"
                      />
                    </div>
                    <div>
                      <label className="form-label">Type</label>
                      <select
                        className="form-input"
                        value={form.type}
                        onChange={(e) =>
                          updateForm("type", e.target.value as SaunaType)
                        }
                      >
                        <option value="floating">Flytende</option>
                        <option value="wood-fired">Vedfyrt</option>
                        <option value="electric">Elektrisk</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Lokasjon</label>
                      <input
                        className="form-input"
                        value={form.location}
                        onChange={(e) =>
                          updateForm("location", e.target.value)
                        }
                        placeholder="Sted"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="form-label">Google Maps lenke (valgfritt)</label>
                      <input
                        className="form-input"
                        value={form.mapsUrl ?? ""}
                        onChange={(e) => updateForm("mapsUrl", e.target.value || null)}
                        placeholder="https://maps.app.goo.gl/..."
                      />
                      <p className="text-[11px] text-text-muted mt-1">
                        La stå tom for å generere automatisk fra adressen
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="form-label">Beskrivelse</label>
                      <textarea
                        className="form-input min-h-[80px] py-3"
                        value={form.description}
                        onChange={(e) =>
                          updateForm("description", e.target.value)
                        }
                        placeholder="Beskrivelse av badstuen"
                      />
                    </div>
                  </div>

                  {/* Image upload */}
                  <div className="sm:col-span-2 pt-2">
                    <label className="form-label">Bilder</label>
                    <ImageUpload
                      images={(form.images as string[]) ?? []}
                      onImagesChange={(newImages) => {
                        updateForm("images", newImages);
                        // Sync main image to first uploaded image, or fallback
                        updateForm(
                          "image",
                          newImages[0] ?? "/sauna-default.jpg"
                        );
                      }}
                      maxImages={6}
                      maxSizeMB={20}
                    />
                    {form.images && (form.images as string[]).length > 0 && (
                      <p className="text-[11px] text-text-muted mt-1.5">
                        Første bilde brukes som hovedbilde på badstuekortet
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking modes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Bookingtyper tilgjengelig
                  </h4>
                  <p className="text-[11px] text-text-muted">
                    Velg minst én bookingtype. Brukere vil kun se de aktiverte typene.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const current = (form.bookingModes as BookingMode[]) ?? [];
                        const hasPrivate = current.includes("private");
                        const hasShared = current.includes("shared");
                        if (hasPrivate && !hasShared) return; // Must keep at least one
                        const next: BookingMode[] = hasPrivate
                          ? current.filter((m) => m !== "private")
                          : [...current, "private"];
                        updateForm("bookingModes", next);
                      }}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${((form.bookingModes as BookingMode[]) ?? []).includes("private")
                          ? "border-deep-teal bg-deep-teal/5 text-deep-teal"
                          : "border-[#DDD6CC] text-text-muted hover:border-text-muted/50"
                        }
                      `}
                    >
                      <Check className={`w-4 h-4 ${((form.bookingModes as BookingMode[]) ?? []).includes("private") ? "opacity-100" : "opacity-0"}`} />
                      Privat leie
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = (form.bookingModes as BookingMode[]) ?? [];
                        const hasPrivate = current.includes("private");
                        const hasShared = current.includes("shared");
                        if (hasShared && !hasPrivate) return; // Must keep at least one
                        const next: BookingMode[] = hasShared
                          ? current.filter((m) => m !== "shared")
                          : [...current, "shared"];
                        updateForm("bookingModes", next);
                      }}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${((form.bookingModes as BookingMode[]) ?? []).includes("shared")
                          ? "border-deep-teal bg-deep-teal/5 text-deep-teal"
                          : "border-[#DDD6CC] text-text-muted hover:border-text-muted/50"
                        }
                      `}
                    >
                      <Check className={`w-4 h-4 ${((form.bookingModes as BookingMode[]) ?? []).includes("shared") ? "opacity-100" : "opacity-0"}`} />
                      Felles leie
                    </button>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Priser
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="form-label">Privat (kr)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={form.privatePrice}
                        onChange={(e) =>
                          updateForm("privatePrice", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">Felles (kr)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={form.fellesPrice}
                        onChange={(e) =>
                          updateForm("fellesPrice", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">Kapasitet</label>
                      <input
                        type="number"
                        className="form-input"
                        value={form.capacity}
                        onChange={(e) =>
                          updateForm("capacity", Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">Øktlengde (min)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={form.sessionLength}
                        onChange={(e) =>
                          updateForm("sessionLength", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Membership & discounts */}
                <div className="space-y-4 border-t border-[#DDD6CC] pt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Medlemskap og rabatter
                  </h4>

                  {/* offersMembership toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      updateForm("offersMembership", !form.offersMembership)
                    }
                    className="flex items-center gap-3 w-full"
                  >
                    {form.offersMembership ? (
                      <ToggleRight className="w-6 h-6 text-teal flex-shrink-0" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-text-muted flex-shrink-0" />
                    )}
                    <span className="text-sm text-text-primary">
                      Tilby medlemskap
                    </span>
                  </button>

                  <AnimatePresence>
                    {form.offersMembership && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {/* offersVelDiscount toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            updateForm(
                              "offersVelDiscount",
                              !form.offersVelDiscount
                            )
                          }
                          className="flex items-center gap-3 w-full"
                        >
                          {form.offersVelDiscount ? (
                            <ToggleRight className="w-6 h-6 text-purple-600 flex-shrink-0" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-text-muted flex-shrink-0" />
                          )}
                          <span className="text-sm text-text-primary">
                            Tilby vel-rabatt
                          </span>
                        </button>

                        <AnimatePresence>
                          {form.offersVelDiscount && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-9">
                                <label className="form-label">
                                  Vel-rabatt %
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  className="form-input w-32"
                                  value={Math.round(
                                    (form.velDiscountRate ?? 0) * 100
                                  )}
                                  onChange={(e) => {
                                    const val = Math.min(
                                      100,
                                      Math.max(0, Number(e.target.value))
                                    );
                                    updateForm(
                                      "velDiscountRate",
                                      val / 100
                                    );
                                  }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Local association */}
                        <div className="pl-9">
                          <label className="form-label">Lokal forening</label>
                          <input
                            className="form-input"
                            value={form.localAssociationName ?? ""}
                            onChange={(e) =>
                              updateForm(
                                "localAssociationName",
                                e.target.value || null
                              )
                            }
                            placeholder="f.eks. Arås Båthavn"
                          />
                        </div>

                        {/* Membership price */}
                        <div className="pl-9">
                          <label className="form-label mb-2">
                            Medlemspris
                          </label>
                          <input
                            type="number"
                            className="form-input"
                            value={form.basicPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateForm("basicPrice", val);
                              updateForm("premiumPrice", val);
                              updateForm("platinumPrice", val);
                            }}
                          />
                          <p className="text-[10px] text-text-muted mt-1">
                            Danholmen Medlem — gjelder alle 3 badstuer
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#DDD6CC]">
                <button
                  onClick={closeModal}
                  className="btn-ghost text-sm"
                >
                  Avbryt
                </button>
                <button onClick={handleSave} className="btn-primary text-sm">
                  {editingSauna ? "Lagre endringer" : "Opprett badstue"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-sauna-red/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-sauna-red" />
              </div>
              <h3 className="font-display text-lg font-bold text-text-primary text-center mb-2">
                Slett badstue
              </h3>
              <p className="text-sm text-text-secondary text-center mb-6">
                Er du sikker på at du vil slette denne badstuen? Alle bookinger knyttet til den vil også fjernes. Denne handlingen kan ikke angres.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 btn-ghost h-11"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-sauna-red hover:bg-red-600 text-white h-11 rounded-lg text-sm font-medium transition-colors"
                >
                  Slett
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
