# Plan: Forbedringer av Danholmen Badstuer Booking System

## Bakgrunn
Brukeren har identifisert 7 hovedproblemer + onsker om automatisering. Basert pa kodegjennomgang:

### Identifiserte problemer
1. **Logo er inkonsekvent** — Admin-navbar bruker Flame-ikon + tekst (ikke offisiell logo). Admin-login-side har INGEN navbar. Forskjellige logo-filer brukes (SVG vs PNG)
2. **Rabattkode-input er for lite** — Input-feltet er mikroskopisk ved siden av stor "Bruk"-knapp (se skjermbilde)
3. **Tekst overlapper ikoner pa mobil** — Input-felter med ikoner har ikke tilstrekkelig padding
4. **Kan ikke slette badstuer** — Saunas.tsx mangler delete-funksjonalitet i UI
5. **Google Maps ikke automatisk** — Nye badstuer far ikke automatisk Google Maps
6. **Medlemsnivaer er hardkodet** — Kun ett medlemsniva (349 kr/mnd), ikke tilpassbart
7. **Rapporter dekker ikke alt** — Maa manuelt velge badstuer, reflekterer ikke nye automatisk

---

## Liste over forbedringer (for godkjenning)

### Fiks 1: Offisiell logo pa ALLE sider
- Erstatt Flame-ikon + "Danholmen" tekst i admin-navbar med `danholmen-logo.png`
- Legg til logo i admin Login-side (som mangler navbar)
- Bruk konsekvent `danholmen-logo.png` overalt
- Sider som maa oppdateres: Navbar.tsx, Login.tsx

### Fiks 2: Rabattkode-input felt storrelse
- Oker input-feltets minste-hoyde og padding
- Justerer knapp-storrelse for aa matche
- Sikrer at teksten er lesbar
- Fil: SingleSaunaBooking.tsx

### Fiks 3: Input-felt med ikoner — mobilvennlig
- Øker padding-left fra pl-10 til pl-11
- Reduserer ikon-storrelse der det trengs
- Tester paa smale skjermer
- Filer: MemberLogin.tsx, Medlemskap.tsx, Login.tsx

### Fiks 4: Sletting av badstuer i admin
- Legge til slett-knapp paa hver badstue-kort
- Bekreftelses-modal for sletting
- Kaller `deleteSauna()` fra store.ts (eksisterer allerede)
- Fil: Saunas.tsx

### Fiks 5: Automatisk Google Maps for nye badstuer
- Naar man lagrer en ny badstue med adresse
- Genererer automatisk Google Maps embed URL fra adressen
- Lagrer mapsUrl i sauna-objektet
- Viser kart automatisk i landing page og booking-side
- Filer: Saunas.tsx, LandingPage.tsx, SingleSaunaBooking.tsx

### Fiks 6: Skreddersy medlemsnivaer (CRUD)
- Ny admin-side for "Medlemsnivaer"
- Kunne opprette/redigere/slette medlemspakkene
- Hvert niva: navn, pris, periode, beskrivelse, fordel-liste, farge/akcent
- Medlemskap-landing leser dynamisk fra config
- Filer: Ny komponent + Medlemskap.tsx + LandingPage.tsx + store.ts

### Fiks 7: Rapporter — auto-inkluder alle badstuer
- Fjerner behov for manuell valg av badstuer
- Rapporten inkluderer ALLTID alle badstuer automatisk
- Kampanje- og rabatt-statistikk vises ogsaa
- Fil: Reports.tsx

### Bonus: Automatisering & optimalisering
- Auto-generer publicSlug fra navn (lowercase, erstatte mellomrom med -)
- Auto-generere slug fra navn
- Forbedre feilmeldinger med tydelig norsk tekst
- Responsivitet-test for alle modaler

---

## Klar for godkjenning, Kenneth!
