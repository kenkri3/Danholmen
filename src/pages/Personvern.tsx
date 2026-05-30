import { useNavigate } from "react-router-dom";
import {
  Shield,
  Mail,
  Phone,
  FileText,
  ChevronLeft,
  User,
  Database,
  Target,
  Scale,
  Clock,
  UserCheck,
  Share2,
  Cookie,
  Lock,
} from "lucide-react";

const SectionHeading = ({
  number,
  icon: Icon,
  title,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
}) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0B3D4C] text-white text-sm font-bold shrink-0">
      {number}
    </div>
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-[#EE4C84]" />
      <h2 className="text-xl font-semibold text-[#0B3D4C]">{title}</h2>
    </div>
  </div>
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <section className="mb-10">{children}</section>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[#333333] leading-relaxed mb-3">{children}</p>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="list-disc list-inside space-y-1.5 text-[#333333] leading-relaxed mb-4 ml-1">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export default function Personvern() {
  const navigate = useNavigate();

  const backToHome = () => navigate("/");

  return (
    <div className="min-h-screen bg-[#F5F0EA]">
      {/* Navbar */}
      <nav className="bg-[#0B3D4C] text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={backToHome}
            className="flex items-center gap-2 text-sm font-medium hover:text-[#EE4C84] transition-colors"
          >
            <Shield className="w-5 h-5 text-[#EE4C84]" />
            <span className="hidden sm:inline">Danholmen Badstuer</span>
          </button>
          <button
            onClick={backToHome}
            className="flex items-center gap-1.5 text-sm text-[#F5F0EA] hover:text-[#EE4C84] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Tilbake til forsiden
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-[#0B3D4C] text-white pt-8 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[#EE4C84]" />
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Personvernerklæring
            </h1>
          </div>
          <p className="text-[#F5F0EA]/80 text-sm sm:text-base max-w-2xl mx-auto">
            Danholmen Badstuer tar ditt personvern på alvor. Denne erklæringen
            forklarer hvordan vi samler inn, bruker og beskytter dine
            personopplysninger i henhold til GDPR og Personopplysningsloven.
          </p>
          <p className="text-[#F5F0EA]/50 text-xs mt-4">
            Sist oppdatert: {new Date().toLocaleDateString("no-NO")}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* 1. Behandlingsansvarlig */}
        <Section>
          <SectionHeading
            number={1}
            icon={User}
            title="Behandlingsansvarlig"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              <strong className="text-[#0B3D4C]">
                Vestfold Båt og Utleie AS
              </strong>{" "}
              er behandlingsansvarlig for personopplysninger som samles inn
              gjennom Danholmen Badstuers nettside og tjenester.
            </Paragraph>
            <div className="space-y-2 text-[#333333]">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-[#EE4C84] mt-1 shrink-0" />
                <span>
                  <strong>Organisasjonsnummer:</strong> 927 033 062
                </span>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-[#EE4C84] mt-1 shrink-0" />
                <span>
                  <strong>Adresse:</strong> Danholmen 25, 3128 Nøtterøy
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#EE4C84] mt-1 shrink-0" />
                <span>
                  <strong>E-post:</strong>{" "}
                  <a
                    href="mailto:booking@danholmen.no"
                    className="text-[#0B3D4C] underline hover:text-[#EE4C84] transition-colors"
                  >
                    booking@danholmen.no
                  </a>
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#EE4C84] mt-1 shrink-0" />
                <span>
                  <strong>Telefon:</strong>{" "}
                  <a
                    href="tel:+4797120200"
                    className="text-[#0B3D4C] underline hover:text-[#EE4C84] transition-colors"
                  >
                    971 20 200
                  </a>
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. Hvilke personopplysninger samles inn */}
        <Section>
          <SectionHeading
            number={2}
            icon={Database}
            title="Hvilke personopplysninger samles inn"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Vi samler kun inn personopplysninger som er nødvendige for å
              levere våre tjenester til deg. Dette inkluderer:
            </Paragraph>
            <BulletList
              items={[
                "Navn og kontaktinformasjon (e-postadresse og telefonnummer)",
                "Bookinghistorikk og reservasjonsdetaljer",
                "IP-adresse og nettleserinformasjon (automatisk)",
                "Betalingsinformasjon (behandles av Payee / Swedbank Pay — vi lagrer ikke kortdetaljer)",
                "Medlemskapsinformasjon (hvis du tegner medlemskap)",
              ]}
            />
            <p className="text-sm text-[#666666] italic">
              Vi samler ikke inn sensitive personopplysninger (helseopplysninger,
              religiøs tilhørighet, politisk oppfatning, etc.).
            </p>
          </div>
        </Section>

        {/* 3. Formål med behandling */}
        <Section>
          <SectionHeading
            number={3}
            icon={Target}
            title="Formål med behandling av personopplysninger"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Dine personopplysninger brukes til følgende formål:
            </Paragraph>
            <BulletList
              items={[
                "Å administrere og gjennomføre dine badstue-bookinger",
                "Å håndtere medlemskap og abonnement",
                "Å behandle betalinger via vår betalingsleverandør",
                "Å kommunisere med deg om din booking eller medlemskap",
                "Å sende viktige driftsmeldinger (f.eks. avbestillinger, endringer)",
                "Å oppfylle våre forpliktelser etter bokføringsloven",
              ]}
            />
            <Paragraph>
              Vi bruker ikke opplysningene dine til markedsføring eller
              profilering uten ditt uttrykkelige samtykke.
            </Paragraph>
          </div>
        </Section>

        {/* 4. Rettlig grunnlag */}
        <Section>
          <SectionHeading
            number={4}
            icon={Scale}
            title="Rettlig grunnlag for behandling"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Behandlingen av dine personopplysninger baseres på følgende
              rettslige grunnlag i henhold til GDPR:
            </Paragraph>
            <div className="space-y-4">
              <div className="bg-[#F5F0EA] rounded-lg p-4">
                <p className="font-semibold text-[#0B3D4C] mb-1">
                  Artikkel 6(1)(b) — Avtale
                </p>
                <p className="text-[#333333] text-sm">
                  Behandling er nødvendig for å oppfylle en avtale som du er
                  part i, eller for å gjennomføre tiltak på dine vegne før
                  inngåelse av avtale. Dette gjelder booking av badstue og
                  medlemskapsregistrering.
                </p>
              </div>
              <div className="bg-[#F5F0EA] rounded-lg p-4">
                <p className="font-semibold text-[#0B3D4C] mb-1">
                  Artikkel 6(1)(a) — Samtykke
                </p>
                <p className="text-[#333333] text-sm">
                  Der du har gitt samtykke til behandling av
                  personopplysninger for ett eller flere spesifikke formål,
                  for eksempel ved påmelding til nyhetsbrev eller
                  markedsføringskommunikasjon.
                </p>
              </div>
              <div className="bg-[#F5F0EA] rounded-lg p-4">
                <p className="font-semibold text-[#0B3D4C] mb-1">
                  Artikkel 6(1)(c) — Rettslig forpliktelse
                </p>
                <p className="text-[#333333] text-sm">
                  Behandling er nødvendig for å oppfylle en rettslig
                  forpliktelse som påhviler oss, herunder bokføringsloven og
                  skatteregler.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 5. Lagringstid */}
        <Section>
          <SectionHeading
            number={5}
            icon={Clock}
            title="Lagringstid"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Dine personopplysninger lagres kun så lenge det er nødvendig for
              å oppfylle formålene de ble samlet inn for:
            </Paragraph>
            <BulletList
              items={[
                "Kontakt- og bookingopplysninger: Så lenge kundeforholdet består",
                "Etter avsluttet kundeforhold: Opptil 3 år (i henhold til bokføringsloven)",
                "Betalings- og fakturainformasjon: 3,5 til 5 år (bokføringslovens krav)",
                "Sesjonsdata (localStorage): Slettes når du logger ut eller lukker nettleseren",
              ]}
            />
            <Paragraph>
              Etter lagringsperiodens utløp slettes eller anonymiseres
              opplysningene på en sikker måte.
            </Paragraph>
          </div>
        </Section>

        {/* 6. Dine rettigheter */}
        <Section>
          <SectionHeading
            number={6}
            icon={UserCheck}
            title="Dine rettigheter"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              I henhold til GDPR og Personopplysningsloven har du følgende
              rettigheter:
            </Paragraph>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {[
                {
                  title: "Rett til innsyn",
                  desc: "Du kan be om en kopi av alle personopplysninger vi har om deg.",
                },
                {
                  title: "Rett til retting",
                  desc: "Du kan be om at feilaktige opplysninger blir rettet.",
                },
                {
                  title: "Rett til sletting",
                  desc: "Du kan be om at opplysningene dine slettes ('retten til å bli glemt').",
                },
                {
                  title: "Rett til dataportabilitet",
                  desc: "Du kan be om å få opplysningene dine overført i et maskinlesbart format.",
                },
                {
                  title: "Rett til begrensning",
                  desc: "Du kan be om at behandlingen av opplysningene dine begrenses.",
                },
                {
                  title: "Rett til innsigelse",
                  desc: "Du kan protestere på behandling av dine personopplysninger.",
                },
              ].map((right, i) => (
                <div
                  key={i}
                  className="bg-[#F5F0EA] rounded-lg p-4 border-l-4 border-[#EE4C84]"
                >
                  <p className="font-semibold text-[#0B3D4C] text-sm mb-1">
                    {right.title}
                  </p>
                  <p className="text-[#333333] text-xs leading-relaxed">
                    {right.desc}
                  </p>
                </div>
              ))}
            </div>
            <Paragraph>
              For å utøve dine rettigheter, kontakt oss på{" "}
              <a
                href="mailto:booking@danholmen.no"
                className="text-[#0B3D4C] underline hover:text-[#EE4C84] transition-colors"
              >
                booking@danholmen.no
              </a>
              . Vi vil svare på din henvendelse innen 30 dager.
            </Paragraph>
          </div>
        </Section>

        {/* 7. Deling av data */}
        <Section>
          <SectionHeading
            number={7}
            icon={Share2}
            title="Deling av personopplysninger"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Vi deler kun dine personopplysninger med nødvendige
              underleverandører for å kunne levere våre tjenester:
            </Paragraph>
            <BulletList
              items={[
                "Payee / Swedbank Pay — behandler betalingstransaksjoner",
                "Stripe — betalingsbehandling og fakturering",
              ]}
            />
            <div className="bg-[#EE4C84]/10 border border-[#EE4C84]/30 rounded-lg p-4 mb-4">
              <p className="text-[#0B3D4C] font-medium text-sm">
                Vi selger aldri dine personopplysninger til tredjepart.
                Ingen data deles med annonsenettverk, analyseselskaper eller
                andre eksterne aktører uten ditt samtykke.
              </p>
            </div>
            <Paragraph>
              Våre underleverandører behandler data på våre vegne og er
              bundet av databehandleravtaler som sikrer at dine
              personopplysninger behandles i samsvar med GDPR.
            </Paragraph>
          </div>
        </Section>

        {/* 8. Informasjonskapsler (cookies) */}
        <Section>
          <SectionHeading
            number={8}
            icon={Cookie}
            title="Informasjonskapsler (cookies)"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Danholmen Badstuers nettside bruker et minimum av
              informasjonskapsler:
            </Paragraph>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0B3D4C] text-white">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Type</th>
                    <th className="px-4 py-3">Beskrivelse</th>
                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[#333333]">
                  <tr className="bg-[#F5F0EA]/50">
                    <td className="px-4 py-3 font-medium">Nødvendige</td>
                    <td className="px-4 py-3">
                      localStorage for innlogget sesjon og bookingkurv
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                        Påkrevd
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium">Analyse</td>
                    <td className="px-4 py-3">
                      Google Analytics eller lignende
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[#666666] text-xs font-medium bg-[#E5E5E5] px-2 py-1 rounded-full">
                        Ikke i bruk
                      </span>
                    </td>
                  </tr>
                  <tr className="bg-[#F5F0EA]/50">
                    <td className="px-4 py-3 font-medium">Markedsføring</td>
                    <td className="px-4 py-3">
                      Sporing av annonser og sosiale medier
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[#666666] text-xs font-medium bg-[#E5E5E5] px-2 py-1 rounded-full">
                        Ikke i bruk
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-[#666666]">
              Nettsiden bruker <strong>localStorage</strong> for å holde deg
              innlogget og huske innholdet i bookingkurven din. Disse dataene
              lagres kun i din nettleser og slettes når du logger ut eller
              tømmer nettleserdata. Vi bruker <strong>ingen</strong>{" "}
              markedsførings-cookies eller tredjepartssporing.
            </p>
          </div>
        </Section>

        {/* 9. Datasikkerhet */}
        <Section>
          <SectionHeading
            number={9}
            icon={Lock}
            title="Datasikkerhet"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Vi tar sikkerheten til dine personopplysninger på største alvor
              og har implementert følgende tekniske og organisatoriske
              tiltak:
            </Paragraph>
            <BulletList
              items={[
                "All kommunikasjon mellom deg og vår nettside er kryptert med SSL (HTTPS)",
                "Sensitive betalingsdata behandles kun av sertifiserte betalingsleverandører (Payee / Swedbank Pay, Stripe)",
                "Ingen kortinformasjon eller bankdetaljer lagres på våre servere",
                "localStorage brukes kun for sesjonsdata i nettleseren din — ingen data lagres permanent hos oss uten behov",
                "Regelmessige sikkerhetsvurderinger av våre systemer og leverandører",
              ]}
            />
            <div className="bg-[#0B3D4C]/5 border border-[#0B3D4C]/20 rounded-lg p-4">
              <p className="text-[#333333] text-sm">
                <strong className="text-[#0B3D4C]">Viktig:</strong> Vi lagrer
                aldri sensitiv personinformasjon som helseopplysninger,
                fødselsnummer eller biometriske data. Pass på å velge et
                sikkert passord og ikke del påloggingsinformasjonen din med
                andre.
              </p>
            </div>
          </div>
        </Section>

        {/* 10. Kontakt oss */}
        <Section>
          <SectionHeading
            number={10}
            icon={Mail}
            title="Kontakt oss om personvern"
          />
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#0B3D4C]/10">
            <Paragraph>
              Har du spørsmål om denne personvernerklæringen, ønsker å utøve
              dine rettigheter, eller har andre personvernrelaterte
              henvendelser? Kontakt oss:
            </Paragraph>
            <div className="bg-[#F5F0EA] rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#EE4C84]" />
                <a
                  href="mailto:booking@danholmen.no"
                  className="text-[#0B3D4C] font-medium hover:text-[#EE4C84] transition-colors"
                >
                  booking@danholmen.no
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#EE4C84]" />
                <a
                  href="tel:+4797120200"
                  className="text-[#0B3D4C] font-medium hover:text-[#EE4C84] transition-colors"
                >
                  971 20 200
                </a>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#EE4C84] mt-0.5" />
                <span className="text-[#333333]">
                  Vestfold Båt og Utleie AS
                  <br />
                  Danholmen 25, 3128 Nøtterøy
                </span>
              </div>
            </div>
            <p className="text-sm text-[#666666] mt-4">
              Du har også rett til å klage til{" "}
              <a
                href="https://www.datatilsynet.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0B3D4C] underline hover:text-[#EE4C84] transition-colors"
              >
                Datatilsynet
              </a>{" "}
              hvis du mener vi ikke behandler dine personopplysninger i
              samsvar med gjeldende regelverk.
            </p>
          </div>
        </Section>

        {/* Back to top / Home */}
        <div className="text-center pt-6 pb-4">
          <button
            onClick={backToHome}
            className="inline-flex items-center gap-2 bg-[#0B3D4C] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#EE4C84] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Tilbake til forsiden
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B3D4C] text-white py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-[#EE4C84]" />
            <span className="font-semibold text-sm">Danholmen Badstuer</span>
          </div>
          <p className="text-[#F5F0EA]/60 text-xs mb-1">
            En tjeneste fra Vestfold Båt og Utleie AS (org.nr 927 033 062)
          </p>
          <p className="text-[#F5F0EA]/60 text-xs mb-3">
            Danholmen 25, 3128 Nøtterøy
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[#F5F0EA]/50">
            <a
              href="mailto:booking@danholmen.no"
              className="hover:text-[#EE4C84] transition-colors"
            >
              booking@danholmen.no
            </a>
            <span>|</span>
            <a
              href="tel:+4797120200"
              className="hover:text-[#EE4C84] transition-colors"
            >
              971 20 200
            </a>
          </div>
          <p className="text-[#F5F0EA]/30 text-xs mt-4">
            &copy; {new Date().getFullYear()} Danholmen Badstuer. Alle
            rettigheter reservert.
          </p>
        </div>
      </footer>
    </div>
  );
}
