/**
 * ============================================================================
 * payeeApi.ts — API-klient for Payee.no / Swedbank Pay
 * ============================================================================
 *
 * Denne filen inneholder alle API-kall mot Swedbank Pay via Payee.no.
 * Funksjonene er KLAR for integrasjon men kaller IKKE API-et ennå
 * — du må legge inn din API-nøkkel og merchant ID før bruk.
 *
 * Funksjoner:
 *   • createPaymentOrder()    — Opprett ny betalingsordre
 *   • getPaymentStatus()      — Hent status på eksisterende betaling
 *   • verifyPayment()         — Verifiser at betaling er fullført
 *   • refundPayment()         — Refunder (reverser) en betaling
 *   • createRecurringPayment() — Trekk gjentakende betaling (medlemskap)
 *
 * ============================================================================
 */

import {
  getBaseUrl,
  kronerTilOre,
  byggPaymentUrls,
  byggBetalingsbeskrivelse,
  DEFAULT_LANGUAGE,
  DEFAULT_CURRENCY,
  type PaymentOrderRequest,
  type PaymentOrderResponse,
  type PaymentStatusResponse,
  type PaymentUrlOptions,
  type ReversalRequest,
  type RecurringPaymentRequest,
  type PaymentOrderMetaData,
  type PaymentOrderUrls,
  erBetalingVellykket,
  hentCheckoutRedirectUrl,
} from "./payeeConfig";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Autentisering og headers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Slik får du API-nøkkel:
 * 1. Logg inn på https://payee.no/
 * 2. Gå til "API-nøkler" eller "Integrasjoner"
 * 3. Generer en ny nøkkel
 * 4. Kopier nøkkelen og sett inn her (eller bruk miljøvariabel)
 *
 * VIKTIG: Oppbevar API-nøkkelen sikkert! Ikke commit den til git.
 * Bruk heller en miljøvariabel: import.meta.env.VITE_PAYEE_API_KEY
 */
const PAYEE_API_KEY: string =
  (import.meta.env.VITE_PAYEE_API_KEY as string | undefined) ??
  "";

/**
 * Merchant ID (også kalt "Payee ID") identifiserer din bedrift
 * hos Swedbank Pay. Du finner den i Payee-portalen under bedriftsinnstillinger.
 */
const PAYEE_MERCHANT_ID: string =
  (import.meta.env.VITE_PAYEE_MERCHANT_ID as string | undefined) ??
  "";

/**
 * Bygger standard headers for alle API-kall mot Swedbank Pay.
 * Inkluderer autentisering (Bearer token) og innholdstype.
 */
function byggHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${PAYEE_API_KEY}`,
    // Swedbank Pay krever en spesifikk User-Agent for sporing
    "User-Agent": "BadstuBookingApp/1.0",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Custom Error-klasse for Payee/Swedbank Pay-feil
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Feilklasse for alle feil fra Payee.no / Swedbank Pay API.
 * Inneholder statuskode, feilmelding og eventuell respons-body.
 */
export class PayeeApiError extends Error {
  /** HTTP-statuskode fra API-et */
  public readonly statusCode: number;

  /** Rå respons-body fra API-et (hvis tilgjengelig) */
  public readonly responseBody: unknown;

  /** URL som ble kalt */
  public readonly url: string;

  constructor(
    message: string,
    statusCode: number,
    responseBody: unknown,
    url: string
  ) {
    super(`[Payee API ${statusCode}] ${message}`);
    this.name = "PayeeApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.url = url;
  }
}

/**
 * Sjekker om API-nøkkel og merchant ID er konfigurert.
 * Kaster en feil hvis noe mangler.
 */
function validerKonfigurasjon(): void {
  if (!PAYEE_API_KEY) {
    throw new Error(
      "Payee API-nøkkel er ikke konfigurert. " +
        "Sett VITE_PAYEE_API_KEY miljøvariabel."
    );
  }

  if (!PAYEE_MERCHANT_ID) {
    throw new Error(
      "Payee Merchant ID er ikke konfigurert. " +
        "Sett VITE_PAYEE_MERCHANT_ID miljøvariabel."
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Hjelpefunksjon for API-kall
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Utfører et fetch-kall mot Swedbank Pay API med feilhåndtering.
 *
 * @param endpoint — API-endepunkt (uten base-URL, f.eks. "paymentorders")
 * @param options — Fetch-options (method, body, etc.)
 * @returns Parsed JSON-respons
 * @throws {PayeeApiError} Hvis API-et returnerer en feil
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Sørg for at konfigurasjon er på plass
  validerKonfigurasjon();

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...byggHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    // Prøv å hente feilinformasjon fra respons-body
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    throw new PayeeApiError(
      `API-kall feilet: ${response.statusText}`,
      response.status,
      errorBody,
      url
    );
  }

  // Returner JSON-respons (kan være tom for 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. API-funksjoner for betalingsflyt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parameter-type for createPaymentOrder.
 */
export interface CreatePaymentOrderParams {
  /** Beløp i kroner (konverteres automatisk til øre) */
  belopKroner: number;

  /** Navn på badstuen som bookes */
  badstueNavn: string;

  /** Unik booking-ID i ditt system */
  bookingId: string;

  /** URL-konfigurasjon for redirects og callbacks */
  urlOptions: PaymentUrlOptions;

  /** Valgfri: Dato for bookingen (brukes i beskrivelse) */
  bookingDato?: Date;

  /** Valgfri: Bruker-sesjons-ID */
  userAgent?: string;

  /** Valgfri: Språk/locale (default: "nb-NO") */
  sprak?: string;

  /** Valgfri: Sett til true for medlemskap (første trekk) */
  skalGenerereRecurrenceToken?: boolean;
}

/**
 * Oppretter en ny betalingsordre hos Swedbank Pay.
 *
 * Dette er det FØRSTE steget i betalingsflyten:
 * 1. Backend bygger betalingsordre-forespørsel
 * 2. Kaller Swedbank Pay API
 * 3. Returnerer paymentOrder ID + redirect URL
 * 4. Frontend sender kunden til redirect URL for checkout
 *
 * @param params — Parametere for betalingsordren
 * @returns PaymentOrderResponse med ID og operasjoner
 *
 * @example
 * ```ts
 * const payment = await createPaymentOrder({
 *   belopKroner: 250,
 *   badstueNavn: "Vedfyrt Badstue",
 *   bookingId: "booking-2025-001",
 *   urlOptions: { baseUrl: "https://din-app.no", bookingId: "booking-2025-001" },
 * });
 * const redirectUrl = hentCheckoutRedirectUrl(payment);
 * // → Send kunden til redirectUrl
 * ```
 */
export async function createPaymentOrder(
  params: CreatePaymentOrderParams
): Promise<PaymentOrderResponse> {
  const {
    belopKroner,
    badstueNavn,
    bookingId,
    urlOptions,
    bookingDato,
    userAgent = "BadstuBookingApp/1.0",
    sprak = DEFAULT_LANGUAGE,
    skalGenerereRecurrenceToken = false,
  } = params;

  // Konverter beløp fra kroner til øre (API-et krever øre)
  const belopOre = kronerTilOre(belopKroner);

  // Bygg en beskrivende tekst for betalingen
  const beskrivelse = byggBetalingsbeskrivelse(badstueNavn, bookingDato);

  // Generer URL-er for redirects og callbacks
  const urls = byggPaymentUrls(urlOptions);

  // Metadata for betalingsflyten
  const metadata: PaymentOrderMetaData = {
    type: "Payment",
    generateRecurrenceToken: skalGenerereRecurrenceToken,
  };

  // Bygg request-payload
  const requestBody: PaymentOrderRequest = {
    paymentorder: {
      amount: belopOre,
      currency: DEFAULT_CURRENCY,
      description: beskrivelse,
      userAgent,
      language: sprak,
      payeeReference: bookingId,
      urls,
      metadata,
    },
  };

  // console.log("[Payee] Oppretter betalingsordre:", JSON.stringify(requestBody, null, 2));

  // Send forespørsel til Swedbank Pay
  return apiCall<PaymentOrderResponse>("paymentorders", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

/**
 * Parameter-type for getPaymentStatus.
 */
export interface GetPaymentStatusParams {
  /** PaymentOrder ID fra createPaymentOrder-responsen */
  paymentOrderId: string;
}

/**
 * Henter gjeldende status for en betalingsordre.
 *
 * Brukes for å sjekke om betalingen er:
 * - "Initialized" — Venter på kundens betaling
 * - "Paid"        — Betaling fullført vellykket
 * - "Failed"      — Betaling feilet
 * - "Cancelled"   — Betaling avbrutt av kunde
 * - "Reversed"    — Betaling refundert
 * - "Aborted"     — Betaling avbrutt
 *
 * @param params — Parametere med paymentOrderId
 * @returns PaymentStatusResponse med full status
 *
 * @example
 * ```ts
 * const status = await getPaymentStatus({ paymentOrderId: "paymentorder-abc123" });
 * console.log(status.paymentorder.state); // "Paid" | "Failed" | etc.
 * ```
 */
export async function getPaymentStatus(
  params: GetPaymentStatusParams
): Promise<PaymentStatusResponse> {
  const { paymentOrderId } = params;

  // Hent betalingsordre fra API
  // paymentOrderId inneholder vanligvis full URL, men vi bruker bare ID-delen
  const endpoint = paymentOrderId.startsWith("/psp/")
    ? paymentOrderId.replace("/psp/", "")
    : `paymentorders/${paymentOrderId}`;

  return apiCall<PaymentStatusResponse>(endpoint, {
    method: "GET",
  });
}

/**
 * Parameter-type for verifyPayment.
 */
export interface VerifyPaymentParams {
  /** PaymentOrder ID fra createPaymentOrder-responsen */
  paymentOrderId: string;

  /** Forventet beløp i kroner (valgfri validering) */
  forventetBelopKroner?: number;
}

/**
 * Verifiserer at en betaling er fullført vellykket.
 *
 * Denne funksjonen brukes i callback-håndtereren etter at kunden
 * har fullført betalingen og returnert til applikasjonen.
 *
 * Validerer:
 * 1. At betalingsstatus er "Paid"
 * 2. At beløpet stemmer overens med forventet beløp (valgfritt)
 *
 * @param params — Parametere med paymentOrderId og valgfri beløpsvalidering
 * @returns true hvis betalingen er verifisert OK
 * @throws {PayeeApiError} Hvis betalingen ikke er fullført eller beløp ikke stemmer
 *
 * @example
 * ```ts
 * // I callback-håndtereren din:
 * try {
 *   const erOK = await verifyPayment({
 *     paymentOrderId: req.query.paymentOrderId as string,
 *     forventetBelopKroner: 250,
 *   });
 *   if (erOK) {
 *     // Bekreft booking i databasen
 *     await bekreftBooking(bookingId);
 *   }
 * } catch (error) {
 *   // Håndter feil — ikke bekreft booking
 *   console.error("Betaling feilet:", error);
 * }
 * ```
 */
export async function verifyPayment(
  params: VerifyPaymentParams
): Promise<boolean> {
  const { paymentOrderId, forventetBelopKroner } = params;

  // Hent nåværende betalingsstatus
  const status = await getPaymentStatus({ paymentOrderId });

  // Sjekk at betalingen er fullført
  if (!erBetalingVellykket(status)) {
    throw new PayeeApiError(
      `Betaling ikke fullført. Status: ${status.paymentorder.state}`,
      402,
      status,
      paymentOrderId
    );
  }

  // Valgfritt: Verifiser at beløpet stemmer
  if (forventetBelopKroner !== undefined) {
    const forventetOre = kronerTilOre(forventetBelopKroner);
    if (status.paymentorder.amount !== forventetOre) {
      throw new PayeeApiError(
        `Beløp matcher ikke. Forventet: ${forventetOre} øre, Mottatt: ${status.paymentorder.amount} øre`,
        402,
        status,
        paymentOrderId
      );
    }
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. API-funksjon for refundering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parameter-type for refundPayment (reversal).
 */
export interface RefundPaymentParams {
  /** PaymentOrder ID for betalingen som skal refunderes */
  paymentOrderId: string;

  /** Beløp i kroner som skal refunderes (la stå tom for full refusjon) */
  refundBelopKroner?: number;

  /** Årsak til refundering */
  arsak: string;

  /** Unik referanse for refunderingen (f.eks. "refund-booking-123") */
  refundReferanse: string;

  /** Totalbeløpet for original betaling (brukes ved full refusjon) */
  originalBelopKroner?: number;
}

/**
 * Refunderer (reverserer) en tidligere betaling.
 *
 * Brukes når:
 * - Kunden avbestiller en booking
 * - Feil beløp ble trukket
 * - Annen grunn til refusjon
 *
 * @param params — Parametere for refunderingen
 * @returns true hvis refundering ble akseptert
 *
 * @example
 * ```ts
 * await refundPayment({
 *   paymentOrderId: "paymentorder-abc123",
 *   refundBelopKroner: 250,
 *   arsak: "Kunde avbestilte booking",
 *   refundReferanse: "refund-booking-2025-001",
 * });
 * ```
 */
export async function refundPayment(
  params: RefundPaymentParams
): Promise<boolean> {
  const {
    paymentOrderId,
    refundBelopKroner,
    arsak,
    refundReferanse,
    originalBelopKroner,
  } = params;

  // Hent original betaling for å vite beløpet
  const status = await getPaymentStatus({ paymentOrderId });

  // Bruk oppgitt refund-beløp, eller originalbeløpet
  const refundOre =
    refundBelopKroner !== undefined
      ? kronerTilOre(refundBelopKroner)
      : status.paymentorder.amount;

  const requestBody: ReversalRequest = {
    transaction: {
      description: arsak,
      amount: refundOre,
      currency: DEFAULT_CURRENCY,
      payeeReference: refundReferanse,
    },
  };

  const endpoint = paymentOrderId.startsWith("/psp/")
    ? `${paymentOrderId.replace("/psp/", "")}/reversals`
    : `paymentorders/${paymentOrderId}/reversals`;

  await apiCall(endpoint, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. API-funksjon for gjentakende betaling (medlemskap)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parameter-type for createRecurringPayment.
 */
export interface CreateRecurringPaymentParams {
  /** Beløp i kroner som skal trekkes */
  belopKroner: number;

  /** Beskrivelse av trekket (f.eks. "Månedlig medlemskap — Januar 2025") */
  beskrivelse: string;

  /** Recurrence-token fra første betaling */
  recurrenceToken: string;

  /** Unik referanse for dette trekket (f.eks. "membership-2025-01-001") */
  payeeReference: string;

  /** URL-konfigurasjon for callbacks */
  urlOptions: PaymentUrlOptions;

  /** Valgfri: Bruker-sesjons-ID */
  userAgent?: string;

  /** Valgfri: Språk/locale (default: "nb-NO") */
  sprak?: string;
}

/**
 * Oppretter et gjentakende betalingstrekk (for medlemskap/abonnement).
 *
 * Denne funksjonen bruker et recurrenceToken fra en tidligere vellykket
 * betaling for å trekke et nytt beløp uten at kunden trenger å gjennomføre
 * checkout på nytt.
 *
 * Medlemskapsflyt:
 * 1. Første betaling: Kall createPaymentOrder() med skalGenerereRecurrenceToken: true
 * 2. Lagre recurrenceToken fra responsen (eller fra GET status etterpå)
 * 3. Fremtidige trekk: Kall denne funksjonen med lagret token
 *
 * @param params — Parametere for det gjentakende trekket
 * @returns PaymentOrderResponse med status for det nye trekket
 *
 * @example
 * ```ts
 * // Første betaling (opprett medlemskap):
 * const forsteBetaling = await createPaymentOrder({
 *   belopKroner: 299,
 *   badstueNavn: "Medlemskap",
 *   bookingId: "member-001",
 *   urlOptions: { baseUrl: "https://din-app.no", bookingId: "member-001" },
 *   skalGenerereRecurrenceToken: true,
 * });
 *
 * // Hent token fra status (etter at betaling er fullført):
 * const status = await getPaymentStatus({ paymentOrderId: forsteBetaling.paymentorder.id });
 * const token = status.paymentorder.recurrenceToken;
 *
 * // Månedlig trekk:
 * const trekk = await createRecurringPayment({
 *   belopKroner: 299,
 *   beskrivelse: "Månedlig medlemskap — Februar 2025",
 *   recurrenceToken: token,
 *   payeeReference: "member-001-2025-02",
 *   urlOptions: { baseUrl: "https://din-app.no", bookingId: "member-001-2025-02" },
 * });
 * ```
 */
export async function createRecurringPayment(
  params: CreateRecurringPaymentParams
): Promise<PaymentOrderResponse> {
  const {
    belopKroner,
    beskrivelse,
    recurrenceToken,
    payeeReference,
    urlOptions,
    userAgent = "BadstuBookingApp/1.0",
    sprak = DEFAULT_LANGUAGE,
  } = params;

  // Konverter beløp til øre
  const belopOre = kronerTilOre(belopKroner);

  // Bygg URL-er
  const urls = byggPaymentUrls(urlOptions);

  // Metadata for gjentakende betaling
  const metadata: PaymentOrderMetaData = {
    type: "Recur",
  };

  // Bygg request-payload
  const requestBody: RecurringPaymentRequest = {
    paymentorder: {
      amount: belopOre,
      currency: DEFAULT_CURRENCY,
      description: beskrivelse,
      recurrenceToken,
      payeeReference,
      urls,
      metadata,
    },
  };

  // console.log("[Payee] Oppretter gjentakende betaling:", JSON.stringify(requestBody, null, 2));

  return apiCall<PaymentOrderResponse>("recurringpayments", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Høynivå-funksjon for komplett booking med betaling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resultat fra createBookingPayment.
 */
export interface BookingPaymentResult {
  /** Redirect-URL der kunden skal sendes for å gjennomføre betaling */
  redirectUrl: string;

  /** PaymentOrder ID for sporing av betalingen */
  paymentOrderId: string;

  /** Booking-ID som ble brukt som payeeReference */
  bookingId: string;
}

/**
 * Oppretter betaling for en badstue-booking på ett steg.
 *
 * Denne høynivå-funksjonen kombinerer:
 * 1. Bygging av betalingsordre-request
 * 2. Kall til Swedbank Pay API
 * 3. Ekstrahering av redirect-URL
 *
 * @param params — Alle nødvendige parametere for booking-betaling
 * @returns BookingPaymentResult med redirectUrl og paymentOrderId
 *
 * @example
 * ```ts
 * // I din API-route (f.eks. /api/bookings):
 * const result = await createBookingPayment({
 *   belopKroner: booking.totalPris,
 *   badstueNavn: booking.badstueNavn,
 *   bookingId: booking.id,
 *   urlOptions: { baseUrl: window.location.origin, bookingId: booking.id },
 *   bookingDato: booking.dato,
 * });
 *
 * // Returner redirectUrl til frontend
 * res.json({ redirectUrl: result.redirectUrl, paymentOrderId: result.paymentOrderId });
 * ```
 */
export async function createBookingPayment(
  params: CreatePaymentOrderParams
): Promise<BookingPaymentResult> {
  const payment = await createPaymentOrder(params);

  const redirectUrl = hentCheckoutRedirectUrl(payment);
  if (!redirectUrl) {
    throw new PayeeApiError(
      "Ingen redirect-URL funnet i betalingsordre-responsen",
      500,
      payment,
      "createPaymentOrder"
    );
  }

  return {
    redirectUrl,
    paymentOrderId: payment.paymentorder.id,
    bookingId: params.bookingId,
  };
}
