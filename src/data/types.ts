export type SaunaType = "floating" | "wood-fired" | "electric";

export type BookingMode = "private" | "shared";

export type BookingType = "private" | "felles" | "internal";

export type BookingStatus = "confirmed" | "pending" | "awaiting_payment" | "cancelled" | "completed";

export type PaymentStatus = "pending" | "paid" | "free";

export type BookedBy = "customer" | "admin";

export type MemberTier = "danholmen" | "vel";

export type LocalAssociation = "araas" | "ormelet" | null;

export type AdminRole = "superadmin" | "manager" | "viewer";

export type PermissionLevel = "CRUD" | "R";

export type DiscountType = "percentage" | "fixed_amount";

export type AppliesTo = "all" | "private" | "felles";

export type ReportType = "monthly_sauna" | "monthly_member" | "custom";

export interface OperatingHours {
  weekday: { start: string; end: string };
  weekend: { start: string; end: string };
}

export interface Sauna {
  id: string;
  name: string;
  slug: string;
  publicSlug: string;
  type: SaunaType;
  location: string;
  description: string;
  privatePrice: number;
  fellesPrice: number;
  capacity: number;
  sessionLength: number;
  operatingHours: OperatingHours;
  isActive: boolean;
  image: string;
  images: string[];
  /* Per-sauna membership config */
  bookingModes: BookingMode[];
  offersMembership: boolean;
  offersVelDiscount: boolean;
  velDiscountRate: number;
  localAssociationName: string | null;
  basicPrice: number;
  premiumPrice: number;
  platinumPrice: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  saunaId: string;
  type: BookingType;
  isInternal: boolean;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  participantCount: number;
  totalPrice: number;
  discountCode: string | null;
  discountAmount: number;
  memberId: string | null;
  memberDiscount: number;
  notes: string | null;
  stripeSessionId: string | null;
  paymentStatus: PaymentStatus;
  bookedBy: BookedBy;
  createdAt: string;
  cancelledAt: string | null;
  /** ISO timestamp when pending payment expires (15 min from creation) */
  paymentDeadline?: string | null;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  tier: MemberTier; /* "danholmen" | "vel" */
  localAssociation: LocalAssociation;
  localDiscountRate: number;
  isActive: boolean;
  subscriptionPrice: number; /* 0 when tier === "vel" */
  joinedAt: string;
  expiresAt: string;
  bookingsCount: number;
  totalSpent: number;
  image: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  assignedSaunas: string[];
  canViewAllSaunas: boolean; /* false = sees only assigned saunas data */
  permissions: {
    bookings: PermissionLevel;
    members: PermissionLevel;
    discounts: PermissionLevel;
    reports: PermissionLevel;
    saunas: PermissionLevel;
    admins: PermissionLevel;
  };
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  appliesTo: AppliesTo;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Report {
  id: string;
  type: ReportType;
  periodStart: string;
  periodEnd: string;
  saunaId: string | null;
  memberId: string | null;
  data: Record<string, unknown>;
  pdfUrl: string | null;
  sentTo: string;
  sentAt: string;
  createdAt: string;
}

export interface SystemConfig {
  availableTiers: MemberTier[]; /* Which tiers are offered to customers */
  defaultBasicPrice: number;
  defaultPremiumPrice: number;
  defaultPlatinumPrice: number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  bookingId: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  discountCode: string;
  startDate: string;
  endDate: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  appliesToAllSaunas: boolean;
  saunaIds: string[];
  createdAt: string;
}
