/**
 * ============================================================================
 * payeeConfig.ts — Konfigurasjon og typer for Payee.no / Swedbank Pay API
 * ============================================================================
 *
 * Denne filen inneholder all konfigurasjon, TypeScript-interfaces og
 * hjelpefunksjoner som trengs for integrasjon mot Swedbank Pay via Payee.no.
 *
 * Swedbank Pay er en betalingsløsning som støtter både engangsbetalinger
 * og gjentakende trekk (for medlemskap/abonnement).
 *
 * Dokumentasjon: https://developer.swedbankpay.com/
 * Partner: https://payee.no/
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. API-konfigurasjon
// ─────────────────────────────────────────────────────────────────────────────

/** Base-URL for Swedbank Pay API (produksjon) */
export const PAYEE_BASE_URL = "https://api.payex.com/psp";

/** Base-URL for Swedbank Pay API (testmiljø) */
export const PAYEE_TEST_BASE_URL = "https://api.externalintegration.payex.com/psp";

/**
 * Hent riktig base-URL basert på miljø.
 * Bruk test-URL i utvikling og produksjon-URL i live-miljø.
 */
export function getBaseUrl(): string {
  return import.meta.env.PROD
    ? PAYEE_BASE_URL
    : PAYEE_TEST_BASE_URL;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TypeScript-interfaces for PaymentOrder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Metadata som beskriver betalingens opprinnelse.
 * Sendes med hver betalingsordre for sporing.
 */
export interface PaymentOrderMetaData {
  /** Type betalingsflyt: "Payment" | "Verify" | "Recur" */
  type: "Payment" | "Verify" | "Recur";

  /** Generer en recurrence-token for fremtidige trekk (kun medlemskap) */
  generateRecurrenceToken?: boolean;

  /** Generer en unverify-token for å reversere verifisering */
  generateUnscheduleToken?: boolean;

  /** Antall dager før betalingsmetoden utløper */
  paymentMethodExpiry?: number;
}

/**
 * URL-er som Swedbank Pay skal kalle under betalingsflyten.
 * Disse URL-ene mottar callbacks når betalingen endrer status.
 */
export interface PaymentOrderUrls {
  /** URL som kunden sendes til etter vellykket betaling */
  completeUrl: string;

  /** URL som kunden sendes til hvis de avbryter betalingen */
  cancelUrl: string;

  /** URL som kunden sendes til uansett utfall (fallback) */
  callbackUrl: string;

  /** URL for server-til-server callback med betalingsstatus */
  paymentUrl?: string;

  /** URL som vises i iframe/overlay for checkout */
  hostUrls?: string[];

  /** URL for å vise betalingslogoer */
  logoUrl?: string;

  /** URL for å vise terms and conditions */
  termsOfServiceUrl?: string;
}

/**
 * Betalingsordre-forespørsel til Swedbank Pay.
 * Dette er hovedpayloaden som sendes til POST /psp/paymentorders.
 */
export interface PaymentOrderRequest {
  paymentorder: {
    /** Beløp i øre (f.eks. 10000 for 100 NOK) */
    amount: number;

    /** Valuta, alltid "NOK" for norske kroner */
    currency: "NOK";

    /** Beskrivelse av betalingen (vises til kunden) */
    description: string;

    /** Bruker-sesjons-ID for å spore checkout-sesjonen */
    userAgent: string;

    /** Språk og locale for checkout (f.eks. "nb-NO") */
    language: string;

    /** Unik referanse for denne betalingen (booking-ID) */
    payeeReference: string;

    /** Valgfri: Maksimalt antall gjentatte trekk */
    recurrenceToken?: string;

    /** Generer recurrence-token for fremtidige trekk */
    generateRecurrenceToken?: boolean;

    /** URL-konfigurasjon for callbacks og redirects */
    urls: PaymentOrderUrls;

    /** Metadata for betalingsflyten */
    metadata?: PaymentOrderMetaData;

    /** Valgfri: Vis betalingsmeny umiddelbart */
    disablePaymentMenu?: boolean;

    /** Valgfri: Begrens tilgjengelige betalingsmetoder */
    restrictedToInstruments?: string[];
  };
}

/**
 * En enkelt operasjon som kan utføres på betalingsordren.
 * F.eks. "redirect-checkout" for å sende kunden til betalingssiden.
 */
export interface PaymentOrderOperation {
  /** HTTP-metode for operasjonen (f.eks. "GET", "POST") */
  method: string;

  /** Relasjonstype (f.eks. "redirect-checkout", "view-checkout") */
  rel: string;

  /** Content-Type for forespørselen */
  contentType: string;

  /** URL for å utføre operasjonen */
  href: string;
}

/**
 * Betalingsordre-respons fra Swedbank Pay.
 * Returneres etter vellykket opprettelse av betalingsordre.
 */
export interface PaymentOrderResponse {
  paymentorder: {
    /** Unik ID for betalingsordren */
    id: string;

    /** Opprettelsestidspunkt (ISO 8601-format) */
    created: string;

    /** Sist oppdatert (ISO 8601-format) */
    updated: string;

    /** Valuta for betalingen */
    currency: string;

    /** Beløp i øre */
    amount: number;

    /** Beskrivelse av betalingen */
    description: string;

    /** Bruker-sesjons-ID */
    userAgent: string;

    /** Språk/locale */
    language: string;

    /** Unik referanse (booking-ID) */
    payeeReference: string;

    /** Betalingsstatus: "Initialized" | "Paid" | "Failed" | "Cancelled" | "Reversed" */
    state:
      | "Initialized"
      | "Paid"
      | "Failed"
      | "Cancelled"
      | "Reversed"
      | "Aborted";

    /** URL-konfigurasjon */
    urls: PaymentOrderUrls;

    /** Tilgjengelige operasjoner (inkluderer redirect URL) */
    operations: PaymentOrderOperation[];
  };
}

/**
 * Forenklet betalingsstatus-respons.
 * Brukes når vi henter status på en eksisterende betalingsordre.
 */
export interface PaymentStatusResponse {
  paymentorder: {
    /** Unik ID for betalingsordren */
    id: string;

    /** Nåværende status */
    state:
      | "Initialized"
      | "Paid"
      | "Failed"
      | "Cancelled"
      | "Reversed"
      | "Aborted";

    /** Beløp i øre */
    amount: number;

    /** Valuta */
    currency: string;

    /** Beskrivelse */
    description: string;

    /** Betalingsreferanse */
    payeeReference: string;

    /** Tidspunkt for opprettelse */
    created: string;

    /** Tidspunkt for siste oppdatering */
    updated: string;

    /** Tilgjengelige operasjoner */
    operations: PaymentOrderOperation[];
  };
}

/**
 * Request for refundering (reversal) av en betaling.
 * Sendes til POST /psp/paymentorders/{id}/reversals.
 */
export interface ReversalRequest {
  transaction: {
    /** Beskrivelse av reverseringen */
    description: string;

    /** Beløp i øre som skal refunderes */
    amount: number;

    /** Valuta */
    currency: "NOK";

    /** Unik referanse for reverseringen */
    payeeReference: string;
  };
}

/**
 * Request for gjentakende betaling (medlemskapstrekk).
 * Sendes til POST /psp/recurringpayments.
 */
export interface RecurringPaymentRequest {
  paymentorder: {
    /** Beløp i øre */
    amount: number;

    /** Valuta */
    currency: "NOK";

    /** Beskrivelse (f.eks. "Månedlig medlemskap - Januar 2025") */
    description: string;

    /** Recurrence-token fra første betaling */
    recurrenceToken: string;

    /** Unik referanse for dette trekket */
    payeeReference: string;

    /** URL-er for callbacks */
    urls: PaymentOrderUrls;

    /** Metadata for gjentakende betaling */
    metadata: PaymentOrderMetaData;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Hjelpefunksjoner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Konverterer et beløp fra kroner (NOK) til øre.
 *
 * Swedbank Pay API krever at alle beløp oppgis i øre (minor units).
 * Eksempel: 100 NOK → 10000 øre
 *
 * @param kroner — Beløp i kroner (kan være desimaltall, f.eks. 99.90)
 * @returns Beløp i øre (heltall)
 *
 * @example
 * ```ts
 * const ore = kronerTilOre(150);     // 15000
 * const ore = kronerTilOre(99.90);   // 9990
 * ```
 */
export function kronerTilOre(kroner: number): number {
  return Math.round(kroner * 100);
}

/**
 * Konverterer et beløp fra øre til kroner (NOK).
 * Brukes for å vise beløp i brukergrensesnittet.
 *
 * @param ore — Beløp i øre
 * @returns Beløp i kroner (desimaltall)
 *
 * @example
 * ```ts
 * const kr = oreTilKroner(15000); // 150
 * ```
 */
export function oreTilKroner(ore: number): number {
  return ore / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. URL-generator for callbacks og redirects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bygger URL-objektet som trengs for betalingsordren.
 * Disse URL-ene brukes av Swedbank Pay til å:
 * - Redirecte kunden tilbake etter betaling (completeUrl/cancelUrl)
 * - Sende server-til-server callbacks med statusoppdateringer (callbackUrl)
 *
 * @param options — Konfigurasjon for URL-generering
 * @returns PaymentOrderUrls med alle nødvendige URL-er
 *
 * @example
 * ```ts
 * const urls = byggPaymentUrls({
 *   baseUrl: "https://badstu-booking.no",
 *   bookingId: "booking-123",
 *   stiPrefix: "/betaling",
 * });
 * // → { completeUrl: "https://badstu-booking.no/betaling/success?bookingId=booking-123", ... }
 * ```
 */
export interface PaymentUrlOptions {
  /** Basen for applikasjonen (f.eks. "https://din-badstu-app.no") */
  baseUrl: string;

  /** Unik booking-ID som knytter betalingen til en booking */
  bookingId: string;

  /** Valgfri sti-prefix (default: "/betaling") */
  stiPrefix?: string;
}

export function byggPaymentUrls(options: PaymentUrlOptions): PaymentOrderUrls {
  const { baseUrl, bookingId, stiPrefix = "/betaling" } = options;

  // Bygg query-parametere som identifiserer bookingen
  const queryParams = new URLSearchParams({ bookingId }).toString();

  return {
    /** URL kunden sendes til etter vellykket betaling */
    completeUrl: `${baseUrl}${stiPrefix}/success?${queryParams}`,

    /** URL kunden sendes til hvis de avbryter */
    cancelUrl: `${baseUrl}${stiPrefix}/cancel?${queryParams}`,

    /** URL for server-til-server callback (API-endepunkt) */
    callbackUrl: `${baseUrl}/api/webhooks/payee/callback`,

    /** URL der checkout vises (vanligvis samme som booking-siden) */
    paymentUrl: `${baseUrl}${stiPrefix}?${queryParams}`,

    /** URL-er som er godkjente for hosting av checkout */
    hostUrls: [baseUrl],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Konstanter for badstue-booking
// ─────────────────────────────────────────────────────────────────────────────

/** Standard språk/locale for checkout */
export const DEFAULT_LANGUAGE = "nb-NO";

/** Standard valuta */
export const DEFAULT_CURRENCY = "NOK" as const;

/** Maksimal levetid for betalingsordre i timer */
export const PAYMENT_ORDER_TTL_HOURS = 24;

/**
 * Bygger en beskrivende tekst for betalingen som vises til kunden.
 *
 * @param badstueNavn — Navnet på badstuen som bookes
 * @param dato — Valgfri dato for bookingen
 * @returns Beskrivende tekst for betalingen
 */
export function byggBetalingsbeskrivelse(
  badstueNavn: string,
  dato?: Date
): string {
  if (dato) {
    const datoStreng = dato.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `Booking ${badstueNavn} — ${datoStreng}`;
  }
  return `Booking ${badstueNavn}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Hjelpefunksjoner for å hente operasjoner fra responsen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Henter redirect-URL for checkout fra betalingsordre-responsen.
 * Denne URL-en sender kunden til Swedbank Pays betalingsside.
 *
 * @param response — Respons fra createPaymentOrder
 * @returns Redirect-URL for checkout, eller undefined hvis ikke funnet
 */
export function hentCheckoutRedirectUrl(
  response: PaymentOrderResponse
): string | undefined {
  const redirectOp = response.paymentorder.operations.find(
    (op) => op.rel === "redirect-checkout"
  );
  return redirectOp?.href;
}

/**
 * Henter view-checkout URL (for iframe/overlay) fra responsen.
 *
 * @param response — Respons fra createPaymentOrder
 * @returns View-URL for checkout, eller undefined hvis ikke funnet
 */
export function hentCheckoutViewUrl(
  response: PaymentOrderResponse
): string | undefined {
  const viewOp = response.paymentorder.operations.find(
    (op) => op.rel === "view-checkout"
  );
  return viewOp?.href;
}

/**
 * Sjekker om en betaling er vellykket (status "Paid").
 *
 * @param status — Betalingsstatus-respons
 * @returns true hvis betalingen er fullført vellykket
 */
export function erBetalingVellykket(status: PaymentStatusResponse): boolean {
  return status.paymentorder.state === "Paid";
}

/**
 * Sjekker om en betaling kan refunderes (kun betalinger med status "Paid").
 *
 * @param status — Betalingsstatus-respons
 * @returns true hvis betalingen kan refunderes
 */
export function kanRefunderes(status: PaymentStatusResponse): boolean {
  return status.paymentorder.state === "Paid";
}
