import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  Contact,
  Flame,
} from "lucide-react";

export function PublicFooter() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-deep-teal">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Column 1 — Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <img
                src="/danholmen-logo.png"
                alt="Danholmen"
                className="h-10 w-auto brightness-100"
              />
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Tett på naturen, Tett på varmen. Din gateway til autentiske
              badstuopplevelser i Tønsberg og Færder.
            </p>
          </div>

          {/* Column 2 — Contact */}
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-white mb-4">Kontakt</h3>
            <div className="space-y-3 text-sm text-white/70">
              <p className="flex items-start justify-center md:justify-start gap-2">
                <MapPin className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                <span>Danholmen 25, 3128 Nøtterøy</span>
              </p>
              <p className="flex items-start justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:booking@danholmen.no"
                  className="hover:text-white transition-colors"
                >
                  booking@danholmen.no
                </a>
              </p>
              <p className="flex items-start justify-center md:justify-start gap-2">
                <Phone className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" />
                <a
                  href="tel:+4797120200"
                  className="hover:text-white transition-colors"
                >
                  971 20 200
                </a>
              </p>
            </div>
          </div>

          {/* Column 3 — Links */}
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-white mb-4">Lenker</h3>
            <div className="space-y-3 text-sm text-white/70">
              <button
                onClick={() => navigate("/personvern")}
                className="flex items-center justify-center md:justify-start gap-2 hover:text-white transition-colors w-full"
              >
                <FileText className="w-4 h-4" />
                Personvern
              </button>
              <button
                onClick={() => navigate("/vilkar")}
                className="flex items-center justify-center md:justify-start gap-2 hover:text-white transition-colors w-full"
              >
                <Shield className="w-4 h-4" />
                Vilkår
              </button>
              <button
                onClick={() => navigate("/kontakt")}
                className="flex items-center justify-center md:justify-start gap-2 hover:text-white transition-colors w-full"
              >
                <Contact className="w-4 h-4" />
                Kontakt oss
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/50">
            &copy; {year} Danholmen Badstuer — Vestfold Båt og Utleie AS. Org.nr: 927 033 062. Alle rettigheter reservert.
          </p>
        </div>
      </div>
    </footer>
  );
}
