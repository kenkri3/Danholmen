import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Eye,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  getAdmins,
  getSaunas,
  saveAdmin,
  deleteAdmin,
  getCurrentAdmin,
} from "@/data/store";
import type { AdminUser, AdminRole, PermissionLevel } from "@/data/types";

const roleConfig: Record<
  AdminRole,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  superadmin: {
    label: "Superadmin",
    icon: ShieldCheck,
    color: "text-success",
    bg: "bg-success/10",
  },
  manager: {
    label: "Manager",
    icon: Shield,
    color: "text-teal",
    bg: "bg-teal/10",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "text-text-muted",
    bg: "bg-gray-100",
  },
};

const permissionLabels: Record<string, string> = {
  bookings: "Bookinger",
  members: "Medlemmer",
  discounts: "Rabattkoder",
  reports: "Rapporter",
  saunas: "Badstuer",
  admins: "Administratorer",
};

const permissionOrder = [
  "bookings",
  "members",
  "discounts",
  "reports",
  "saunas",
  "admins",
];

function RoleBadge({ role }: { role: AdminRole }) {
  const config = roleConfig[role];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function VisibilityBadge({
  canViewAll,
  role,
}: {
  canViewAll: boolean;
  role: AdminRole;
}) {
  if (role === "superadmin") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
        Alle badstuer
      </span>
    );
  }
  return canViewAll ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
      Alle badstuer
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
      Kun tildelte
    </span>
  );
}

const emptyAdmin: Omit<AdminUser, "id"> = {
  name: "",
  email: "",
  password: "",
  role: "viewer",
  assignedSaunas: [],
  canViewAllSaunas: false,
  permissions: {
    bookings: "R",
    members: "R",
    discounts: "R",
    reports: "R",
    saunas: "R",
    admins: "R",
  },
  isActive: true,
  lastLoginAt: "",
  createdAt: "",
};

export default function Admins() {
  const currentAdmin = getCurrentAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>(() => getAdmins());
  const [saunas, setSaunas] = useState<ReturnType<typeof getSaunas>>(() =>
    getSaunas()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<Omit<AdminUser, "id">>({ ...emptyAdmin });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function refreshData() {
    setAdmins(getAdmins());
    setSaunas(getSaunas());
  }

  function openAddModal() {
    setEditingAdmin(null);
    setForm({
      ...emptyAdmin,
      canViewAllSaunas: false, // default OFF for new Viewer
      createdAt: new Date().toISOString(),
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function openEditModal(admin: AdminUser) {
    setEditingAdmin(admin);
    setForm({ ...admin });
    setErrors({});
    setIsModalOpen(true);
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Navn er påkrevd";
    if (!form.email.trim()) newErrors.email = "E-post er påkrevd";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Ugyldig e-post";
    if (form.role !== "superadmin" && form.assignedSaunas.length === 0)
      newErrors.assignedSaunas = "Minst én badstue må tildeles";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSave() {
    if (!validateForm()) return;

    const payload: AdminUser = {
      ...form,
      id: editingAdmin?.id ?? `admin-${Date.now()}`,
      lastLoginAt: editingAdmin?.lastLoginAt ?? "",
      createdAt: editingAdmin?.createdAt ?? new Date().toISOString(),
    };

    // Superadmin always sees everything
    if (payload.role === "superadmin") {
      payload.canViewAllSaunas = true;
    }

    saveAdmin(payload);
    refreshData();
    setIsModalOpen(false);
  }

  function handleDelete(adminId: string) {
    if (window.confirm("Er du sikker på at du vil slette denne administratoren?")) {
      deleteAdmin(adminId);
      refreshData();
    }
  }

  function handleRoleChange(role: AdminRole) {
    setForm((prev) => {
      const next = { ...prev, role };
      if (role === "superadmin") {
        next.canViewAllSaunas = true;
        next.permissions = {
          bookings: "CRUD",
          members: "CRUD",
          discounts: "CRUD",
          reports: "R",
          saunas: "CRUD",
          admins: "CRUD",
        };
      } else if (role === "manager") {
        next.canViewAllSaunas = true; // default ON for Manager
        next.permissions = {
          bookings: "CRUD",
          members: "CRUD",
          discounts: "CRUD",
          reports: "R",
          saunas: "R",
          admins: "R",
        };
      } else {
        next.canViewAllSaunas = false; // default OFF for Viewer
        next.permissions = {
          bookings: "R",
          members: "R",
          discounts: "R",
          reports: "R",
          saunas: "R",
          admins: "R",
        };
      }
      return next;
    });
  }

  function toggleSauna(saunaId: string) {
    setForm((prev) => ({
      ...prev,
      assignedSaunas: prev.assignedSaunas.includes(saunaId)
        ? prev.assignedSaunas.filter((s) => s !== saunaId)
        : [...prev.assignedSaunas, saunaId],
    }));
  }

  const canManageAdmins = currentAdmin?.role === "superadmin";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Administratorer"
        description="Brukeradministrasjon og roller"
      />

      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-secondary">
          {admins.length} administrator{admins.length !== 1 ? "er" : ""}
        </p>
        {canManageAdmins && (
          <Button
            onClick={openAddModal}
            className="bg-teal hover:bg-teal/90 text-white"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ny administrator</span>
          </Button>
        )}
      </div>

      {/* Admin table — Desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#DDD6CC] shadow-card overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow className="bg-off-white/50">
              <TableHead className="font-semibold text-text-primary">
                Navn
              </TableHead>
              <TableHead className="font-semibold text-text-primary">
                E-post
              </TableHead>
              <TableHead className="font-semibold text-text-primary">
                Rolle
              </TableHead>
              <TableHead className="font-semibold text-text-primary">
                Synlighet
              </TableHead>
              <TableHead className="font-semibold text-text-primary">
                Tildelte badstuer
              </TableHead>
              <TableHead className="font-semibold text-text-primary">
                Status
              </TableHead>
              <TableHead className="font-semibold text-text-primary text-right">
                Handlinger
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {admins.map((admin, idx) => (
                <motion.tr
                  key={admin.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium text-text-primary">
                    {admin.name}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {admin.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={admin.role} />
                  </TableCell>
                  <TableCell>
                    <VisibilityBadge
                      canViewAll={admin.canViewAllSaunas}
                      role={admin.role}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {admin.assignedSaunas.length === saunas.length ? (
                        <span className="text-xs text-text-muted">
                          Alle
                        </span>
                      ) : admin.assignedSaunas.length === 0 ? (
                        <span className="text-xs text-text-muted">Ingen</span>
                      ) : (
                        admin.assignedSaunas.map((sid) => {
                          const sauna = saunas.find((s) => s.id === sid);
                          return (
                            <span
                              key={sid}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-off-white text-text-secondary"
                            >
                              {sauna?.name ?? sid}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {admin.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                        <Check className="w-3 h-3" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                        <X className="w-3 h-3" />
                        Inaktiv
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditModal(admin)}
                        className="text-text-muted hover:text-teal"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {canManageAdmins && admin.id !== currentAdmin?.id && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(admin.id)}
                          className="text-text-muted hover:text-sauna-red"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Admin cards — Mobile */}
      <div className="md:hidden space-y-3 mb-8">
        {admins.length === 0 ? (
          <div className="card-base p-8 text-center">
            <Shield className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-sm text-text-muted">Ingen administratorer</p>
          </div>
        ) : (
          admins.map((admin, idx) => (
            <motion.div
              key={admin.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="card-base p-4"
            >
              {/* Name + actions row */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {admin.name}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {admin.email}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditModal(admin)}
                    className="text-text-muted hover:text-teal h-8 w-8"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {canManageAdmins && admin.id !== currentAdmin?.id && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(admin.id)}
                      className="text-text-muted hover:text-sauna-red h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Role + visibility badges */}
              <div className="flex flex-wrap gap-2 mb-2">
                <RoleBadge role={admin.role} />
                <VisibilityBadge
                  canViewAll={admin.canViewAllSaunas}
                  role={admin.role}
                />
                {admin.isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                    <Check className="w-3 h-3" />
                    Aktiv
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    <X className="w-3 h-3" />
                    Inaktiv
                  </span>
                )}
              </div>

              {/* Assigned saunas */}
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] text-text-muted mr-1">Badstuer:</span>
                {admin.assignedSaunas.length === saunas.length ? (
                  <span className="text-xs text-text-secondary">Alle</span>
                ) : admin.assignedSaunas.length === 0 ? (
                  <span className="text-xs text-text-muted">Ingen</span>
                ) : (
                  admin.assignedSaunas.map((sid) => {
                    const sauna = saunas.find((s) => s.id === sid);
                    return (
                      <span
                        key={sid}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-off-white text-text-secondary"
                      >
                        {sauna?.name ?? sid}
                      </span>
                    );
                  })
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Permission matrix — Desktop — EXPLICITLY hidden on small screens */}
      <div className="hidden md:block mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-6"
        >
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">
          Rettigheter og synlighet
        </h2>
        <div className="overflow-x-auto scrollbar-hide">
          <Table className="min-w-0 w-full">
            <TableHeader>
              <TableRow className="bg-off-white/50">
                <TableHead className="font-semibold text-text-primary whitespace-normal">
                  Rettighet
                </TableHead>
                <TableHead className="font-semibold text-text-primary text-center">
                  Super
                </TableHead>
                <TableHead className="font-semibold text-text-primary text-center">
                  Manager
                </TableHead>
                <TableHead className="font-semibold text-text-primary text-center">
                  Viewer
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionOrder.map((key) => (
                <TableRow key={key} className="border-b">
                  <TableCell className="font-medium text-text-primary text-sm">
                    {permissionLabels[key]}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
                      CRUD
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionValue
                      level={
                        key === "admins"
                          ? "R"
                          : key === "saunas"
                            ? "R"
                            : "CRUD"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <PermissionValue level="R" />
                  </TableCell>
                </TableRow>
              ))}
              {/* Se alle badstuer row */}
              <TableRow className="border-b bg-amber-50/30">
                <TableCell className="font-medium text-text-primary text-sm">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-warm-amber" />
                    Se alle badstuer
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <Check className="w-3 h-3" />
                    Alltid
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warm-amber/10 text-warm-amber">
                    Konfigurerbar
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warm-amber/10 text-warm-amber">
                    Konfigurerbar
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>
        </motion.div>
      </div>

      {/* Permission matrix — Mobile — EXPLICITLY shown only on small screens */}
      <div className="md:hidden mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#DDD6CC] shadow-card p-4"
        >
        <h2 className="font-display text-base font-bold text-text-primary mb-3">
          Rettigheter og synlighet
        </h2>
        <div className="space-y-2">
          {permissionOrder.map((key) => (
            <div key={key} className="flex items-center justify-between p-2.5 rounded-lg border border-[#F5F0EB]">
              <span className="text-sm font-medium text-text-primary">{permissionLabels[key]}</span>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success">S:CRUD</span>
                <PermissionValue level={key === "admins" || key === "saunas" ? "R" : "CRUD"} />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#F5F0EB] bg-amber-50/30">
            <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
              <Eye className="w-3.5 h-3.5 text-warm-amber" />
              Se alle badstuer
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                <Check className="w-3 h-3" /> Altid
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingAdmin ? "Rediger administrator" : "Ny administrator"}
            </DialogTitle>
            <DialogDescription>
              {editingAdmin
                ? "Oppdater administratorens detaljer og rettigheter."
                : "Fyll inn informasjon for å opprette en ny administrator."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="admin-name">Navn *</Label>
              <Input
                id="admin-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Fullt navn"
              />
              {errors.name && (
                <p className="text-xs text-sauna-red">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="admin-email">E-post *</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="epost@danholmen.no"
              />
              {errors.email && (
                <p className="text-xs text-sauna-red">{errors.email}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Rolle</Label>
              <div className="flex gap-2">
                {(["manager", "viewer"] as AdminRole[]).map((r) => {
                  const config = roleConfig[r];
                  const Icon = config.icon;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        form.role === r
                          ? "border-teal bg-teal/5 text-teal"
                          : "border-[#DDD6CC] text-text-secondary hover:border-teal/30"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* canViewAllSaunas toggle */}
            {form.role !== "superadmin" && (
              <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[#DDD6CC] bg-off-white/30">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="view-all-saunas"
                    className="text-sm font-medium text-text-primary"
                  >
                    Se alle badstuer i systemet
                  </Label>
                  <p className="text-xs text-text-muted">
                    Av = ser kun tildelte badstuer
                  </p>
                </div>
                <Switch
                  id="view-all-saunas"
                  checked={form.canViewAllSaunas}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      canViewAllSaunas: checked,
                    }))
                  }
                />
              </div>
            )}

            {/* Assigned saunas */}
            {form.role !== "superadmin" && (
              <div className="space-y-2">
                <Label>Tildelte badstuer *</Label>
                <div className="space-y-2">
                  {saunas.map((sauna) => (
                    <label
                      key={sauna.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-[#DDD6CC] hover:bg-off-white/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedSaunas.includes(sauna.id)}
                        onChange={() => toggleSauna(sauna.id)}
                        className="rounded border-[#DDD6CC] text-teal focus:ring-teal"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          {sauna.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {sauna.location}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.assignedSaunas && (
                  <p className="text-xs text-sauna-red">
                    {errors.assignedSaunas}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              className="bg-teal hover:bg-teal/90 text-white"
            >
              {editingAdmin ? "Lagre endringer" : "Opprett administrator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function PermissionValue({ level }: { level: PermissionLevel }) {
  if (level === "CRUD") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
        CRUD
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal/10 text-teal">
      R
    </span>
  );
}
