import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getSaunas, saveSauna, deleteSauna } from "@/data/store";
import type { Sauna } from "@/data/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flame,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Saunas() {
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSauna, setEditingSauna] = useState<Sauna | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Sauna>>({
    name: "",
    slug: "",
    location: "",
    description: "",
    capacity: 8,
    pricePerHour: 349,
    sharedPrice: 99,
    maxCapacity: 8,
    bookingModes: ["private", "shared"],
    offersMembership: true,
    offersVelDiscount: true,
    velDiscountRate: 0.25,
    localAssociationName: null,
    basicPrice: 349,
    premiumPrice: 349,
    platinumPrice: 349,
    openingHours: { open: "06:00", close: "22:00" },
  });

  useEffect(() => {
    setSaunas(getSaunas());
  }, []);

  const openNew = () => {
    setEditingSauna(null);
    setForm({
      name: "",
      slug: "",
      location: "Tønsberg",
      description: "",
      capacity: 8,
      pricePerHour: 349,
      sharedPrice: 99,
      maxCapacity: 8,
      bookingModes: ["private", "shared"],
      offersMembership: true,
      offersVelDiscount: true,
      velDiscountRate: 0.25,
      localAssociationName: null,
      basicPrice: 349,
      premiumPrice: 349,
      platinumPrice: 349,
      openingHours: { open: "06:00", close: "22:00" },
    });
    setDialogOpen(true);
  };

  const openEdit = (sauna: Sauna) => {
    setEditingSauna(sauna);
    setForm({ ...sauna });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.slug) return;
    const sauna: Sauna = {
      id: editingSauna?.id || `sauna-${Date.now()}`,
      name: form.name || "",
      slug: form.slug || "",
      location: form.location || "Tønsberg",
      description: form.description || "",
      image: editingSauna?.image || "",
      images: editingSauna?.images || [],
      capacity: form.capacity || 8,
      pricePerHour: form.pricePerHour || 349,
      sharedPrice: form.sharedPrice || 99,
      maxCapacity: form.maxCapacity || 8,
      bookingModes: (form.bookingModes as ("private" | "shared")[]) || ["private", "shared"],
      offersMembership: form.offersMembership ?? true,
      offersVelDiscount: form.offersVelDiscount ?? true,
      velDiscountRate: form.velDiscountRate ?? 0.25,
      localAssociationName: form.localAssociationName || null,
      basicPrice: form.basicPrice || 349,
      premiumPrice: form.premiumPrice || 349,
      platinumPrice: form.platinumPrice || 349,
      openingHours: form.openingHours || { open: "06:00", close: "22:00" },
      createdAt: editingSauna?.createdAt || new Date().toISOString(),
    };
    saveSauna(sauna);
    setSaunas(getSaunas());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne badstuen?")) {
      deleteSauna(id);
      setSaunas(getSaunas());
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/#/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Badstuer</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Ny badstue
        </Button>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {saunas.map((sauna) => (
          <Card key={sauna.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{sauna.name}</h3>
                  <p className="text-xs text-gray-500">{sauna.location}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(sauna)}
                    className="p-1.5 rounded-md hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(sauna.id)}
                    className="p-1.5 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-500">Privat:</span>{" "}
                  {sauna.pricePerHour} kr/t
                </p>
                <p>
                  <span className="text-gray-500">Felles:</span>{" "}
                  {sauna.sharedPrice} kr/pers
                </p>
                <p>
                  <span className="text-gray-500">Kapasitet:</span>{" "}
                  {sauna.capacity} pers
                </p>
                <p>
                  <span className="text-gray-500">Modus:</span>{" "}
                  {sauna.bookingModes.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                <button
                  onClick={() => copyLink(sauna.slug)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  {copiedId === sauna.slug ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedId === sauna.slug ? "Kopiert!" : "Kopier link"}
                </button>
                <Link
                  to={`/book/${sauna.slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  Åpne
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Navn</th>
              <th className="text-left px-4 py-3 font-medium">Lokasjon</th>
              <th className="text-right px-4 py-3 font-medium">Privat</th>
              <th className="text-right px-4 py-3 font-medium">Felles</th>
              <th className="text-center px-4 py-3 font-medium">Kapasitet</th>
              <th className="text-center px-4 py-3 font-medium">Modus</th>
              <th className="text-right px-4 py-3 font-medium">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {saunas.map((sauna) => (
              <tr key={sauna.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{sauna.name}</td>
                <td className="px-4 py-3 text-gray-600">{sauna.location}</td>
                <td className="px-4 py-3 text-right">
                  {sauna.pricePerHour} kr/t
                </td>
                <td className="px-4 py-3 text-right">
                  {sauna.sharedPrice} kr/pers
                </td>
                <td className="px-4 py-3 text-center">{sauna.capacity}</td>
                <td className="px-4 py-3 text-center">
                  {sauna.bookingModes.join(", ")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => copyLink(sauna.slug)}
                      className="p-1.5 rounded-md hover:bg-gray-100"
                      title="Kopier booking-link"
                    >
                      {copiedId === sauna.slug ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <Link
                      to={`/book/${sauna.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-md hover:bg-gray-100"
                      title="Åpne"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                    </Link>
                    <button
                      onClick={() => openEdit(sauna)}
                      className="p-1.5 rounded-md hover:bg-gray-100"
                      title="Rediger"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(sauna.id)}
                      className="p-1.5 rounded-md hover:bg-red-50"
                      title="Slett"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSauna ? "Rediger badstue" : "Ny badstue"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Navn</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Badstuens navn"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    })
                  }
                  placeholder="badstue-navn"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Beskrivelse</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Kort beskrivelse"
              />
              <p className="text-xs text-gray-400">
                Brukes som meta-beskrivelse og i lister
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Privat pris (kr/t)</Label>
                <Input
                  type="number"
                  value={form.pricePerHour}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pricePerHour: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Felles pris (kr/pers)</Label>
                <Input
                  type="number"
                  value={form.sharedPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sharedPrice: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kapasitet</Label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Maks felles-kapasitet</Label>
                <Input
                  type="number"
                  value={form.maxCapacity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxCapacity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tilgjengelige booking-modus</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.bookingModes?.includes("private")}
                    onChange={(e) => {
                      const modes = new Set(form.bookingModes || []);
                      if (e.target.checked) modes.add("private");
                      else modes.delete("private");
                      setForm({
                        ...form,
                        bookingModes: Array.from(modes) as ("private" | "shared")[],
                      });
                    }}
                    className="rounded"
                  />
                  Privat
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.bookingModes?.includes("shared")}
                    onChange={(e) => {
                      const modes = new Set(form.bookingModes || []);
                      if (e.target.checked) modes.add("shared");
                      else modes.delete("shared");
                      setForm({
                        ...form,
                        bookingModes: Array.from(modes) as ("private" | "shared")[],
                      });
                    }}
                    className="rounded"
                  />
                  Felles
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>VEL-navn</Label>
                <Input
                  value={form.localAssociationName || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      localAssociationName: e.target.value || null,
                    })
                  }
                  placeholder="f.eks. Arås Båthavn"
                />
              </div>
              <div className="space-y-1.5">
                <Label>VEL-rabatt (%)</Label>
                <Input
                  type="number"
                  value={((form.velDiscountRate || 0) * 100).toString()}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      velDiscountRate: (parseInt(e.target.value) || 0) / 100,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
