# Oppsett av e-postbekreftelser med EmailJS

Denne guiden forklarer hvordan du setter opp EmailJS for å sende automatiske e-postbekreftelser ved booking og medlemskapskjøp i Danholmen Badstuer-appen.

---

## Steg 1: Registrer EmailJS-konto

1. Gå til [https://www.emailjs.com/](https://www.emailjs.com/)
2. Klikk **"Sign Up"** og registrer deg
3. Bruk gjerne e-posten **booking@danholmen.no** (eller din egen)
4. Bekreft e-postadressen din

---

## Steg 2: Koble til din e-posttjeneste

1. I EmailJS-dashboardet, gå til **"Email Services"**
2. Klikk **"Add New Service"**
3. Velg din e-postleverandor:
   - **Gmail** -- enklest, kobler direkte til Google-konto
   - **Outlook** -- for Microsoft-kontoer
   - **SMTP** -- for andre e-postleverandorer (f.eks. One.com, Proton)
4. Folg instruksjonene for a koble til kontoen
5. Gi tjenesten et navn, f.eks. `danholmen_email`
6. **Noter deg "Service ID"** -- du trenger denne senere

### Tips for Gmail:
- Du ma kanskje generere et "App Password" i Google-kontoen din
- Ga til: Google-konto > Sikkerhet > App-passord

---

## Steg 3: Lag e-postmaler (Templates)

### Mal 1: Bookingbekreftelse

1. Ga til **"Email Templates"** i dashboardet
2. Klikk **"Create New Template"**
3. I redigeringsvinduet, sett opp:

**Subject:**
```
Bookingbekreftelse - {{sauna_name}}
```

**Innhold (HTML):**
```html
<h2>Hei {{to_name}}!</h2>
<p>Takk for din booking hos <strong>Danholmen Badstuer</strong>.</p>

<h3>Dine bookingdetaljer:</h3>
<ul>
  <li><strong>Badstue:</strong> {{sauna_name}}</li>
  <li><strong>Dato:</strong> {{booking_date}}</li>
  <li><strong>Tid:</strong> {{booking_time}}</li>
  <li><strong>Type:</strong> {{booking_type}}</li>
  <li><strong>Totalt:</strong> {{total_price}}</li>
  <li><strong>Booking-ID:</strong> {{booking_id}}</li>
</ul>

<p><em>Husk a ta med egen ved!</em></p>

<p>Vennlig hilsen,<br>Danholmen Badstuer</p>
```

4. Lagre malen og **noter "Template ID"** (f.eks. `template_booking`)

### Mal 2: Medlemskapsbekreftelse

1. Klikk **"Create New Template"** igjen
2. Sett opp:

**Subject:**
```
Velkommen som Danholmen Medlem!
```

**Innhold (HTML):**
```html
<h2>Hei {{to_name}}!</h2>
<p>Takk for at du ble <strong>medlem</strong> hos Danholmen Badstuer!</p>

<h3>Ditt medlemskap:</h3>
<ul>
  <li><strong>Medlemskap:</strong> {{membership_type}}</li>
  <li><strong>Pris:</strong> {{price}}</li>
  <li><strong>Startdato:</strong> {{start_date}}</li>
  <li><strong>Medlems-ID:</strong> {{membership_id}}</li>
</ul>

<h3>Dine fordeler:</h3>
<ul>
  <li>Ubegrenset fellesbadstue</li>
  <li>40% rabatt pa privatleie</li>
  <li>1 gratis gjestepass i maneden</li>
  <li>Prioritert booking</li>
</ul>

<p>Vennlig hilsen,<br>Danholmen Badstuer</p>
```

3. Lagre malen og **noter "Template ID"** (f.eks. `template_membership`)

---

## Steg 4: Finn din Public Key

1. I EmailJS-dashboardet, ga til **"Account"** > **"General"**
2. Kopier **"Public Key"**
3. Denne brukes til a autentisere foresporsler fra nettsiden

---

## Steg 5: Oppdater koden

### 1. Installer EmailJS-biblioteket

```bash
npm install @emailjs/browser
```

### 2. Oppdater konfigurasjonen i `src/data/emailService.ts`

Erstatt placeholder-verdiene overst i filen:

```typescript
const EMAILJS_PUBLIC_KEY = "din_faktiske_public_key";
const EMAILJS_SERVICE_ID = "din_service_id";        // f.eks. "service_danholmen"
const BOOKING_TEMPLATE_ID = "din_booking_template";  // f.eks. "template_booking"
const MEMBERSHIP_TEMPLATE_ID = "din_membership_template"; // f.eks. "template_membership"
```

### 3. Aktiver EmailJS-kallene

I `sendBookingConfirmation()` og `sendMembershipConfirmation()`:
- Fjern eller kommenter ut `return false`-linjen etter konsoll-loggingen
- Fjern kommentarene fra `emailjs.send(...)`-kallet
- Sorg for at `import emailjs from '@emailjs/browser';` er lagt til overst i filen

---

## Steg 6: Test oppsettet

1. Start appen lokalt:
   ```bash
   npm run dev
   ```

2. Gjor en test-booking gjennom nettsiden

3. Sjekk at:
   - Ingen feilmeldinger i nettleserens konsoll (F12)
   - E-posten mottas i innboksen (sjekk ogsa soppelpost!)
   - Malvariablene fylles ut korrekt

### Feilsoking

| Problem | Losning |
|---------|---------|
| "Service ID not found" | Sjekk at SERVICE_ID stemmer med dashboardet |
| "Template ID not found" | Sjekk at TEMPLATE_ID stemmer med dashboardet |
| "Invalid public key" | Kopier public key pa nytt fra Account > General |
| E-post mottas ikke | Sjekk soppelpost/spam. Sjekk at tjenesten er aktivert |
| "You have exceeded the limit" | EmailJS gratis-konto har 200 e-poster/mnd. Vent eller oppgrader |

---

## Prisinformasjon

| Plan | Pris | E-poster/mnd |
|------|------|-------------|
| Gratis | $0 | 200 |
| Starter | $5 | 5 000 |
| Growth | $15 | 50 000 |

For en ny bedrift som Danholmen Badstuer er **Gratis-planen** trolig tilstrekkelig i starten.

---

## Sammendrag: Hva du trenger fra EmailJS

Etter oppsettet trenger du disse verdiene for a fullfore konfigurasjonen:

1. **Public Key** (fra Account > General)
2. **Service ID** (fra Email Services)
3. **Booking Template ID** (fra Email Templates)
4. **Membership Template ID** (fra Email Templates)

Lim disse inn i `src/data/emailService.ts` og appen sender ekte e-poster!

---

## Fallback-funksjon

Inntil EmailJS er satt opp fungerer appen automatisk med **mailto-lenker** som apner brukerens e-postklient med forhandsfylt innhold. Ingen endring i UI-koden er nodvendig -- `sendConfirmation()`-hjelpefunksjonen handterer dette automatisk.
