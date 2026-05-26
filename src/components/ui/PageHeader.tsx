import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8"
    >
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-secondary mt-1 break-safe">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 w-full sm:w-auto">{action}</div>}
    </motion.div>
  );
}
