import { useState, useEffect } from "react";
import { getCampaigns, saveCampaign, deleteCampaign } from "@/data/store";
import type { Campaign } from "@/data/types";
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
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";

const TEMPLATES = [
  { value: "summer", label: "Sommerkampanje" },
  { value: "winter", label: "Vinterkampanje" },
  { value: "weekend", label: "Helgerabatt" },
  { value: "first-booking", label: "Første booking" },
  { value: "custom", label: "Egendefinert" },
];

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [form, setForm] = useState<Partial<Campaign>>({
    name: "",
    template: "custom",
    description: "",
    discountPercent: 10,
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    setCampaigns(getCampaigns());
  }, []);

  const openNew = () => {
    setEditingCampaign(null);
    setForm({
      name: "",
      template: "custom",
      description: "",
      discountPercent: 10,
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setForm({ ...campaign });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    const campaign: Campaign = {
      id: editingCampaign?.id || `campaign-${Date.now()}`,
      name: form.name || "",
      template: form.template || "custom",
      description: form.description || "",
      discountPercent: form.discountPercent || 0,
      startDate: form.startDate || "",
      endDate: form.endDate || "",
      isActive: form.isActive ?? true,
      usageCount: editingCampaign?.usageCount || 0,
      createdAt: editingCampaign?.createdAt || new Date().toISOString(),
    };
    saveCampaign(campaign);
    setCampaigns(getCampaigns());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne kampanjen?")) {
      deleteCampaign(id);
      setCampaigns(getCampaigns());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kampanjer</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Ny kampanje
        </Button>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-sm text-gray-500">{campaign.discountPercent}% rabatt</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(campaign)} className="p-1.5 rounded-md hover:bg-gray-100">
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                  <button onClick={() => handleDelete(campaign.id)} className="p-1.5 rounded-md hover:bg-red-50">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600">{campaign.description || "—"}</p>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Mal:</span> {TEMPLATES.find(t => t.value === campaign.template)?.label || campaign.template}</p>
                <p><span className="text-gray-500">Periode:</span> {campaign.startDate || "—"} til {campaign.endDate || "—"}</p>
                <p><span className="text-gray-500">Brukt:</span> {campaign.usageCount} ganger</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${campaign.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {campaign.isActive ? "Aktiv" : "Inaktiv"}
              </span>
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
              <th className="text-left px-4 py-3 font-medium">Mal</th>
              <th className="text-right px-4 py-3 font-medium">Rabatt</th>
              <th className="text-left px-4 py-3 font-medium">Periode</th>
              <th className="text-center px-4 py-3 font-medium">Brukt</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{campaign.name}</td>
                <td className="px-4 py-3">{TEMPLATES.find(t => t.value === campaign.template)?.label || campaign.template}</td>
                <td className="px-4 py-3 text-right">{campaign.discountPercent}%</td>
                <td className="px-4 py-3 text-gray-600">{campaign.startDate || "—"} til {campaign.endDate || "—"}</td>
                <td className="px-4 py-3 text-center">{campaign.usageCount}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${campaign.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {campaign.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(campaign)} className="p-1.5 rounded-md hover:bg-gray-100" title="Rediger">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(campaign.id)} className="p-1.5 rounded-md hover:bg-red-50" title="Slett">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Ingen kampanjer ennå</p>
          <p className="text-sm text-gray-400">Klikk "Ny kampanje" for å opprette</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Rediger kampanje" : "Ny kampanje"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Navn *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kampanjenavn" />
            </div>
            <div className="space-y-1.5">
              <Label>Mal</Label>
              <Select value={form.template} onValueChange={(v) => setForm({ ...form, template: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Beskrivelse</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Kort beskrivelse" />
            </div>
            <div className="space-y-1.5">
              <Label>Rabatt (%)</Label>
              <Input type="number" min={1} max={100} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Startdato</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sluttdato</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="campActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
              <Label htmlFor="campActive" className="cursor-pointer">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave}>Lagre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
