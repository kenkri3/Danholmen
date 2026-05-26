import type { Sauna, Booking, Member, DiscountCode, Campaign, Admin, SystemConfig } from "./types";
import { mockSaunas, mockAdmin, defaultSystemConfig, initialBookings, initialMembers, initialDiscountCodes, initialCampaigns } from "./mockData";

const KEYS = {
  saunas: "danholmen_saunas",
  bookings: "danholmen_bookings",
  members: "danholmen_members",
  admins: "danholmen_admins",
  discountCodes: "danholmen_discountCodes",
  campaigns: "danholmen_campaigns",
  config: "danholmen_config",
  adminSession: "danholmen_admin_session",
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initStore(): void {
  if (!localStorage.getItem(KEYS.saunas)) setItem(KEYS.saunas, mockSaunas);
  if (!localStorage.getItem(KEYS.admins)) setItem(KEYS.admins, [mockAdmin]);
  if (!localStorage.getItem(KEYS.bookings)) setItem(KEYS.bookings, initialBookings);
  if (!localStorage.getItem(KEYS.members)) setItem(KEYS.members, initialMembers);
  if (!localStorage.getItem(KEYS.discountCodes)) setItem(KEYS.discountCodes, initialDiscountCodes);
  if (!localStorage.getItem(KEYS.campaigns)) setItem(KEYS.campaigns, initialCampaigns);
  if (!localStorage.getItem(KEYS.config)) setItem(KEYS.config, defaultSystemConfig);
}

// Saunas
export function getSaunas(): Sauna[] { return getItem(KEYS.saunas, mockSaunas); }
export function saveSauna(sauna: Sauna): void {
  const all = getSaunas();
  const idx = all.findIndex(s => s.id === sauna.id);
  if (idx >= 0) all[idx] = sauna;
  else all.push(sauna);
  setItem(KEYS.saunas, all);
}
export function deleteSauna(id: string): void {
  setItem(KEYS.saunas, getSaunas().filter(s => s.id !== id));
}

// Bookings
export function getBookings(): Booking[] { return getItem(KEYS.bookings, []); }
export function saveBooking(booking: Booking): void {
  const all = getBookings();
  const idx = all.findIndex(b => b.id === booking.id);
  if (idx >= 0) all[idx] = booking;
  else all.push(booking);
  setItem(KEYS.bookings, all);
}
export function deleteBooking(id: string): void {
  setItem(KEYS.bookings, getBookings().filter(b => b.id !== id));
}

// Members
export function getMembers(): Member[] { return getItem(KEYS.members, []); }
export function saveMember(member: Member): void {
  const all = getMembers();
  const idx = all.findIndex(m => m.id === member.id);
  if (idx >= 0) all[idx] = member;
  else all.push(member);
  setItem(KEYS.members, all);
}
export function deleteMember(id: string): void {
  setItem(KEYS.members, getMembers().filter(m => m.id !== id));
}

// Discount Codes
export function getDiscountCodes(): DiscountCode[] { return getItem(KEYS.discountCodes, []); }
export function saveDiscountCode(code: DiscountCode): void {
  const all = getDiscountCodes();
  const idx = all.findIndex(c => c.id === code.id);
  if (idx >= 0) all[idx] = code;
  else all.push(code);
  setItem(KEYS.discountCodes, all);
}
export function deleteDiscountCode(id: string): void {
  setItem(KEYS.discountCodes, getDiscountCodes().filter(c => c.id !== id));
}

// Campaigns
export function getCampaigns(): Campaign[] { return getItem(KEYS.campaigns, []); }
export function saveCampaign(campaign: Campaign): void {
  const all = getCampaigns();
  const idx = all.findIndex(c => c.id === campaign.id);
  if (idx >= 0) all[idx] = campaign;
  else all.push(campaign);
  setItem(KEYS.campaigns, all);
}
export function deleteCampaign(id: string): void {
  setItem(KEYS.campaigns, getCampaigns().filter(c => c.id !== id));
}

// Admins / Auth
export function getAdmins(): Admin[] { return getItem(KEYS.admins, [mockAdmin]); }
export function login(email: string, password: string): Admin | null {
  const admins = getAdmins();
  const found = admins.find(a => a.email === email && a.password === password);
  if (found) {
    setItem(KEYS.adminSession, { adminId: found.id, email: found.email, name: found.name, loggedInAt: new Date().toISOString() });
  }
  return found || null;
}
export function logout(): void {
  localStorage.removeItem(KEYS.adminSession);
}
export function getAdminSession(): { adminId: string; email: string; name: string; loggedInAt: string } | null {
  return getItem(KEYS.adminSession, null);
}
export function isLoggedIn(): boolean {
  return !!getAdminSession();
}

// Payments (derived from bookings)
export function getPayments(): Booking[] {
  return getBookings().filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "awaiting_payment");
}
export function getSystemConfig(): SystemConfig { return getItem(KEYS.config, defaultSystemConfig); }
export function saveSystemConfig(config: SystemConfig): void {
  setItem(KEYS.config, config);
}
