import { Link } from "react-router-dom";
import { Flame, Phone, Mail, MapPin } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Public Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/book" className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <Flame className="h-6 w-6 text-orange-500" />
            Danholmen Badstuer
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link to="/book" className="text-gray-600 hover:text-gray-900">Book</Link>
            <Link to="/min-side" className="text-gray-600 hover:text-gray-900">Min side</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 grid gap-6 sm:grid-cols-3 text-sm">
          <div>
            <h3 className="font-semibold text-white mb-2">Danholmen Badstuer</h3>
            <p>Tønsberg-området</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Kontakt</h3>
            <div className="space-y-1">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> kenkri3@gmail.com</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Tønsberg</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Lenker</h3>
            <div className="space-y-1">
              <p><Link to="/book" className="hover:text-white">Book badstue</Link></p>
              <p><Link to="/min-side" className="hover:text-white">Min side</Link></p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 mt-6 pt-4 border-t border-gray-800 text-xs text-center text-gray-500">
          © {new Date().getFullYear()} Danholmen Badstuer
        </div>
      </footer>
    </div>
  );
}
