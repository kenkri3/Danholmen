import type {
  Sauna,
  Booking,
  Member,
  AdminUser,
  DiscountCode,
  SystemConfig,
  Campaign,
} from "./types";

// ------------------------------------------------------------------
// Saunas
// ------------------------------------------------------------------
export const mockSaunas: Sauna[] = [
  {
    id: "sauna-1",
    name: "Bryggebadstuen på Arås Båthavn",
    slug: "araas-badstue",
    publicSlug: "araas-badstue",
    type: "floating",
    location: "Arås Brygge 8, Nøtterøy",
    description:
      "Flytende badstue på Arås Båthavn med panoramautsikt over fjorden. Perfekt for grupper opptil 10 personer.",
    privatePrice: 500,
    fellesPrice: 179,
    capacity: 10,
    sessionLength: 120,
    operatingHours: {
      weekday: { start: "06:00", end: "22:00" },
      weekend: { start: "06:00", end: "22:00" },
    },
    isActive: true,
    image: "/sauna-araas.jpg",
    images: ["/sauna-araas.jpg"],
    createdAt: "2024-01-15T10:00:00Z",
    bookingModes: ["private", "shared"],
    offersMembership: true,
    offersVelDiscount: true,
    velDiscountRate: 0.25,
    localAssociationName: "Arås Båthavn",
    basicPrice: 349,
    premiumPrice: 349,
    platinumPrice: 349,
  },
  {
    id: "sauna-2",
    name: "Ormelet Vel Badstue",
    slug: "ormelet-vel",
    publicSlug: "ormelet-vel",
    type: "wood-fired",
    location: "Ormeletveien 117, Nøtterøy",
    description:
      "Tradisjonell vedfyrt badstue med autentisk atmosfære. Varmen fra vedovnen gir en unik og avslappende opplevelse.",
    privatePrice: 500,
    fellesPrice: 179,
    capacity: 10,
    sessionLength: 120,
    operatingHours: {
      weekday: { start: "06:00", end: "22:00" },
      weekend: { start: "06:00", end: "22:00" },
    },
    isActive: true,
    image: "/sauna-ormelet.jpg",
    images: ["/sauna-ormelet.jpg"],
    createdAt: "2024-01-20T14:30:00Z",
    bookingModes: ["private", "shared"],
    offersMembership: true,
    offersVelDiscount: true,
    velDiscountRate: 0.50,
    localAssociationName: "Ormelet Vel",
    basicPrice: 349,
    premiumPrice: 349,
    platinumPrice: 349,
  },
  {
    id: "sauna-3",
    name: "Medø Slipp Badstue",
    slug: "medoe-badstue",
    publicSlug: "medoe-badstue",
    type: "electric",
    location: "Medøveien 18, Tjøme",
    description:
      "Moderne badstue ved vannkanten på Tjøme. Elektrisk oppvarming gir jevn og behagelig temperatur hele året.",
    privatePrice: 500,
    fellesPrice: 179,
    capacity: 10,
    sessionLength: 120,
    operatingHours: {
      weekday: { start: "06:00", end: "22:00" },
      weekend: { start: "06:00", end: "22:00" },
    },
    isActive: true,
    image: "/sauna-medo.jpg",
    images: ["/sauna-medo.jpg"],
    createdAt: "2024-02-01T09:00:00Z",
    bookingModes: ["private", "shared"],
    offersMembership: true,
    offersVelDiscount: true,
    velDiscountRate: 0.50,
    localAssociationName: "Medø Slipp",
    basicPrice: 349,
    premiumPrice: 349,
    platinumPrice: 349,
  },
];

// ------------------------------------------------------------------
// Members
// ------------------------------------------------------------------
export const mockMembers: Member[] = [];

// ------------------------------------------------------------------
// Admin Users
// ------------------------------------------------------------------
export const mockAdmins: AdminUser[] = [
  {
    id: "admin-0",
    name: "Kenneth",
    email: "kenkri3@gmail.com",
    password: "EmmabirkW92",
    role: "superadmin",
    assignedSaunas: ["sauna-1", "sauna-2", "sauna-3"],
    canViewAllSaunas: true,
    permissions: {
      bookings: "CRUD",
      members: "CRUD",
      discounts: "CRUD",
      reports: "CRUD",
      saunas: "CRUD",
      admins: "CRUD",
    },
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// ------------------------------------------------------------------
// Bookings
// ------------------------------------------------------------------
export const mockBookings: Booking[] = [];

// ------------------------------------------------------------------
// Discount Codes
// ------------------------------------------------------------------
export const mockDiscountCodes: DiscountCode[] = [];

// ------------------------------------------------------------------
// Campaigns
// ------------------------------------------------------------------
export const mockCampaigns: Campaign[] = [
  {
    id: "campaign-1",
    name: "Sommerkampanje 2026",
    description: "20% avslag på alle badstuer gjennom sommeren. Perfekt for sesongen!",
    discountPercent: 20,
    discountCode: "SOMMER2026",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    maxUses: 100,
    currentUses: 42,
    isActive: true,
    appliesToAllSaunas: true,
    saunaIds: [],
    createdAt: "2025-05-15T10:00:00Z",
  },
  {
    id: "campaign-2",
    name: "Første booking",
    description: "30% avslag for nye kunder på første booking",
    discountPercent: 30,
    discountCode: "FORSTEBOOKING",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    maxUses: 50,
    currentUses: 23,
    isActive: true,
    appliesToAllSaunas: true,
    saunaIds: [],
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "campaign-3",
    name: "Vinterkampanje 2026",
    description: "25% avslag på alle badstuer i vintermånedene",
    discountPercent: 25,
    discountCode: "VINTER2026",
    startDate: "2026-12-01",
    endDate: "2027-02-28",
    maxUses: 0,
    currentUses: 0,
    isActive: false,
    appliesToAllSaunas: true,
    saunaIds: [],
    createdAt: "2025-11-01T08:00:00Z",
  },
];

// ------------------------------------------------------------------
// System Config
// ------------------------------------------------------------------
export const mockSystemConfig: SystemConfig = {
  availableTiers: ["danholmen"],
  defaultBasicPrice: 349,
  defaultPremiumPrice: 349,
  defaultPlatinumPrice: 349,
  membershipTiers: [
    {
      id: "platinum",
      name: "PLATINUM",
      subtitle: "Livsnyteren",
      description: "Ubegrenset tilgang til alt. For deg som vil ha det beste.",
      price: 349,
      periodLabel: "måned",
      benefits: [
        "Ubegrenset fellesbadstue",
        "50% rabatt på privatleie",
        "3 gratis gjestepass i måneden",
        "Prioritert booking",
        "Gratis parkering",
      ],
      accentColor: "deep-teal",
      ctaText: "Bli Platinum-medlem",
      isActive: false,
      order: 0,
    },
    {
      id: "premium",
      name: "PREMIUM",
      subtitle: "Helårsbaderen",
      description: "Bestselger! Fast tilgang med gode rabatter hele året.",
      price: 199,
      periodLabel: "måned",
      benefits: [
        "Ubegrenset fellesbadstue",
        "40% rabatt på privatleie",
        "2 gratis gjestepass i måneden",
        "Prioritert booking",
      ],
      accentColor: "teal",
      badge: "Mest populær",
      ctaText: "Bli Premium-medlem",
      isActive: false,
      order: 1,
    },
    {
      id: "danholmen",
      name: "Danholmen Medlem",
      subtitle: "",
      description: "Bli medlem og få ubegrenset tilgang til fellesbadstue og eksklusive rabatter.",
      price: 349,
      periodLabel: "måned",
      benefits: [
        "Ubegrenset fellesbadstue",
        "40% rabatt på privatleie",
        "1 gratis gjestepass i måneden",
        "Prioritert booking",
      ],
      accentColor: "brand-pink",
      badge: "Mest populær",
      ctaText: "Bli medlem",
      isActive: true,
      order: 2,
    },
    {
      id: "basic",
      name: "BASIC",
      subtitle: "Rabattjegeren",
      description: "Enkel tilgang med rabatter for deg som bader av og til.",
      price: 129,
      periodLabel: "måned",
      benefits: [
        "20% rabatt på fellesbadstue",
        "10% rabatt på privatleie",
        "1 gratis gjestepass i måneden",
      ],
      accentColor: "teal",
      ctaText: "Bli Basic-medlem",
      isActive: false,
      order: 3,
    },
  ],
};
