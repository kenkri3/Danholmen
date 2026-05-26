import type {
  Sauna,
  Booking,
  Member,
  AdminUser,
  DiscountCode,
  SystemConfig,
  BookingStatus,
  BookingType,
  BookingMode,
  PaymentStatus,
  PaymentIntent,
  Campaign,
} from "./types";
import {
  mockSaunas,
  mockBookings,
  mockMembers,
  mockAdmins,
  mockDiscountCodes,
  mockSystemConfig,
  mockCampaigns,
} from "./mockData";

// ------------------------------------------------------------------
// Keys
// ------------------------------------------------------------------
const KEYS = {
  saunas: "danholmen_saunas",
  bookings: "danholmen_bookings",
  members: "danholmen_members",
  admins: "danholmen_admins",
  discounts: "danholmen_discounts",
  campaigns: "danholmen_campaigns",
  currentAdmin: "danholmen_current_admin",
  currentMember: "danholmen_current_member",
  paymentIntents: "danholmen_payments",
  config: "danholmen_config",
} as const;

// ------------------------------------------------------------------
// Generic helpers
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// Init
// ------------------------------------------------------------------
export function initStore(): void {
  if (!localStorage.getItem(KEYS.saunas))
    setItem(KEYS.saunas, mockSaunas);
  if (!localStorage.getItem(KEYS.bookings))
    setItem(KEYS.bookings, mockBookings);
  if (!localStorage.getItem(KEYS.members))
    setItem(KEYS.members, mockMembers);
  if (!localStorage.getItem(KEYS.admins))
    setItem(KEYS.admins, mockAdmins);
  if (!localStorage.getItem(KEYS.discounts))
    setItem(KEYS.discounts, mockDiscountCodes);
  if (!localStorage.getItem(KEYS.campaigns))
    setItem(KEYS.campaigns, mockCampaigns);
  if (!localStorage.getItem(KEYS.config))
    setItem(KEYS.config, mockSystemConfig);
}

// ------------------------------------------------------------------
// Saunas
// ------------------------------------------------------------------
export function getSaunas(): Sauna[] {
  return getItem<Sauna[]>(KEYS.saunas, mockSaunas);
}

export function getSaunaById(id: string): Sauna | undefined {
  return getSaunas().find((s) => s.id === id);
}

export function getSaunaBySlug(slug: string): Sauna | undefined {
  return getSaunas().find((s) => s.publicSlug === slug || s.slug === slug);
}

export function getSaunaImages(saunaId: string): string[] {
  const sauna = getSaunaById(saunaId);
  return sauna?.images ?? [];
}

export function updateSaunaImage(saunaId: string, imageUrl: string): void {
  const saunas = getSaunas();
  const idx = saunas.findIndex((s) => s.id === saunaId);
  if (idx >= 0) {
    saunas[idx].image = imageUrl;
    if (!saunas[idx].images.includes(imageUrl)) {
      saunas[idx].images.push(imageUrl);
    }
    setItem(KEYS.saunas, saunas);
  }
}

export function saveSauna(sauna: Sauna): void {
  const items = getSaunas();
  const idx = items.findIndex((s) => s.id === sauna.id);
  if (idx >= 0) {
    items[idx] = sauna;
  } else {
    items.push(sauna);
  }
  setItem(KEYS.saunas, items);
}

export function deleteSauna(id: string): void {
  setItem(
    KEYS.saunas,
    getSaunas().filter((s) => s.id !== id)
  );
}

// ------------------------------------------------------------------
// Bookings
// ------------------------------------------------------------------
export function getBookings(): Booking[] {
  return getItem<Booking[]>(KEYS.bookings, mockBookings);
}

export function getBookingById(id: string): Booking | undefined {
  return getBookings().find((b) => b.id === id);
}

export function getBookingsBySauna(saunaId: string): Booking[] {
  return getBookings().filter((b) => b.saunaId === saunaId);
}

export function getBookingsByDate(date: string): Booking[] {
  return getBookings().filter((b) => b.date === date);
}

export function getBookingsBySaunaAndDate(
  saunaId: string,
  date: string
): Booking[] {
  return getBookings().filter((b) => b.saunaId === saunaId && b.date === date);
}

export function getPublicBookings(): Booking[] {
  return getBookings().filter(
    (b) => (b.status === "confirmed" || b.status === "awaiting_payment") && !b.isInternal
  );
}

export function getPendingPaymentBookings(): Booking[] {
  return getBookings().filter(
    (b) => b.status === "awaiting_payment"
  );
}

export function getMemberBookings(memberId: string): Booking[] {
  return getBookings().filter((b) => b.memberId === memberId);
}

export function saveBooking(booking: Booking): void {
  const items = getBookings();
  const idx = items.findIndex((b) => b.id === booking.id);
  if (idx >= 0) {
    items[idx] = booking;
  } else {
    items.push(booking);
  }
  setItem(KEYS.bookings, items);
}

export function cancelBooking(id: string): void {
  const items = getBookings();
  const idx = items.findIndex((b) => b.id === id);
  if (idx >= 0) {
    items[idx].status = "cancelled" as BookingStatus;
    items[idx].cancelledAt = new Date().toISOString();
    setItem(KEYS.bookings, items);
  }
}

export function deleteBooking(id: string): void {
  setItem(
    KEYS.bookings,
    getBookings().filter((b) => b.id !== id)
  );
}

export function updateBookingPaymentStatus(
  bookingId: string,
  paymentStatus: PaymentStatus,
  stripeSessionId?: string
): void {
  const items = getBookings();
  const idx = items.findIndex((b) => b.id === bookingId);
  if (idx >= 0) {
    items[idx].paymentStatus = paymentStatus;
    if (stripeSessionId) {
      items[idx].stripeSessionId = stripeSessionId;
    }
    setItem(KEYS.bookings, items);
  }
}

// ------------------------------------------------------------------
// Booking conflict checking (respects sauna bookingModes)
// ------------------------------------------------------------------

/**
 * Check if a booking conflicts with existing bookings for a given slot.
 * Used by booking wizards to determine slot availability.
 */
export function checkBookingConflict(
  sauna: Sauna,
  date: string,
  startTime: string,
  type: BookingType,
  existingBookings: Booking[]
): boolean {
  const sameSlotBookings = existingBookings.filter(
    (b) =>
      b.saunaId === sauna.id &&
      b.date === date &&
      b.startTime === startTime &&
      b.status !== "cancelled"
  );

  if (type === "private") {
    // Private booking: ALWAYS blocks the entire slot
    return sameSlotBookings.length > 0;
  }

  if (type === "felles") {
    // Shared booking: blocked if there's a PRIVATE booking, OR if capacity is full
    const hasPrivateBooking = sameSlotBookings.some((b) => b.type === "private");
    if (hasPrivateBooking) return true;

    const sharedBookings = sameSlotBookings.filter((b) => b.type === "felles");
    const totalParticipants = sharedBookings.reduce(
      (sum, b) => sum + b.participantCount,
      0
    );
    return totalParticipants >= (sauna.capacity || 8);
  }

  // Internal bookings always check against existing
  return sameSlotBookings.length > 0;
}

/**
 * Get a human-readable availability label for a time slot.
 * Returns Norwegian labels with color hints.
 */
export function getSlotAvailabilityLabel(
  sauna: Sauna,
  date: string,
  startTime: string,
  existingBookings: Booking[]
): { label: string; status: "available" | "partial" | "booked" | "private_booked" } {
  const sameSlotBookings = existingBookings.filter(
    (b) =>
      b.saunaId === sauna.id &&
      b.date === date &&
      b.startTime === startTime &&
      b.status !== "cancelled"
  );

  const hasPrivateBooking = sameSlotBookings.some((b) => b.type === "private");
  if (hasPrivateBooking) {
    return { label: "Privat opptatt", status: "private_booked" };
  }

  const sharedBookings = sameSlotBookings.filter((b) => b.type === "felles");
  const totalParticipants = sharedBookings.reduce(
    (sum, b) => sum + b.participantCount,
    0
  );

  if (totalParticipants >= (sauna.capacity || 8)) {
    return { label: "Fullt", status: "booked" };
  }

  if (totalParticipants > 0) {
    return { label: `${sauna.capacity - totalParticipants} plasser`, status: "partial" };
  }

  return { label: "Ledig", status: "available" };
}

/**
 * Check if a booking type is allowed for a sauna based on its bookingModes.
 * Maps "felles" BookingType to "shared" BookingMode.
 */
export function isBookingTypeAllowed(
  sauna: Sauna,
  type: BookingType
): boolean {
  if (type === "internal") return true; // Internal bookings always allowed
  const mode: BookingMode = type === "private" ? "private" : "shared";
  return sauna.bookingModes?.includes(mode) ?? true;
}

// ------------------------------------------------------------------
// Members
// ------------------------------------------------------------------
export function getMembers(): Member[] {
  return getItem<Member[]>(KEYS.members, mockMembers);
}

export function getMemberById(id: string): Member | undefined {
  return getMembers().find((m) => m.id === id);
}

export function getMemberByEmail(email: string): Member | undefined {
  return getMembers().find(
    (m) => m.email.toLowerCase() === email.toLowerCase()
  );
}

export function saveMember(member: Member): void {
  const items = getMembers();
  const idx = items.findIndex((m) => m.id === member.id);
  if (idx >= 0) {
    items[idx] = member;
  } else {
    items.push(member);
  }
  setItem(KEYS.members, items);
}

export function deleteMember(id: string): void {
  setItem(
    KEYS.members,
    getMembers().filter((m) => m.id !== id)
  );
}

// ------------------------------------------------------------------
// Member Auth
// ------------------------------------------------------------------
export function setCurrentMember(member: Member): void {
  setItem(KEYS.currentMember, member);
}

export function getCurrentMember(): Member | null {
  return getItem<Member | null>(KEYS.currentMember, null);
}

export function clearCurrentMember(): void {
  localStorage.removeItem(KEYS.currentMember);
}

export function memberLogin(email: string, password: string): Member | null {
  const member = getMemberByEmail(email);
  if (member && member.isActive && member.password === password) {
    setCurrentMember(member);
    // Update bookings count and total spent
    const bookings = getMemberBookings(member.id);
    member.bookingsCount = bookings.length;
    member.totalSpent = bookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + b.totalPrice, 0);
    saveMember(member);
    return member;
  }
  return null;
}

// ------------------------------------------------------------------
// Admins
// ------------------------------------------------------------------
export function getAdmins(): AdminUser[] {
  return getItem<AdminUser[]>(KEYS.admins, mockAdmins);
}

export function getAdminById(id: string): AdminUser | undefined {
  return getAdmins().find((a) => a.id === id);
}

export function getAdminByEmail(email: string): AdminUser | undefined {
  return getAdmins().find(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
}

export function saveAdmin(admin: AdminUser): void {
  const items = getAdmins();
  const idx = items.findIndex((a) => a.id === admin.id);
  if (idx >= 0) {
    items[idx] = admin;
  } else {
    items.push(admin);
  }
  setItem(KEYS.admins, items);
}

export function deleteAdmin(id: string): void {
  setItem(
    KEYS.admins,
    getAdmins().filter((a) => a.id !== id)
  );
}

// ------------------------------------------------------------------
// Admin Auth
// ------------------------------------------------------------------
export function setCurrentAdmin(admin: AdminUser): void {
  setItem(KEYS.currentAdmin, admin);
}

export function getCurrentAdmin(): AdminUser | null {
  return getItem<AdminUser | null>(KEYS.currentAdmin, null);
}

export function clearCurrentAdmin(): void {
  localStorage.removeItem(KEYS.currentAdmin);
}

export function login(email: string, password: string): AdminUser | null {
  const admin = getAdminByEmail(email);
  if (admin && admin.isActive && admin.password === password) {
    admin.lastLoginAt = new Date().toISOString();
    saveAdmin(admin);
    setCurrentAdmin(admin);
    return admin;
  }
  return null;
}

export function logout(): void {
  clearCurrentAdmin();
}

// ------------------------------------------------------------------
// Discount Codes
// ------------------------------------------------------------------
export function getDiscountCodes(): DiscountCode[] {
  return getItem<DiscountCode[]>(KEYS.discounts, mockDiscountCodes);
}

export function getDiscountByCode(code: string): DiscountCode | undefined {
  return getDiscountCodes().find(
    (d) => d.code.toLowerCase() === code.toLowerCase()
  );
}

export function saveDiscount(discount: DiscountCode): void {
  const items = getDiscountCodes();
  const idx = items.findIndex((d) => d.id === discount.id);
  if (idx >= 0) {
    items[idx] = discount;
  } else {
    items.push(discount);
  }
  setItem(KEYS.discounts, items);
}

export function deleteDiscount(id: string): void {
  setItem(
    KEYS.discounts,
    getDiscountCodes().filter((d) => d.id !== id)
  );
}

export function incrementDiscountUsage(id: string): void {
  const items = getDiscountCodes();
  const idx = items.findIndex((d) => d.id === id);
  if (idx >= 0) {
    items[idx].usageCount += 1;
    setItem(KEYS.discounts, items);
  }
}

// ------------------------------------------------------------------
// Payment Intents
// ------------------------------------------------------------------
export function getPaymentIntents(): PaymentIntent[] {
  return getItem<PaymentIntent[]>(KEYS.paymentIntents, []);
}

export function createPaymentIntent(
  bookingId: string,
  amount: number,
  currency: string = "NOK"
): PaymentIntent {
  const intent: PaymentIntent = {
    id: `pi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    amount,
    currency,
    status: "pending",
    bookingId,
    createdAt: new Date().toISOString(),
  };
  const items = getPaymentIntents();
  items.push(intent);
  setItem(KEYS.paymentIntents, items);
  return intent;
}

export function updatePaymentIntentStatus(
  intentId: string,
  status: PaymentStatus
): void {
  const items = getPaymentIntents();
  const idx = items.findIndex((p) => p.id === intentId);
  if (idx >= 0) {
    items[idx].status = status;
    setItem(KEYS.paymentIntents, items);
  }
}

// ------------------------------------------------------------------
// System Config
// ------------------------------------------------------------------
export function getSystemConfig(): SystemConfig {
  return getItem<SystemConfig>(KEYS.config, mockSystemConfig);
}

export function saveSystemConfig(config: SystemConfig): void {
  setItem(KEYS.config, config);
}

// ------------------------------------------------------------------
// Admin-scoped filtered access
// ------------------------------------------------------------------
export function getFilteredSaunasForAdmin(admin: AdminUser | null): Sauna[] {
  if (!admin) return [];
  if (admin.role === "superadmin" || admin.canViewAllSaunas) {
    return getSaunas();
  }
  return getSaunas().filter((s) => admin.assignedSaunas.includes(s.id));
}

export function getFilteredBookingsForAdmin(
  admin: AdminUser | null
): Booking[] {
  if (!admin) return [];
  const accessibleSaunas = getFilteredSaunasForAdmin(admin);
  const accessibleSaunaIds = new Set(accessibleSaunas.map((s) => s.id));
  return getBookings().filter((b) => accessibleSaunaIds.has(b.saunaId));
}

// ------------------------------------------------------------------
// Campaigns
// ------------------------------------------------------------------
export function getCampaigns(): Campaign[] {
  return getItem<Campaign[]>(KEYS.campaigns, mockCampaigns);
}

export function getCampaignById(id: string): Campaign | undefined {
  return getCampaigns().find((c) => c.id === id);
}

export function saveCampaign(campaign: Campaign): void {
  const items = getCampaigns();
  const idx = items.findIndex((c) => c.id === campaign.id);
  if (idx >= 0) {
    items[idx] = campaign;
  } else {
    items.push(campaign);
  }
  setItem(KEYS.campaigns, items);
}

export function deleteCampaign(id: string): void {
  setItem(
    KEYS.campaigns,
    getCampaigns().filter((c) => c.id !== id)
  );
}

// ------------------------------------------------------------------
// Stats
// ------------------------------------------------------------------
export function getStats() {
  const bookings = getBookings();
  const members = getMembers();
  const saunas = getSaunas();

  const today = new Date().toISOString().split("T")[0];
  const todayBookings = bookings.filter((b) => b.date === today);

  return {
    totalSaunas: saunas.length,
    totalBookings: bookings.length,
    totalMembers: members.length,
    todayBookings: todayBookings.length,
    confirmedBookings: bookings.filter((b) => b.status === "confirmed").length,
    pendingBookings: bookings.filter((b) => b.status === "pending").length,
    cancelledBookings: bookings.filter((b) => b.status === "cancelled").length,
    internalBookings: bookings.filter((b) => b.isInternal).length,
    revenue: bookings
      .filter((b) => b.status === "confirmed" && !b.isInternal)
      .reduce((sum, b) => sum + b.totalPrice, 0),
  };
}
