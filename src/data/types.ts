export type MemberTier = "danholmen" | "vel";

export interface Sauna {
  id: string;
  name: string;
  slug: string;
  location: string;
  description: string;
  image: string;
  images: string[];
  capacity: number;
  pricePerHour: number;
  sharedPrice: number;
  maxCapacity: number;
  bookingModes: ("private" | "shared")[];
  offersMembership: boolean;
  offersVelDiscount: boolean;
  velDiscountRate: number;
  localAssociationName: string | null;
  basicPrice: number;
  premiumPrice: number;
  platinumPrice: number;
  openingHours: { open: string; close: string };
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: MemberTier;
  saunaId?: string;
  localAssociation?: string;
  price: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  saunaId: string;
  type: "private" | "shared";
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  participants: number;
  totalPrice: number;
  discountAmount: number;
  memberDiscount: number;
  paymentStatus: "pending" | "paid" | "free" | "awaiting_payment";
  stripeSessionId?: string;
  status: "confirmed" | "cancelled" | "awaiting_payment";
  paymentDeadline?: string;
  isInternal: boolean;
  notes: string;
  createdAt: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  usedCount: number;
  saunaIds: string[] | null;
  isActive: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  template: string;
  description: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "superadmin";
  createdAt: string;
}

export interface SystemConfig {
  membershipTiers: string[];
  defaultMembershipPrice: number;
  velDiscountEnabled: boolean;
  stripeEnabled: boolean;
  bookingLeadTimeMinutes: number;
  cancellationPolicyHours: number;
}
