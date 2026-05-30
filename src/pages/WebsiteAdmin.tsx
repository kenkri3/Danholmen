import { useState, useEffect, useCallback } from "react";
import {
  getWebsiteImages,
  updateHeroImage,
  updateSaunaCardImage,
  updateAboutImage,
  updateGalleryImages,
  updateHeroOverlayOpacity,
  updateHeroVideoSeason,
  resetWebsiteImages,
  getSaunas,
  getSystemConfig,
  saveSystemConfig,
  getAllMembershipTiers,
  toggleMembershipTierActive,
  updateMembershipTier,
  deleteMembershipTier,
} from "@/data/store";
import type { Season } from "@/data/types";
import type { WebsiteImages, Sauna, MembershipTierConfig, SystemConfig } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Image,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  Clapperboard,
} from "lucide-react";

/* ─────────────────── Toast ─────────────────── */
interface ToastState {
  message: string;
  type: "success" | "error";
}

function Toast({ message, type, onClose }: ToastState & { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-4 shadow-lg animate-in slide-in-from-bottom-3 fade-in duration-300"
      style={{
        backgroundColor: type === "success" ? "#0B3D4C" : "#D93A6E",
        color: "#F5F0EA",
        minWidth: "280px",
      }}
    >
      {type === "success" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto opacity-80 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}

/* ─────────────────── Upload helper ─────────────────── */
function useImageUpload(onUpload: (base64: string) => void) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("Bildet er for stort. Maks 20MB.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      onUpload(base64);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploading(false);
      alert("Noe gikk galt ved lesing av filen. Prøv igjen.");
    };
    reader.readAsDataURL(file);
  };

  return { uploading, handleFileChange };
}

/* ─────────────────── Upload button component ─────────────────── */
function ImageUploadButton({
  onUpload,
  label = "Last opp nytt bilde",
  uploading,
  handleFileChange,
  id,
}: {
  onUpload?: (base64: string) => void;
  label?: string;
  uploading: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
}) {
  return (
    <div>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <label htmlFor={id}>
        <Button
          type="button"
          variant="outline"
          className="h-12 px-6 text-base font-medium cursor-pointer border-2"
          style={{ borderColor: "#0B3D4C", color: "#0B3D4C" }}
          disabled={uploading}
          asChild
        >
          <span className="flex items-center gap-2">
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Laster opp...
              </>
            ) : (
              <>
                <Upload size={18} />
                {label}
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}

/* ─────────────────── Tier Edit Dialog ─────────────────── */
function TierEditDialog({
  open,
  onOpenChange,
  tier,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tier: MembershipTierConfig | null;
  onSave: (t: MembershipTierConfig) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<MembershipTierConfig | null>(null);

  useEffect(() => {
    if (tier) setForm({ ...tier });
  }, [tier]);

  if (!form) return null;

  const update = (patch: Partial<MembershipTierConfig>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const benefitLabels = form.benefits.join("\n");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border-2" style={{ borderColor: "#e8e2d9" }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ color: "#0B3D4C" }}>
            Rediger medlemskap
          </DialogTitle>
          <DialogDescription className="text-sm" style={{ color: "#5a7a85" }}>
            Tilpass navn, pris, fordeler og mer for dette medlemskapet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-deep-teal mb-1">Navn</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-sm focus:outline-none focus:border-teal"
            />
          </div>

          {/* Subtitle + Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-deep-teal mb-1">Undertittel</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => update({ subtitle: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-sm focus:outline-none focus:border-teal"
                placeholder="f.eks. Livsnyteren"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-teal mb-1">Pris (kr/mnd)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => update({ price: Number(e.target.value) })}
                className="w-full h-11 px-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-deep-teal mb-1">Beskrivelse</label>
            <textarea
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#DDD6CC] bg-white text-sm focus:outline-none focus:border-teal resize-none"
              rows={2}
            />
          </div>

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-deep-teal mb-1">
              Fordeler (én per linje)
            </label>
            <textarea
              value={benefitLabels}
              onChange={(e) =>
                update({ benefits: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
              }
              className="w-full px-4 py-3 rounded-xl border-2 border-[#DDD6CC] bg-white text-sm focus:outline-none focus:border-teal resize-none"
              rows={4}
              placeholder="Ubegrenset fellesbadstue&#10;40% rabatt på privatleie"
            />
          </div>

          {/* Badge + CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-deep-teal mb-1">Merke (valgfritt)</label>
              <input
                type="text"
                value={form.badge ?? ""}
                onChange={(e) => update({ badge: e.target.value || undefined })}
                className="w-full h-11 px-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-sm focus:outline-none focus:border-teal"
                placeholder="f.eks. Mest populær"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deep-teal mb-1">Knapp-tekst</label>
              <input
                type="text"
                value={form.ctaText}
                onChange={(e) => update({ ctaText: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0 mt-6">
          <Button
            variant="outline"
            className="h-12 px-5 text-base cursor-pointer border-2 border-red-300 text-red-500 hover:bg-red-50"
            onClick={() => {
              onDelete(form.id);
              onOpenChange(false);
            }}
          >
            <Trash2 size={16} className="mr-2" />
            Slett
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            className="h-12 px-6 text-base cursor-pointer border-2"
            style={{ borderColor: "#0B3D4C", color: "#0B3D4C" }}
            onClick={() => onOpenChange(false)}
          >
            Avbryt
          </Button>
          <Button
            className="h-12 px-6 text-base font-semibold cursor-pointer"
            style={{ backgroundColor: "#0B3D4C", color: "#F5F0EA" }}
            onClick={() => onSave(form)}
          >
            <CheckCircle2 size={18} className="mr-2" />
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────── Image preview ─────────────────── */
function ImagePreview({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`bg-gray-200 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <Image size={36} className="mx-auto mb-2 text-gray-400" />
          <span className="text-sm text-gray-500">Ingen bilde</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-xl object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

/* ─────────────────── Main component ─────────────────── */
export default function WebsiteAdmin() {
  const [websiteImages, setWebsiteImages] = useState<WebsiteImages | null>(null);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [tiers, setTiers] = useState<MembershipTierConfig[]>([]);
  const [editingTier, setEditingTier] = useState<MembershipTierConfig | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // Load data on mount
  useEffect(() => {
    const images = getWebsiteImages();
    setWebsiteImages(images);
    setSaunas(getSaunas());
    setTiers(getAllMembershipTiers());
  }, []);

  // ── Hero ──
  const heroUpload = useImageUpload((base64) => {
    updateHeroImage(base64);
    setWebsiteImages(getWebsiteImages());
    showToast("Hero-bildet er oppdatert!");
  });

  const handleHeroReset = () => {
    updateHeroImage("/hero-sauna.jpg");
    setWebsiteImages(getWebsiteImages());
    showToast("Hero-bildet er tilbakestilt.");
  };

  const handleOpacityChange = (value: number[]) => {
    const opacity = value[0] / 100;
    updateHeroOverlayOpacity(opacity);
    setWebsiteImages(getWebsiteImages());
  };

  // ── Sauna cards ──
  const sauna1Upload = useImageUpload((base64) => {
    updateSaunaCardImage(saunas[0]?.id || "sauna-1", base64);
    setWebsiteImages(getWebsiteImages());
    showToast("Badstue-bildet er oppdatert!");
  });
  const sauna2Upload = useImageUpload((base64) => {
    updateSaunaCardImage(saunas[1]?.id || "sauna-2", base64);
    setWebsiteImages(getWebsiteImages());
    showToast("Badstue-bildet er oppdatert!");
  });
  const sauna3Upload = useImageUpload((base64) => {
    updateSaunaCardImage(saunas[2]?.id || "sauna-3", base64);
    setWebsiteImages(getWebsiteImages());
    showToast("Badstue-bildet er oppdatert!");
  });
  const saunaUploads = [sauna1Upload, sauna2Upload, sauna3Upload];

  // ── About ──
  const aboutUpload = useImageUpload((base64) => {
    updateAboutImage(base64);
    setWebsiteImages(getWebsiteImages());
    showToast("Om-seksjon bildet er oppdatert!");
  });

  // ── Gallery ──
  const galleryUpload = useImageUpload((base64) => {
    if (!websiteImages) return;
    if (websiteImages.galleryImages.length >= 10) {
      showToast("Maks 10 bilder i galleriet.", "error");
      return;
    }
    const newGallery = [...websiteImages.galleryImages, base64];
    updateGalleryImages(newGallery);
    setWebsiteImages(getWebsiteImages());
    showToast("Bilde lagt til i galleriet!");
  });

  const handleRemoveGalleryImage = (index: number) => {
    if (!websiteImages) return;
    const newGallery = websiteImages.galleryImages.filter((_, i) => i !== index);
    updateGalleryImages(newGallery);
    setWebsiteImages(getWebsiteImages());
    showToast("Bildet er fjernet fra galleriet.");
  };

  // ── Reset all ──
  const handleResetAll = () => {
    resetWebsiteImages();
    setWebsiteImages(getWebsiteImages());
    setResetDialogOpen(false);
    showToast("Alle bilder er tilbakestilt til standard.");
  };

  // ── Membership Tiers ──
  const handleToggleTier = (tierId: string) => {
    const updated = toggleMembershipTierActive(tierId);
    if (updated) {
      setTiers(getAllMembershipTiers());
      showToast(
        updated.isActive
          ? `"${updated.name}" er nå aktiv på landingssiden.`
          : `"${updated.name}" er deaktivert.`
      );
    }
  };

  const handleSaveTier = (tier: MembershipTierConfig) => {
    updateMembershipTier(tier);
    setTiers(getAllMembershipTiers());
    setEditingTier(null);
    setTierDialogOpen(false);
    showToast(`"${tier.name}" er oppdatert.`);
  };

  const handleDeleteTier = (tierId: string) => {
    deleteMembershipTier(tierId);
    setTiers(getAllMembershipTiers());
    showToast("Medlemskapet er slettet.");
  };

  if (!websiteImages) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" style={{ color: "#0B3D4C" }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8" style={{ color: "#0B3D4C" }}>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: "#0B3D4C" }}>
          Nettside
        </h1>
        <p className="text-base md:text-lg" style={{ color: "#5a7a85" }}>
          Administrer bilder og innhold på landingssiden
        </p>
      </div>

      {/* ── Section 1: Hero Video ── */}
      <Card className="mb-8 border-2 rounded-2xl shadow-sm" style={{ borderColor: "#e8e2d9" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Clapperboard size={24} />
            Hero-video
          </CardTitle>
          <p className="text-sm" style={{ color: "#5a7a85" }}>
            Velg hvilken årstids-video som vises på toppen av landingssiden
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video preview */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "#5a7a85" }}>
              Nåværende video: <span className="font-bold text-deep-teal capitalize">{websiteImages.heroVideoSeason === "spring" ? "Vår" : websiteImages.heroVideoSeason === "summer" ? "Sommer" : websiteImages.heroVideoSeason === "autumn" ? "Høst" : "Vinter"}</span>
            </p>
            <video
              autoPlay
              muted
              loop
              playsInline
              key={websiteImages.heroVideoSeason}
              className="w-full max-h-48 rounded-xl object-cover"
            >
              <source src={`/hero-video-${websiteImages.heroVideoSeason}.mp4`} type="video/mp4" />
            </video>
          </div>

          {/* Season selector */}
          <div className="rounded-xl p-5 border" style={{ backgroundColor: "#F5F0EA", borderColor: "#e8e2d9" }}>
            <label className="block text-sm font-semibold mb-4">
              Velg årstid
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: "spring" as Season, label: "Vår", icon: Flower2, desc: "Blomstring & ferskgrønt", color: "#4A9B5E" },
                { key: "summer" as Season, label: "Sommer", icon: Sun, desc: "Solkyst & badeliv", color: "#EE9B00" },
                { key: "autumn" as Season, label: "Høst", icon: Leaf, desc: "Gyllent & disig", color: "#C25E28" },
                { key: "winter" as Season, label: "Vinter", icon: Snowflake, desc: "Snø & is", color: "#4A7FB5" },
              ].map((season) => {
                const isActive = websiteImages.heroVideoSeason === season.key;
                const SeasonIcon = season.icon;
                return (
                  <button
                    key={season.key}
                    onClick={() => {
                      updateHeroVideoSeason(season.key);
                      setWebsiteImages(getWebsiteImages());
                      showToast(`${season.label}-video valgt!`);
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isActive
                        ? "border-deep-teal bg-deep-teal/5 shadow-md"
                        : "border-[#DDD6CC] hover:border-text-muted/50 hover:bg-white/50"
                    }`}
                  >
                    <SeasonIcon size={28} style={{ color: season.color }} />
                    <span className={`text-sm font-semibold ${isActive ? "text-deep-teal" : "text-text-secondary"}`}>
                      {season.label}
                    </span>
                    <span className="text-[10px] text-text-muted text-center leading-tight">
                      {season.desc}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-success uppercase tracking-wide">Aktiv</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opacity slider */}
          <div className="rounded-xl p-5 border" style={{ backgroundColor: "#F5F0EA", borderColor: "#e8e2d9" }}>
            <label className="block text-sm font-semibold mb-4">
              Overleggs-gjennomsiktighet: {Math.round((websiteImages.heroOverlayOpacity ?? 0) * 100)}%
            </label>
            <Slider
              defaultValue={[Math.round((websiteImages.heroOverlayOpacity ?? 0) * 100)]}
              max={100}
              step={5}
              onValueCommit={handleOpacityChange}
              className="w-full cursor-pointer"
            />
            <p className="text-xs mt-2" style={{ color: "#5a7a85" }}>
              Juster mørkheten over videoen (høyere = mørkere)
            </p>
          </div>

          {/* Static fallback image (for mobile data saving) */}
          <div className="border-t border-[#DDD6CC] pt-5">
            <p className="text-sm font-semibold mb-2" style={{ color: "#5a7a85" }}>
              Statisk fallback-bilde (vises mens video laster)
            </p>
            <ImagePreview
              src={websiteImages.heroImage}
              alt="Hero fallback"
              className="w-full max-h-32 mb-4"
            />
            <ImageUploadButton
              id="hero-upload"
              label="Last opp nytt fallback-bilde"
              uploading={heroUpload.uploading}
              handleFileChange={heroUpload.handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Sauna cards ── */}
      <Card className="mb-8 border-2 rounded-2xl shadow-sm" style={{ borderColor: "#e8e2d9" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Image size={24} />
            Badstue-kort
          </CardTitle>
          <p className="text-sm" style={{ color: "#5a7a85" }}>
            Bilder som vises på badstue-kortene på landingssiden
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {saunas.map((sauna, idx) => {
              const saunaSrc = websiteImages.saunaCards?.[sauna.id] || sauna.image;
              const upload = saunaUploads[idx] || sauna1Upload;

              return (
                <div
                  key={sauna.id}
                  className="rounded-xl p-5 border-2"
                  style={{ backgroundColor: "#F5F0EA", borderColor: "#e8e2d9" }}
                >
                  <h3 className="text-lg font-bold mb-3">{sauna.name}</h3>
                  <ImagePreview
                    src={saunaSrc}
                    alt={`${sauna.name} bilde`}
                    className="w-full h-40 mb-4"
                  />
                  <ImageUploadButton
                    id={`sauna-upload-${sauna.id}`}
                    label="Last opp nytt bilde"
                    uploading={upload.uploading}
                    handleFileChange={upload.handleFileChange}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: About image ── */}
      <Card className="mb-8 border-2 rounded-2xl shadow-sm" style={{ borderColor: "#e8e2d9" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Image size={24} />
            Om-seksjon bilde
          </CardTitle>
          <p className="text-sm" style={{ color: "#5a7a85" }}>
            Bilde som vises i "Om Danholmen Badstuer"-seksjonen
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImagePreview
            src={websiteImages.aboutSectionImage}
            alt="Om-seksjon bilde"
            className="w-full max-h-48"
          />
          <ImageUploadButton
            id="about-upload"
            label="Last opp nytt bilde"
            uploading={aboutUpload.uploading}
            handleFileChange={aboutUpload.handleFileChange}
          />
        </CardContent>
      </Card>

      {/* ── Section 4: Gallery ── */}
      <Card className="mb-8 border-2 rounded-2xl shadow-sm" style={{ borderColor: "#e8e2d9" }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Image size={24} />
            Galleri
          </CardTitle>
          <p className="text-sm" style={{ color: "#5a7a85" }}>
            Bilder som vises i galleriet på landingssiden ({websiteImages.galleryImages.length}/10)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {websiteImages.galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {websiteImages.galleryImages.map((img, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden border-2" style={{ borderColor: "#e8e2d9" }}>
                  <ImagePreview
                    src={img}
                    alt={`Galleri bilde ${index + 1}`}
                    className="w-full aspect-square"
                  />
                  <button
                    onClick={() => handleRemoveGalleryImage(index)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-50"
                    title="Fjern bilde"
                    style={{ color: "#D93A6E" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl p-8 text-center border-2 border-dashed"
              style={{ backgroundColor: "#F5F0EA", borderColor: "#d4cfc7" }}
            >
              <Image size={40} className="mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium" style={{ color: "#5a7a85" }}>
                Ingen bilder i galleriet ennå
              </p>
            </div>
          )}

          {websiteImages.galleryImages.length < 10 && (
            <ImageUploadButton
              id="gallery-upload"
              label="Legg til bilde"
              uploading={galleryUpload.uploading}
              handleFileChange={galleryUpload.handleFileChange}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Section 5: Reset all ── */}
      <Card className="mb-8 border-2 rounded-2xl shadow-sm border-red-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2" style={{ color: "#D93A6E" }}>
            <AlertTriangle size={24} />
            Tilbakestill alle bilder
          </CardTitle>
          <p className="text-sm" style={{ color: "#5a7a85" }}>
            Dette tilbakestiller alle bilder til standard-innstillingene
          </p>
        </CardHeader>
        <CardContent>
          <Button
            className="h-12 px-8 text-base font-semibold cursor-pointer"
            style={{ backgroundColor: "#D93A6E", color: "#F5F0EA" }}
            onClick={() => setResetDialogOpen(true)}
          >
            <RotateCcw size={18} className="mr-2" />
            Tilbakestill alle bilder til standard
          </Button>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/*  MEDLEMSKAP                                                  */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-2 shadow-sm mb-8" style={{ borderColor: "#e8e2d9" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: "#0B3D4C" }}>
            <Sparkles size={22} />
            Medlemskap
          </CardTitle>
          <p className="text-sm" style={{ color: "#5a7a85" }}>
            Aktiver eller deaktiver medlemskapsnivåer som vises på landingssiden. Klikk "Rediger" for å tilpasse navn, pris og fordeler.
          </p>
        </CardHeader>
        <CardContent>
          {tiers.length === 0 ? (
            <p className="text-sm text-text-muted">Ingen medlemskap definert ennå.</p>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-xl border-2"
                  style={{
                    borderColor: tier.isActive ? "#2A6B6B" : "#e8e2d9",
                    backgroundColor: tier.isActive ? "#f0f7f7" : "#faf9f7",
                  }}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-deep-teal text-base">
                        {tier.name}
                      </span>
                      {tier.badge && (
                        <span
                          className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: "#EE4C84" }}
                        >
                          {tier.badge}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          tier.isActive
                            ? "bg-success/10 text-success"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {tier.isActive ? "Aktiv" : "Inaktiv"}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary truncate">
                      {tier.price} kr/{tier.periodLabel} — {tier.benefits.length} fordeler
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 text-sm cursor-pointer border-2"
                      style={{ borderColor: "#0B3D4C", color: "#0B3D4C" }}
                      onClick={() => {
                        setEditingTier(tier);
                        setTierDialogOpen(true);
                      }}
                    >
                      Rediger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-10 px-4 text-sm font-medium cursor-pointer border-2 ${
                        tier.isActive
                          ? "border-gray-300 text-gray-600 hover:bg-gray-50"
                          : "border-teal text-teal hover:bg-teal/5"
                      }`}
                      onClick={() => handleToggleTier(tier.id)}
                    >
                      {tier.isActive ? "Deaktiver" : "Aktiver"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl bg-[#FFF0F4] border border-brand-pink/20">
            <p className="text-sm font-medium text-deep-teal mb-1">
              Tips for Kenneth:
            </p>
            <p className="text-sm text-text-secondary">
              Aktiver flere medlemskapsnivåer for å gi kundene flere valg. "Mest populær"-merket vises som en synlig etikett på det medlemskapet du ønsker å fremheve. Husk å oppdatere priser her hvis du endrer dem i andre systemer.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Tier edit dialog ── */}
      <TierEditDialog
        open={tierDialogOpen}
        onOpenChange={setTierDialogOpen}
        tier={editingTier}
        onSave={handleSaveTier}
        onDelete={handleDeleteTier}
      />

      {/* ── Reset confirmation dialog ── */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-2" style={{ borderColor: "#e8e2d9" }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: "#D93A6E" }}>
              <AlertTriangle size={22} />
              Bekreft tilbakestilling
            </DialogTitle>
            <DialogDescription className="text-sm" style={{ color: "#5a7a85" }}>
              Er du sikker på at du vil tilbakestille alle bilder til standard? Denne handlingen kan ikke angres.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-0 mt-4">
            <Button
              variant="outline"
              className="h-12 px-6 text-base font-medium cursor-pointer border-2"
              onClick={() => setResetDialogOpen(false)}
              style={{ borderColor: "#0B3D4C", color: "#0B3D4C" }}
            >
              Nei, avbryt
            </Button>
            <Button
              className="h-12 px-6 text-base font-semibold cursor-pointer"
              style={{ backgroundColor: "#D93A6E", color: "#F5F0EA" }}
              onClick={handleResetAll}
            >
              <RotateCcw size={18} className="mr-2" />
              Ja, tilbakestill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && <Toast {...toast} onClose={dismissToast} />}
    </div>
  );
}
