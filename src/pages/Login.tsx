import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Check, Loader2 } from "lucide-react";
import { login } from "@/data/store";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const emailInput = document.getElementById("email");
    if (emailInput && !forgotMode) emailInput.focus();
  }, [forgotMode]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!email || !password) {
        setError("Vennligst fyll inn både e-post og passord.");
        setShake(true);
        setTimeout(() => setShake(false), 400);
        return;
      }

      setLoading(true);

      // Simulate network delay
      await new Promise((r) => setTimeout(r, 800));

      const admin = login(email, password);
      if (admin) {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        setLoading(false);
        setPassword("");
        setError("Feil e-post eller passord. Prøv igjen.");
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    },
    [email, password, navigate]
  );

  const handleForgot = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      setLoading(false);
      setForgotMode(false);
      setError("");
    },
    []
  );

  const inputClasses =
    "w-full h-11 px-4 rounded-[10px] border-[1.5px] border-[#DDD6CC] bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-teal focus:shadow-input-focus transition-all duration-200";

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left panel — brand image (55%, hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden md:flex md:w-[55%] relative bg-deep-teal overflow-hidden"
      >
        <img
          src="/login-bg.jpg"
          alt="Sauna interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,61,76,0.3), rgba(11,61,76,0.85))",
          }}
        />

        {/* Logo */}
        <div className="absolute top-6 left-6 z-20">
          <img src="/danholmen-logo.png" alt="Danholmen" className="h-10 w-auto" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 h-full">
          <img
            src="/logo-danholmen.svg"
            alt="Danholmen"
            className="w-[180px] mb-6"
          />
          {/* Decorative amber line */}
          <div className="w-10 h-[2px] bg-brand-pink mb-4" />
          <p className="font-display text-[22px] font-normal text-white tracking-[0.02em] mb-2">
            Tett på naturen, Tett på varmen
          </p>
          <p className="text-sm text-white/70">
            Booking System for Danholmen Badstuer
          </p>
        </div>
      </motion.div>

      {/* Right panel — login form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="flex-1 md:w-[45%] bg-white flex flex-col justify-center items-center px-6 sm:px-10 py-10 relative"
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="md:hidden flex justify-center mb-6">
            <img
              src="/logo-danholmen.svg"
              alt="Danholmen"
              className="w-[140px]"
              style={{ filter: "brightness(0) saturate(100%) invert(27%) sepia(14%) saturate(3802%) hue-rotate(153deg) brightness(95%) contrast(85%)" }}
            />
          </div>

          <AnimatePresence mode="wait">
            {!forgotMode ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display text-[28px] font-bold text-text-primary">
                  Logg Inn
                </h2>
                <p className="text-sm text-text-secondary mt-2">
                  Administratorsystem for Danholmen Badstuer
                </p>

                <form
                  onSubmit={handleLogin}
                  className={`mt-10 space-y-5 ${shake ? "animate-shake" : ""}`}
                >
                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium text-text-secondary mb-1.5"
                    >
                      E-post
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="din@epost.no"
                      className={inputClasses}
                      disabled={loading || success}
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.23, duration: 0.3 }}
                  >
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium text-text-secondary mb-1.5"
                    >
                      Passord
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClasses} pr-10`}
                        disabled={loading || success}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {/* Forgot password link */}
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(true);
                          setError("");
                        }}
                        className="text-xs text-teal hover:underline transition-colors"
                      >
                        Glemt passord?
                      </button>
                    </div>
                  </motion.div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-start gap-2 bg-[rgba(196,75,107,0.08)] border border-[rgba(196,75,107,0.2)] rounded-lg px-4 py-3 text-[13px] text-sauna-red"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                  >
                    <button
                      type="submit"
                      disabled={loading || success}
                      className={`w-full h-12 rounded-lg text-white text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        success
                          ? "bg-success"
                          : "bg-brand-pink hover:bg-pink-light shadow-[0_4px_16px_rgba(212,134,60,0.3)] hover:shadow-[0_6px_24px_rgba(212,134,60,0.4)] hover:scale-[1.01] active:scale-[0.98]"
                      } disabled:opacity-80 disabled:cursor-not-allowed`}
                    >
                      {loading && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Logger inn...</span>
                        </>
                      )}
                      {success && (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Vellykket!</span>
                        </>
                      )}
                      {!loading && !success && <span>Logg Inn</span>}
                    </button>
                  </motion.div>


                </form>
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-display text-[28px] font-bold text-text-primary">
                  Tilbakestill Passord
                </h2>
                <p className="text-sm text-text-secondary mt-2">
                  Skriv inn e-postadressen din, så sender vi deg en lenke for å
                  tilbakestille passordet.
                </p>

                <form onSubmit={handleForgot} className="mt-10 space-y-5">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-medium text-text-secondary mb-1.5"
                    >
                      E-post
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="din@epost.no"
                      className={inputClasses}
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !forgotEmail}
                    className="w-full h-12 rounded-lg bg-brand-pink hover:bg-pink-light text-white text-base font-medium shadow-[0_4px_16px_rgba(212,134,60,0.3)] hover:shadow-[0_6px_24px_rgba(212,134,60,0.4)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sender...</span>
                      </>
                    ) : (
                      "Send lenke"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setError("");
                    }}
                    className="w-full h-11 rounded-lg text-text-secondary hover:bg-cream hover:text-text-primary text-sm font-medium transition-all duration-200"
                  >
                    Tilbake til innlogging
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-6 text-center">
          <p className="text-xs text-text-muted">
            Vestfold Båt og Utleie AS
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Org.nr: 927 033 062
          </p>
        </div>
      </motion.div>
    </div>
  );
}
