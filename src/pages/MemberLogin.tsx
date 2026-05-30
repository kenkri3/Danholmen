import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, UserCircle, ArrowLeft, LockKeyhole, User } from "lucide-react";
import { memberLogin } from "@/data/store";

export default function MemberLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vennligst fyll ut e-post og passord.");
      return;
    }

    setIsLoading(true);

    // Simulate a brief loading
    setTimeout(() => {
      const member = memberLogin(email, password);
      if (member) {
        navigate("/min-side");
      } else {
        setError("Feil e-post eller passord. Prøv igjen.");
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F0EA" }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50 shadow-md"
        style={{ backgroundColor: "#0B3D4C" }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src="/danholmen-logo.png" alt="Danholmen" className="h-10" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-md mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "#EE4C8415" }}
          >
            <User className="w-8 h-8" style={{ color: "#EE4C84" }} />
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif", color: "#0B3D4C" }}
          >
            Logg inn som medlem
          </h1>
          <p className="text-sm" style={{ color: "#5a7a85" }}>
            Få tilgang til dine medlemsfordeler og bookinger
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl border-2 p-6 md:p-8" style={{ borderColor: "#e8e2d9" }}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-post
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B3D4C] transition-all text-base"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Passord
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ditt passord"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B3D4C] transition-all text-base"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#0B3D4C" }}
            >
              {isLoading ? (
                <span className="animate-pulse">Logger inn...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Logg inn
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs text-gray-400">eller</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Become member */}
          <button
            onClick={() => navigate("/medlemskap")}
            className="w-full h-12 rounded-xl font-semibold text-base transition-all hover:opacity-90 flex items-center justify-center gap-2 border-2"
            style={{ borderColor: "#EE4C84", color: "#EE4C84" }}
          >
            <User className="w-5 h-5" />
            Bli medlem
          </button>
        </div>

        {/* Help text */}
        <p className="text-center text-xs mt-6" style={{ color: "#9ca3af" }}>
          Glemt passord? Kontakt oss på{" "}
          <a href="mailto:booking@danholmen.no" className="underline" style={{ color: "#2A6B6B" }}>
            booking@danholmen.no
          </a>
        </p>
      </main>
    </div>
  );
}
