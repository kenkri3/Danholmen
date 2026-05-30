// ============================================================
// E-posttjeneste for Danholmen Badstuer
// ============================================================
// Sender ekte e-postbekreftelser ved booking og medlemskjøp.
// Prioriterer EmailJS hvis konfigurert, ellers FormSubmit.co.
//
// Hvis begge feiler, brukes mailto-lenke som fallback.
// ============================================================

import emailjs from "@emailjs/browser";

const FORM_SUBMIT_URL = "https://formsubmit.co/ajax/booking@danholmen.no";
const FROM_EMAIL = "booking@danholmen.no";

export interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  saunaName: string;
  bookingDate: string;
  bookingTime: string;
  bookingType: string;
  totalPrice: number;
  bookingId: string;
}

export interface MembershipEmailData {
  customerName: string;
  customerEmail: string;
  membershipType: string;
  price: number;
  startDate: string;
  bookingId: string;
}

// --- EmailJS: Prioritert e-postutsending ---

const EMAILJS_CONFIG = {
  publicKey: (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string) || "",
  serviceId: (import.meta.env.VITE_EMAILJS_SERVICE_ID as string) || "",
  bookingTemplateId:
    (import.meta.env.VITE_EMAILJS_BOOKING_TEMPLATE_ID as string) || "",
  membershipTemplateId:
    (import.meta.env.VITE_EMAILJS_MEMBERSHIP_TEMPLATE_ID as string) || "",
};

async function sendViaEmailJS(
  templateId: string,
  templateParams: Record<string, any>
): Promise<boolean> {
  if (!EMAILJS_CONFIG.publicKey || !EMAILJS_CONFIG.serviceId || !templateId) {
    return false;
  }

  try {
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );
    return response.status === 200;
  } catch (error) {
    console.error("[EmailJS] Feil ved sending:", error);
    return false;
  }
}

// --- FormSubmit.co: Fallback e-postutsending ---

async function sendViaFormSubmit(
  toEmail: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<boolean> {
  try {
    const response = await fetch(FORM_SUBMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: "Danholmen Badstuer",
        email: FROM_EMAIL,
        _replyto: FROM_EMAIL,
        _subject: subject,
        message: textBody,
        _to: toEmail,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// --- Bookingbekreftelse ---

export async function sendBookingConfirmation(
  data: BookingEmailData
): Promise<boolean> {
  // 1. Prøv EmailJS først
  const emailJsSuccess = await sendViaEmailJS(EMAILJS_CONFIG.bookingTemplateId, {
    to_name: data.customerName,
    to_email: data.customerEmail,
    sauna_name: data.saunaName,
    booking_date: data.bookingDate,
    booking_time: data.bookingTime,
    booking_type: data.bookingType,
    total_price: `${data.totalPrice} kr`,
    booking_id: data.bookingId,
  });

  if (emailJsSuccess) {
    console.log("[E-post] Bookingbekreftelse sendt via EmailJS");
    return true;
  }

  // 2. Fallback til FormSubmit.co
  const subject = `Bookingbekreftelse — ${data.saunaName}`;

  const textBody =
    `Hei ${data.customerName}!\n\n` +
    `Takk for din booking hos Danholmen Badstuer.\n\n` +
    `=== Din booking ===\n` +
    `Badstue: ${data.saunaName}\n` +
    `Dato: ${data.bookingDate}\n` +
    `Tid: ${data.bookingTime}\n` +
    `Type: ${data.bookingType}\n` +
    `Totalt: ${data.totalPrice} kr\n` +
    `Booking-ID: ${data.bookingId}\n\n` +
    `=== Viktig informasjon ===\n` +
    `• Husk å ta med egen ved — alle våre badstuer er vedfyrte!\n` +
    `• Bruk KUN ferskvann på steinene\n` +
    `• Røyking og alkohol er ikke tillatt i badstueene\n` +
    `• Møt opp 5 minutter før din bookede tid\n\n` +
    `=== Kontakt ===\n` +
    `E-post: booking@danholmen.no\n` +
    `Telefon: 971 20 200\n` +
    `Adresse: Danholmen 25, 3128 Nøtterøy\n\n` +
    `Vi gleder oss til å se deg!\n\n` +
    `Vennlig hilsen,\nDanholmen Badstuer`;

  const htmlBody = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#2D2A26;">
<h2 style="color:#0B3D4C;">Hei ${data.customerName}!</h2>
<p>Takk for din booking hos <strong>Danholmen Badstuer</strong>.</p>
<div style="background:#F5F0EA;border-radius:12px;padding:20px;margin:20px 0;">
<h3 style="color:#0B3D4C;margin-top:0;">Din booking</h3>
<p><strong>Badstue:</strong> ${data.saunaName}</p>
<p><strong>Dato:</strong> ${data.bookingDate}</p>
<p><strong>Tid:</strong> ${data.bookingTime}</p>
<p><strong>Type:</strong> ${data.bookingType}</p>
<p><strong>Totalt:</strong> ${data.totalPrice} kr</p>
<p><strong>Booking-ID:</strong> ${data.bookingId}</p>
</div>
<div style="background:#FFF0F4;border-left:4px solid #EE4C84;padding:16px;margin:20px 0;">
<h4 style="color:#0B3D4C;margin-top:0;">Viktig informasjon</h4>
<ul style="padding-left:20px;">
<li>Husk å ta med <strong>egen ved</strong> — alle våre badstuer er vedfyrte!</li>
<li>Bruk KUN ferskvann på steinene</li>
<li>Røyking og alkohol er ikke tillatt</li>
<li>Møt opp 5 minutter før din tid</li>
</ul>
</div>
<p style="margin-top:30px;">Vi gleder oss til å se deg!<br><strong>Danholmen Badstuer</strong><br>booking@danholmen.no | 971 20 200</p>
</body></html>`;

  const success = await sendViaFormSubmit(
    data.customerEmail,
    subject,
    htmlBody,
    textBody
  );

  if (!success) {
    console.log("[E-post] FormSubmit feilet, bruker mailto-fallback");
    return false;
  }

  console.log("[E-post] Bookingbekreftelse sendt til:", data.customerEmail);
  return true;
}

// --- Medlemskapsbekreftelse ---

export async function sendMembershipConfirmation(
  data: MembershipEmailData
): Promise<boolean> {
  // 1. Prøv EmailJS først
  const emailJsSuccess = await sendViaEmailJS(
    EMAILJS_CONFIG.membershipTemplateId,
    {
      to_name: data.customerName,
      to_email: data.customerEmail,
      membership_type: data.membershipType,
      price: `${data.price} kr/mnd`,
      start_date: data.startDate,
      membership_id: data.bookingId,
    }
  );

  if (emailJsSuccess) {
    console.log("[E-post] Medlemskapsbekreftelse sendt via EmailJS");
    return true;
  }

  // 2. Fallback til FormSubmit.co
  const subject = "Velkommen som Danholmen Medlem!";

  const textBody =
    `Hei ${data.customerName}!\n\n` +
    `Takk for at du ble medlem hos Danholmen Badstuer!\n\n` +
    `=== Ditt medlemskap ===\n` +
    `Medlemskap: ${data.membershipType}\n` +
    `Pris: ${data.price} kr/mnd\n` +
    `Startdato: ${data.startDate}\n` +
    `Medlems-ID: ${data.bookingId}\n\n` +
    `=== Dine fordeler ===\n` +
    `• Ubegrenset fellesbadstue\n` +
    `• 40% rabatt på privatleie\n` +
    `• 1 gratis gjestepass i måneden\n` +
    `• Prioritert booking\n\n` +
    `=== Oppsigelse ===\n` +
    `Medlemskapet løper til det sies opp.\n` +
    `Oppsigelsestid: 30 dager.\n\n` +
    `=== Kontakt ===\n` +
    `E-post: booking@danholmen.no\n` +
    `Telefon: 971 20 200\n\n` +
    `Velkommen til varmen!\n\n` +
    `Vennlig hilsen,\nDanholmen Badstuer`;

  const htmlBody = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#2D2A26;">
<h2 style="color:#0B3D4C;">Velkommen, ${data.customerName}!</h2>
<p>Takk for at du ble medlem hos <strong>Danholmen Badstuer</strong>.</p>
<div style="background:#F5F0EA;border-radius:12px;padding:20px;margin:20px 0;">
<h3 style="color:#0B3D4C;margin-top:0;">Ditt medlemskap</h3>
<p><strong>Type:</strong> ${data.membershipType}</p>
<p><strong>Pris:</strong> ${data.price} kr/mnd</p>
<p><strong>Startdato:</strong> ${data.startDate}</p>
<p><strong>Medlems-ID:</strong> ${data.bookingId}</p>
</div>
<div style="background:#F0F7F7;border-radius:12px;padding:20px;margin:20px 0;">
<h4 style="color:#2A6B6B;margin-top:0;">Dine fordeler</h4>
<ul style="padding-left:20px;">
<li>Ubegrenset fellesbadstue</li>
<li>40% rabatt på privatleie</li>
<li>1 gratis gjestepass i måneden</li>
<li>Prioritert booking</li>
</ul>
</div>
<p style="margin-top:30px;">Velkommen til varmen!<br><strong>Danholmen Badstuer</strong><br>booking@danholmen.no | 971 20 200</p>
</body></html>`;

  const success = await sendViaFormSubmit(
    data.customerEmail,
    subject,
    htmlBody,
    textBody
  );

  if (!success) {
    console.log("[E-post] FormSubmit feilet, bruker mailto-fallback");
    return false;
  }

  console.log(
    "[E-post] Medlemskapsbekreftelse sendt til:",
    data.customerEmail
  );
  return true;
}

// --- Mailto Fallback ---

export function generateBookingMailto(data: BookingEmailData): string {
  const subject = encodeURIComponent(
    `Bookingbekreftelse — ${data.saunaName}`
  );
  const body = encodeURIComponent(
    `Hei ${data.customerName}!\n\n` +
      `Takk for din booking hos Danholmen Badstuer.\n\n` +
      `Badstue: ${data.saunaName}\n` +
      `Dato: ${data.bookingDate}\n` +
      `Tid: ${data.bookingTime}\n` +
      `Type: ${data.bookingType}\n` +
      `Totalt: ${data.totalPrice} kr\n` +
      `Booking-ID: ${data.bookingId}\n\n` +
      `Husk å ta med egen ved!\n\n` +
      `Vennlig hilsen,\nDanholmen Badstuer`
  );
  return `mailto:${data.customerEmail}?subject=${subject}&body=${body}`;
}

export function generateMembershipMailto(data: MembershipEmailData): string {
  const subject = encodeURIComponent("Velkommen som Danholmen Medlem!");
  const body = encodeURIComponent(
    `Hei ${data.customerName}!\n\n` +
      `Takk for at du ble medlem hos Danholmen Badstuer!\n\n` +
      `Medlemskap: ${data.membershipType}\n` +
      `Pris: ${data.price} kr/mnd\n` +
      `Startdato: ${data.startDate}\n` +
      `Medlems-ID: ${data.bookingId}\n\n` +
      `Dine fordeler:\n` +
      `- Ubegrenset fellesbadstue\n` +
      `- 40% rabatt på privatleie\n` +
      `- 1 gratis gjestepass i måneden\n` +
      `- Prioritert booking\n\n` +
      `Vennlig hilsen,\nDanholmen Badstuer`
  );
  return `mailto:${data.customerEmail}?subject=${subject}&body=${body}`;
}

// --- Hjelpefunksjon ---

export async function sendConfirmation(
  type: "booking" | "membership",
  data: BookingEmailData | MembershipEmailData
): Promise<{ success: boolean; mailto?: string }> {
  if (type === "booking") {
    const success = await sendBookingConfirmation(data as BookingEmailData);
    if (!success) {
      return {
        success: false,
        mailto: generateBookingMailto(data as BookingEmailData),
      };
    }
    return { success: true };
  } else {
    const success = await sendMembershipConfirmation(
      data as MembershipEmailData
    );
    if (!success) {
      return {
        success: false,
        mailto: generateMembershipMailto(data as MembershipEmailData),
      };
    }
    return { success: true };
  }
}
