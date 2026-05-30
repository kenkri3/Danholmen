import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Clock,
  Send,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

export default function Kontakt() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    navn: "",
    epost: "",
    emne: "Generelt spørsmål",
    melding: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Takk for din melding! Vi kontakter deg snart.");
    setFormData({
      navn: "",
      epost: "",
      emne: "Generelt spørsmål",
      melding: "",
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "#F5F0EA" }}>
      {/* Navbar */}
      <nav className="w-full border-b border-[#0B3D4C]/10 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center">
            <img
              src="/danholmen-logo.png"
              alt="Danholmen Badstuer"
              className="h-10"
            />
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors"
            style={{ backgroundColor: "#0B3D4C", color: "#FFFFFF" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til forsiden
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ backgroundColor: "#0B3D4C" }} className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Kontakt oss
          </h1>
          <p className="text-white/80 text-base md:text-lg">
            Har du spørsmål? Vi er her for å hjelpe deg.
          </p>
        </div>
      </section>

      {/* Hovedinnhold */}
      <main className="flex-1 py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Venstre kolonne — Kontaktinfo */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2
                className="text-xl font-semibold mb-6"
                style={{ color: "#0B3D4C" }}
              >
                Kontaktinformasjon
              </h2>

              <div className="space-y-5">
                <a
                  href="mailto:booking@danholmen.no"
                  className="flex items-start gap-4 group"
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ backgroundColor: "#0B3D4C10" }}
                  >
                    <Mail
                      className="w-5 h-5"
                      style={{ color: "#0B3D4C" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">E-post</p>
                    <p
                      className="font-medium group-hover:underline"
                      style={{ color: "#0B3D4C" }}
                    >
                      booking@danholmen.no
                    </p>
                  </div>
                </a>

                <a
                  href="tel:+4797120200"
                  className="flex items-start gap-4 group"
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ backgroundColor: "#0B3D4C10" }}
                  >
                    <Phone
                      className="w-5 h-5"
                      style={{ color: "#0B3D4C" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">Telefon</p>
                    <p
                      className="font-medium group-hover:underline"
                      style={{ color: "#0B3D4C" }}
                    >
                      971 20 200
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ backgroundColor: "#0B3D4C10" }}
                  >
                    <MapPin
                      className="w-5 h-5"
                      style={{ color: "#0B3D4C" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">Adresse</p>
                    <p className="font-medium" style={{ color: "#0B3D4C" }}>
                      Danholmen 25, 3128 Nøtterøy
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ backgroundColor: "#0B3D4C10" }}
                  >
                    <Building2
                      className="w-5 h-5"
                      style={{ color: "#0B3D4C" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">
                      Organisasjonsnummer
                    </p>
                    <p className="font-medium" style={{ color: "#0B3D4C" }}>
                      927 033 062
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Vestfold Båt og Utleie AS
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ backgroundColor: "#0B3D4C10" }}
                  >
                    <Clock
                      className="w-5 h-5"
                      style={{ color: "#0B3D4C" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0.5">Åpningstider</p>
                    <p className="font-medium" style={{ color: "#0B3D4C" }}>
                      Man–Søn 06:00–22:00
                    </p>
                  </div>
                </div>
              </div>

              {/* Badstuer-oversikt */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3
                  className="text-sm font-semibold uppercase tracking-wide mb-4"
                  style={{ color: "#0B3D4C" }}
                >
                  Våre badstuer
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: "#EE4C84" }} />
                    <span className="text-sm text-gray-700">
                      Arås Brygge 8, Nøtterøy
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: "#EE4C84" }} />
                    <span className="text-sm text-gray-700">
                      Ormeletveien 117, Nøtterøy
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: "#EE4C84" }} />
                    <span className="text-sm text-gray-700">
                      Medøveien 18, Tjøme
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Høyre kolonne — Kontaktskjema */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ backgroundColor: "#0B3D4C10" }}
                >
                  <MessageSquare
                    className="w-5 h-5"
                    style={{ color: "#0B3D4C" }}
                  />
                </div>
                <h2
                  className="text-xl font-semibold"
                  style={{ color: "#0B3D4C" }}
                >
                  Send oss en melding
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="navn"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#0B3D4C" }}
                  >
                    Navn
                  </label>
                  <input
                    type="text"
                    id="navn"
                    name="navn"
                    value={formData.navn}
                    onChange={handleChange}
                    placeholder="Ditt navn"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D4C] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="epost"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#0B3D4C" }}
                  >
                    E-post
                  </label>
                  <input
                    type="email"
                    id="epost"
                    name="epost"
                    value={formData.epost}
                    onChange={handleChange}
                    placeholder="din@epost.no"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="emne"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#0B3D4C" }}
                  >
                    Emne
                  </label>
                  <select
                    id="emne"
                    name="emne"
                    value={formData.emne}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none"
                  >
                    <option>Generelt spørsmål</option>
                    <option>Bookinghjelp</option>
                    <option>Medlemskap</option>
                    <option>Teknisk support</option>
                    <option>Annet</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="melding"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#0B3D4C" }}
                  >
                    Melding
                  </label>
                  <textarea
                    id="melding"
                    name="melding"
                    value={formData.melding}
                    onChange={handleChange}
                    placeholder="Skriv din melding her..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#0B3D4C" }}
                >
                  <Send className="w-4 h-4" />
                  Send melding
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Danholmen Badstuer. Alle rettigheter reservert.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/personvern")}
              className="text-sm text-gray-500 hover:underline"
            >
              Personvern
            </button>
            <button
              onClick={() => navigate("/vilkar")}
              className="text-sm text-gray-500 hover:underline"
            >
              Vilkår
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
