import { useState, useEffect } from "react";
import { getDiscountCodes, saveDiscountCode, deleteDiscountCode } from "@/data/store";
import type { DiscountCode } from "@/data/types";
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
import { Tag, Plus, Pencil, Trash2 } from "lucide-react";

export default function Discounts() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [form, setForm] = useState<Partial<DiscountCode>>({
    code: "",
    type: "percentage",
    value: 10,
    startDate: "",
    endDate: "",
    maxUses: 100,
    saunaIds: null,
    isActive: true,
  });

  useEffect(() => {
    setCodes(getDiscountCodes());
  }, []);

  const openNew = () => {
    setEditingCode(null);
    setForm({
      code: "",
      type: "percentage",
      value: 10,
      startDate: "",
      endDate: "",
      maxUses: 100,
      saunaIds: null,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setForm({ ...code });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.code || !form.value) return;
    const code: DiscountCode = {
      id: editingCode?.id || `discount-${Date.now()}`,
      code: form.code.toUpperCase(),
      type: form.type || "percentage",
      value: form.value || 0,
      startDate: form.startDate || "",
      endDate: form.endDate || "",
      maxUses: form.maxUses || 100,
      usedCount: editingCode?.usedCount || 0,
      saunaIds: form.saunaIds || null,
      isActive: form.isActive ?? true,
      createdAt: editingCode?.createdAt || new Date().toISOString(),
    };
    saveDiscountCode(code);
    setCodes(getDiscountCodes());
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Er du sikker på at du vil slette denne rabattkoden?")) {
      deleteDiscountCode(id);
      setCodes(getDiscountCodes());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rabattkoder</h1>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Ny kode
        </Button>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {codes.map((code) => (
          <Card key={code.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{code.code}</h3>
                  <p className="text-sm text-gray-500">
                    {code.type === "percentage" ? `${code.value}%` : `${code.value} kr`} rabatt
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(code)} className="p-1.5 rounded-md hover:bg-gray-100">
                    <Pencil className="h-4 w-4 text-gray-600" />
                  </button>
                  <button onClick={() => handleDelete(code.id)} className="p-1.5 rounded-md hover:bg-red-50">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Brukt:</span> {code.usedCount} / {code.maxUses}</p>
                <p><span className="text-gray-500">Gyldig:</span> {code.startDate || "—"} til {code.endDate || "—"}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${code.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {code.isActive ? "Aktiv" : "Inaktiv"}
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
              <th className="text-left px-4 py-3 font-medium">Kode</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-right px-4 py-3 font-medium">Verdi</th>
              <th className="text-left px-4 py-3 font-medium">Gyldig</th>
              <th className="text-center px-4 py-3 font-medium">Brukt</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {codes.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{code.code}</td>
                <td className="px-4 py-3">{code.type === "percentage" ? "Prosent" : "Fast beløp"}</td>
                <td className="px-4 py-3 text-right">{code.type === "percentage" ? `${code.value}%` : `${code.value} kr`}</td>
                <td className="px-4 py-3 text-gray-600">{code.startDate || "—"} til {code.endDate || "—"}</td>
                <td className="px-4 py-3 text-center">{code.usedCount} / {code.maxUses}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${code.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {code.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(code)} className="p-1.5 rounded-md hover:bg-gray-100" title="Rediger">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(code.id)} className="p-1.5 rounded-md hover:bg-red-50" title="Slett">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {codes.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Ingen rabattkoder ennå</p>
          <p className="text-sm text-gray-400">Klikk "Ny kode" for å opprette</p>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Rediger rabattkode" : "Ny rabattkode"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Kode *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SOMMER2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: "percentage" | "fixed") => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Prosent (%)</SelectItem>
                    <SelectItem value="fixed">Fast beløp (kr)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Verdi</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })} />
              </div>
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
            <div className="space-y-1.5">
              <Label>Maks antall bruk</Label>
              <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="dcActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
              <Label htmlFor="dcActive" className="cursor-pointer">Aktiv</Label>
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
