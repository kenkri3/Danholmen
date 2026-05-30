import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export function PublicHeader() {
  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-white border-b border-[#DDD6CC] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 xl:px-8">
        <div className="h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#/book" className="flex items-center flex-shrink-0">
            <img
              src="/logo-danholmen.svg"
              alt="Danholmen"
              className="h-7 sm:h-8 md:h-9 w-auto"
              style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(52%) saturate(1025%) hue-rotate(153deg) brightness(93%) contrast(93%)" }}
            />
          </a>

          {/* Center tagline — desktop only */}
          <span className="hidden lg:block text-sm text-text-secondary">
            Book din badstueopplevelse
          </span>

          {/* Back link */}
          <a
            href="https://danholmen.no"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-teal text-[12px] sm:text-[13px] font-medium hover:underline transition-all flex-shrink-0"
          >
            <span className="hidden sm:inline">Tilbake til danholmen.no</span>
            <span className="sm:hidden">danholmen.no</span>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          </a>
        </div>
      </div>
    </motion.header>
  );
}
