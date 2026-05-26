import { Flame } from "lucide-react";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-deep-teal">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Column 1 — Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <Flame className="w-5 h-5 text-warm-amber" />
              <span className="font-display text-xl font-bold text-white">
                Danholmen
              </span>
            </div>
            <p className="text-sm text-white/70">
              Tett på naturen, Tett på varmen
            </p>
          </div>

          {/* Column 2 — Contact */}
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-white mb-4">Kontakt</h3>
            <div className="space-y-2 text-sm text-white/70">
              <p>Vestfold Båt og Utleie AS</p>
              <p>Org.nr: 927 033 062</p>
              <p>
                <a
                  href="mailto:post@danholmen.no"
                  className="hover:text-white transition-colors"
                >
                  post@danholmen.no
                </a>
              </p>
              <p>
                <a
                  href="tel:+4733335555"
                  className="hover:text-white transition-colors"
                >
                  +47 33 33 55 55
                </a>
              </p>
            </div>
          </div>

          {/* Column 3 — Links */}
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-white mb-4">Lenker</h3>
            <div className="space-y-2 text-sm text-white/70">
              <p>
                <a href="#" className="hover:text-white transition-colors">
                  Personvern
                </a>
              </p>
              <p>
                <a href="#" className="hover:text-white transition-colors">
                  Vilkår
                </a>
              </p>
              <p>
                <a href="#" className="hover:text-white transition-colors">
                  Kontakt oss
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/50">
            &copy; {year} Danholmen Badstuer. Alle rettigheter reservert.
          </p>
        </div>
      </div>
    </footer>
  );
}
