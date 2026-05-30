import { useNavigate } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  Clock,
  Shield,
  Check,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Flame,
  Ban,
  Droplets,
  UserX,
  Wind,
  MessageSquare,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Section component                                                 */
/* ------------------------------------------------------------------ */
function Section({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 md:mb-12">
      <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-5">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 md:w-5.5 md:h-5.5 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl md:text-2xl font-bold text-deep-teal leading-tight">
            <span className="text-brand-pink mr-2">{number}.</span>
            {title}
          </h2>
        </div>
      </div>
      <div className="pl-[52px] md:pl-[60px]">
        <div className="text-text-secondary text-sm md:text-base leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bullet list helper                                                */
/* ------------------------------------------------------------------ */
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Info box helper                                                   */
/* ------------------------------------------------------------------ */
function InfoBox({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning";
  children: React.ReactNode;
}) {
  const isWarning = variant === "warning";
  return (
    <div
      className={[
        "p-4 md:p-5 rounded-xl border-2 my-4",
        isWarning
          ? "border-brand-pink/30 bg-[#FFF0F4]"
          : "border-teal/15 bg-teal/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 text-brand-pink flex-shrink-0 mt-0.5" />
        ) : (
          <Shield className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
        )}
        <div className="text-sm md:text-base leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function Vilkar() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-off-white">
      {/* ============================================================ */}
      {/*  NAVBAR                                                      */}
      {/* ============================================================ */}
      <nav className="w-full bg-white/95 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 group"
            >
              <img
                src="/danholmen-logo.png"
                alt="Danholmen"
                className="h-7 md:h-8 w-auto block"
              />
            </button>

            {/* Back link */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-deep-teal transition-colors duration-200 hover:bg-cream px-3 py-2 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              Tilbake til forsiden
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  HEADER                                                      */}
      {/* ============================================================ */}
      <header className="w-full bg-deep-teal py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 mb-5 md:mb-6">
            <FileText className="w-7 h-7 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
            Brukervilkår
          </h1>
          <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Disse vilkårene gjelder for all bruk av danholmen.no og vår
            booking-tjeneste. Ved å bruke nettsiden og booke badstue hos oss,
            godtar du følgende vilkår.
          </p>
          <p className="text-white/40 text-xs mt-4">
            Sist oppdatert: {new Date().toLocaleDateString("no-NO")}
          </p>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  MAIN CONTENT                                                */}
      {/* ============================================================ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        {/* Intro */}
        <div className="mb-10 md:mb-14 p-5 md:p-6 rounded-2xl border-2 border-[#DDD6CC] bg-white">
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Danholmen Badstuer, drevet av <strong className="text-deep-teal">Vestfold Båt og Utleie AS</strong> (org.nr. 927 033 062), tilbyr utleie av vedfyrte badstuer i Tønsberg-området. Våre badstuer ligger på tre lokasjoner: <strong className="text-deep-teal">Arås Brygge 8</strong> (Nøtterøy), <strong className="text-deep-teal">Ormeletveien 117</strong> (Nøtterøy) og <strong className="text-deep-teal">Medøveien 18</strong> (Tjøme).
          </p>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed mt-3">
            Les gjennom vilkårene nøye før du booker. Ved spørsmål, kontakt oss på{" "}
            <a
              href="mailto:booking@danholmen.no"
              className="text-teal hover:text-deep-teal font-medium underline underline-offset-2 transition-colors"
            >
              booking@danholmen.no
            </a>
            .
          </p>
        </div>

        {/* --- 1. Generelt --- */}
        <Section number={1} title="Generelt" icon={FileText}>
          <p>
            Disse brukervilkårene regulerer forholdet mellom deg som kunde og
            Vestfold Båt og Utleie AS ved bruk av vår nettside danholmen.no og
            våre tjenester.
          </p>
          <p>
            Ved å registrere deg, booke badstue, eller på annen måte bruke våre
            tjenester, bekrefter du at du har lest, forstått og godtar disse
            vilkårene. Vilkårene kan endres ved behov, og gjeldende versjon vil
            alltid være tilgjengelig på nettsiden.
          </p>
          <BulletList
            items={[
              "Vilkårene gjelder for all bruk av danholmen.no",
              "Vilkårene gjelder for booking av drop-in (fellesbadstue), privat leie og medlemskap",
              "Du må være minst 18 år for å inngå avtale om booking eller medlemskap",
              "Vi forbeholder oss retten til å oppdatere vilkårene uten forvarsel",
            ]}
          />
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 2. Booking --- */}
        <Section number={2} title="Booking" icon={Clock}>
          <p>
            Alle badstueøkter bookes gjennom vår nettside danholmen.no.
            Booking er bindende når betaling er gjennomført og bekreftelse er
            mottatt.
          </p>
          <BulletList
            items={[
              "Hver badstueøkt varer i 2 timer",
              "Maks kapasitet per badstue må overholdes (se hver enkelt badstue for detaljer)",
              "Betaling må gjennomføres før booking bekreftes",
              "Du mottar en e-postbekreftelse med bookingdetaljer",
              "Ved privat leie har du eksklusiv tilgang til badstuen i hele økten",
              "Ved drop-in (fellesbadstue) deles badstuen med andre gjester",
            ]}
          />
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 3. Priser --- */}
        <Section number={3} title="Priser og betaling" icon={Shield}>
          <p>
            Alle priser er oppgitt i norske kroner (NOK) og inkluderer mva.
            Prisene kan endres, men endringer påvirker ikke allerede
            bekreftede bookinger.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 my-5">
            <div className="p-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-deep-teal">
                500 <span className="text-base font-medium text-text-secondary">kr</span>
              </p>
              <p className="text-text-secondary text-sm mt-1">Privat leie</p>
              <p className="text-text-muted text-xs">per 2-timers økt</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-teal">
                179 <span className="text-base font-medium text-text-secondary">kr</span>
              </p>
              <p className="text-text-secondary text-sm mt-1">Drop-in (felles)</p>
              <p className="text-text-muted text-xs">per person</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-[#DDD6CC] bg-white text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-brand-pink">
                349 <span className="text-base font-medium text-text-secondary">kr</span>
              </p>
              <p className="text-text-secondary text-sm mt-1">Medlemskap</p>
              <p className="text-text-muted text-xs">per måned</p>
            </div>
          </div>
          <p className="text-sm">
            Betaling skjer sikkert via vår betalingsleverandør. Vi aksepterer
            de fleste betalingskort. Medlemskap belastes månedlig til det
            sies opp.
          </p>
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 4. Avbestilling --- */}
        <Section number={4} title="Avbestilling og refusjon" icon={Clock}>
          <p>
            Du kan avbestille din booking via nettsiden eller ved å kontakte oss
            på booking@danholmen.no. Refusjon beregnes ut fra når
            avbestillingen mottas.
          </p>
          <InfoBox>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-deep-teal">Full refusjon</strong>{" "}
                  ved avbestilling mer enn 48 timer før bookingtidspunktet
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-deep-teal">50 % refusjon</strong>{" "}
                  ved avbestilling 24–48 timer før bookingtidspunktet
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Ban className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-deep-teal">Ingen refusjon</strong>{" "}
                  ved avbestilling under 24 timer før bookingtidspunktet
                </span>
              </li>
            </ul>
          </InfoBox>
          <p className="text-sm">
            Medlemskapsavgifter refunderes ikke. Oppsigelse av medlemskap
            følger reglene i punkt 7.
          </p>
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 5. Badstue-regler --- */}
        <Section number={5} title="Badstue-regler" icon={Flame}>
          <InfoBox variant="warning">
            <p className="font-semibold text-deep-teal mb-1">VIKTIG: Ta med egen ved</p>
            <p>
              Alle våre badstuer er <strong>vedfyrte</strong>. Du må ta med din
              egen tørr ved. Vi tilbyr ikke ved på lokasjonene. Kom i god tid
              slik at du rekker å fyre opp og nyte varmen.
            </p>
          </InfoBox>

          <p>
            For alles sikkerhet og trivsel gjelder følgende regler i alle våre
            badstuer:
          </p>
          <BulletList
            items={[
              "Bruk KUN ferskvann på steinene — saltvann skader ovnen og skaper ubehagelig lukt",
              "Ikke kast vann på ovnen før den er glovarm — det kjøler ned steinene",
              "Røyking er strengt forbudt i og i umiddelbar nærhet av badstueene",
              "Alkohol er ikke tillatt inne i badstueene",
              "Tøm askebeholderen og brennkammeret jevnlig for best trekk og varmeeffekt",
              "Bruk alltid minst ett håndkle å sitte på",
              "Svab gulvet og tørk opp vann før du forlater badstuen",
              "Rydd opp etter deg — vis hensyn til neste gjester",
            ]}
          />
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 6. Ansvar --- */}
        <Section number={6} title="Ansvar og sikkerhet" icon={Shield}>
          <p>
            All bruk av badstueene, bade- og fasilitetsområder skjer på
            <strong className="text-deep-teal"> eget ansvar</strong>.
            Danholmen Badstuer og Vestfold Båt og Utleie AS er ikke ansvarlig
            for personskade, sykdom eller tap av eiendeler som følge av bruk
            av våre fasiliteter.
          </p>
          <BulletList
            items={[
              "Barn under 16 år må ha kontinuerlig voksent tilsyn",
              "Personer med hjerte- eller karsykdommer bør konsultere lege før badstuebruk",
              "Gravide bør utvise forsiktighet og konsultere lege",
              "Kunden er økonomisk ansvarlig for skader på utstyr eller eiendom forårsaket av uaktsomhet eller brudd på reglene",
              "Vi anbefaler å ikke oppholde seg i badstuen lenger enn kroppen tåler — ta pauser og drikk vann",
            ]}
          />
          <InfoBox>
            <p>
              Danholmen Badstuer påtar seg ikke ansvar for tap av personlige
              eiendeler. Vi anbefaler å ikke ta med verdisaker inn i
              badstueene.
            </p>
          </InfoBox>
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 7. Medlemskap --- */}
        <Section number={7} title="Medlemskap" icon={Check}>
          <p>
            Medlemskap hos Danholmen Badsturer koster{" "}
            <strong className="text-deep-teal">349 kr per måned</strong> og gir
            tilgang til eksklusive medlemsfordeler.
          </p>
          <BulletList
            items={[
              "Medlemskapet løper til det sies opp av deg",
              "Oppsigelsestiden er 30 dager fra oppsigelsesdato",
              "Oppsigelse gjøres via din medlemsside på danholmen.no",
              "Medlemsfordeler gjelder kun for aktive medlemmer i godkjent medlemsperiode",
              "Medlemskapet er personlig og kan ikke overføres til andre",
              "Ved manglende betaling suspenderes medlemskapet automatisk",
            ]}
          />
          <InfoBox>
            <p>
              Som aktivt medlem får du blant annet rabattert pris på booking,
              prioritet på populære tidspunkter, og tilgang på
              medlemseksklusive arrangementer.
            </p>
          </InfoBox>
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 8. VEL-rabatter --- */}
        <Section number={8} title="VEL-rabatter" icon={Check}>
          <p>
            Medlemmer av lokale VEL-foreninger kan motta rabatt på booking hos
            Danholmen Badstuer. For å benytte rabatten må du ha et gyldig
            VEL-medlemskap.
          </p>
          <BulletList
            items={[
              "Gyldig VEL-medlemskap må kunne dokumenteres ved forespørsel",
              "Rabatten gjelder kun ved booking og kan ikke kombineres med andre rabatter",
              "Rabatten gjelder ikke på allerede rabatterte priser",
              "Vi forbeholder oss retten til å endre eller avslutte VEL-rabatter",
              "Misbruk av VEL-rabatt kan føre til avvisning av booking uten refusjon",
            ]}
          />
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 9. Force majeure --- */}
        <Section number={9} title="Force majeure" icon={Wind}>
          <p>
            I tilfeller der Danholmen Badstuer ikke kan oppfylle avtalen på
            grunn av forhold utenfor vår kontroll, har vi rett til å avlyse
            bookinger med full refusjon.
          </p>
          <p>Slike forhold inkluderer, men er ikke begrenset til:</p>
          <BulletList
            items={[
              "Ekstremvær, storm, orkan eller lignende værforhold",
              "Vedlikehold eller nødvendige reparasjoner av badstue eller tilhørende fasiliteter",
              "Brann, vannskade eller annen skade på eiendommen",
              "Offentlige pålegg eller restriksjoner",
              "Andre uforutsette hendelser utenfor vår rimelige kontroll",
            ]}
          />
          <InfoBox>
            <p>
              Ved avlysning på grunn av force majeure vil du motta full
              refusjon av betalt beløp, eller tilbud om ombooking til et
              annet tidspunkt etter eget ønske.
            </p>
          </InfoBox>
        </Section>

        <div className="border-t border-[#DDD6CC] my-8 md:my-10" />

        {/* --- 10. Klage --- */}
        <Section number={10} title="Klage og kontakt" icon={MessageSquare}>
          <p>
            Har du spørsmål, klager eller tilbakemeldinger, ønsker vi å høre
            fra deg. Vi tar alle henvendelser på alvor og vil svare deg så
            raskt som mulig.
          </p>
          <BulletList
            items={[
              "Kontakt oss på booking@danholmen.no ved klager eller tilbakemeldinger",
              "Klagen må sendes innen 48 timer etter bookingen",
              "Beskriv problemet detaljert og legg ved eventuell dokumentasjon (bilder, bookingnummer)",
              "Vi behandler alle klager konfidensielt",
              "Du vil motta svar innen 5 virkedager",
            ]}
          />
          <InfoBox>
            <div className="space-y-2">
              <p className="font-semibold text-deep-teal">Kontaktinformasjon:</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                <a
                  href="mailto:booking@danholmen.no"
                  className="flex items-center gap-1.5 text-teal hover:text-deep-teal transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  booking@danholmen.no
                </a>
                <a
                  href="tel:+4797120200"
                  className="flex items-center gap-1.5 text-teal hover:text-deep-teal transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  971 20 200
                </a>
              </div>
            </div>
          </InfoBox>
        </Section>

        {/* --- Bottom card --- */}
        <div className="mt-12 md:mt-16 p-5 md:p-8 rounded-2xl border-2 border-deep-teal/10 bg-deep-teal/[0.02] text-center">
          <Shield className="w-8 h-8 text-teal mx-auto mb-3" />
          <h3 className="font-display text-lg md:text-xl font-bold text-deep-teal mb-2">
            Takk for at du leser vilkårene våre
          </h3>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Ved å følge disse vilkårene bidrar du til en trygg og hyggelig
            opplevelse for alle våre gjester. Vi gleder oss til å se deg i
            badstuen!
          </p>
          <button
            onClick={() => navigate("/book")}
            className="btn-primary text-sm mt-5 inline-flex items-center gap-2"
          >
            Book badstue nå
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </main>

      {/* ============================================================ */}
      {/*  FOOTER                                                      */}
      {/* ============================================================ */}
      <footer className="w-full bg-deep-teal text-white/80 py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/danholmen-logo.png"
                  alt="Danholmen"
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                Tett på naturen, Tett på varmen. Din gateway til autentiske
                badstuopplevelser i Tønsberg og Færder.
              </p>
              <p className="text-white/40 text-xs mt-3">
                Drives av Vestfold Båt og Utleie AS
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
                Kontakt
              </h4>
              <ul className="space-y-2.5">
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <span>Danholmen 25, 3128 Nøtterøy</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Mail className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <a
                    href="mailto:booking@danholmen.no"
                    className="hover:text-white transition-colors"
                  >
                    booking@danholmen.no
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Phone className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <a
                    href="tel:+4797120200"
                    className="hover:text-white transition-colors"
                  >
                    971 20 200
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Shield className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                  <span>Org.nr: 927 033 062</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/40 text-xs">
              &copy; {new Date().getFullYear()} Danholmen Badstuer. Alle rettigheter forbeholdt.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/40">
              <button
                onClick={() => navigate("/vilkar")}
                className="hover:text-white transition-colors"
              >
                Brukervilkår
              </button>
              <span>|</span>
              <button
                onClick={() => navigate("/personvern")}
                className="hover:text-white transition-colors"
              >
                Personvern
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
