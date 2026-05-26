import { useState, useEffect } from "react";
import { getMembers, saveMember, deleteMember, getSaunas } from "@/data/store";
import type { Member, Sauna } from "@/data/types";
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
import { Users, Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [saunas, setSaunas] = useState<Sauna[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<Partial<Member>>({
    name: "",
    email: "",
    phone: "",
    tier: "danholmen",
    price: 349,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    isActive: true,
  });

  useEffect(() => {
    setMembers(getMembers());
    setSaunas(getSaunas());
  }, []);

  const openNew = () => {
    setEditingMember(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      tier: "danholmen",
      price: 349,
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditingMember(member);
    setForm({ ...member });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    const member: Member = {
      id: editingMember?.id || `member-${Date.now()}`,
      name: form.name || "",
      email: form.email || "",
      phone: form.phone || "",
      tier: form.tier || "danholmen",
      saunaId: form.saunaId,
      localAssociation: form.localAssociation,
      price: form.tier === "vel" ? 0 : (form.price || 349),
      startDate: form.startDate || format(new Date(), "yyyy-MM-dd"),
      endDate: form.endDate || format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      isActive: form.isActive ?? true,
      createdAt: editingMember?.createdAt || new Date().toISOString(),
    };
    saveMember(member);
    setMembers(getMembers());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette dette medlemmet?")) {
      deleteMember(id);
      setMembers(getMembers());
    }
  };

  const exportCSV = () => {
    const headers = ["Navn", "E-post", "Telefon", "Medlemskap", "Status", "Start", "Slutt"];
    const rows = members.map((m) => [
      m.name,
      m.email,
      m.phone,
      m.tier === "danholmen" ? "Danholmen Medlem" : `VEL - ${m.localAssociation || ""}`,
      m.isActive ? "Aktiv" : "Inaktiv",
      m.startDate,
      m.endDate,
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medlemmer-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const danholmenMembers = members.filter((m) => m.tier === "danholmen");
  const velMembers = members.filter((m) => m.tier === "vel");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Medlemmer</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Eksport CSV
          </Button>
          <Button size="sm" onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nytt medlem
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{danholmenMembers.length}</p>
            <p className="text-xs text-gray-500">Danholmen-medlemmer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{velMembers.length}</p>
            <p className="text-xs text-gray-500">VEL-medlemmer</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(member)} className="p-1.5 rounded-md hover:bg-gray-100">
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                  <button onClick={() => handleDelete(member.id)} className="p-1.5 rounded-md hover:bg-red-50">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Type:</span> {member.tier === "danholmen" ? "Danholmen" : "VEL"}</p>
                <p><span className="text-gray-500">Telefon:</span> {member.phone || "—"}</p>
                <p><span className="text-gray-500">Gyldig til:</span> {member.endDate}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${member.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {member.isActive ? "Aktiv" : "Inaktiv"}
                </span>
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
              <th className="text-left px-4 py-3 font-medium">E-post</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Gyldig til</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{member.name}</td>
                <td className="px-4 py-3 text-gray-600">{member.email}</td>
                <td className="px-4 py-3">
                  {member.tier === "danholmen" ? "Danholmen" : `VEL - ${member.localAssociation || ""}`}
                </td>
                <td className="px-4 py-3">{member.endDate}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${member.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {member.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(member)} className="p-1.5 rounded-md hover:bg-gray-100" title="Rediger">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="p-1.5 rounded-md hover:bg-red-50" title="Slett">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {members.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Ingen medlemmer ennå</p>
          <p className="text-sm text-gray-400">Klikk "Nytt medlem" for å legge til</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMember ? "Rediger medlem" : "Nytt medlem"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Navn *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fullt navn" />
            </div>
            <div className="space-y-1.5">
              <Label>E-post *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="epost@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+47 000 00 000" />
            </div>
            <div className="space-y-1.5">
              <Label>Medlemskapstype</Label>
              <Select value={form.tier} onValueChange={(v: "danholmen" | "vel") => setForm({ ...form, tier: v, price: v === "vel" ? 0 : 349 })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="danholmen">Danholmen Medlem (349 kr/mnd)</SelectItem>
                  <SelectItem value="vel">VEL-medlem (gratis)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.tier === "vel" && (
              <div className="space-y-1.5">
                <Label>Lokalforening</Label>
                <Select value={form.saunaId} onValueChange={(v) => {
                  const sauna = saunas.find((s) => s.id === v);
                  setForm({ ...form, saunaId: v, localAssociation: sauna?.localAssociationName || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Velg badstue" /></SelectTrigger>
                  <SelectContent>
                    {saunas.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.localAssociationName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
              <Label htmlFor="isActive" className="cursor-pointer">Aktivt medlemskap</Label>
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
