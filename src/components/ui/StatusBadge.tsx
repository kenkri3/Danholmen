import type { BookingStatus, BookingType, PaymentStatus } from "@/data/types";

interface StatusBadgeProps {
  status?: BookingStatus;
  type?: BookingType;
  paymentStatus?: PaymentStatus;
  label?: string;
  variant?: "status" | "type" | "payment" | "custom";
  className?: string;
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-[rgba(58,158,111,0.12)] text-success",
  pending: "bg-[rgba(212,160,60,0.12)] text-warning",
  cancelled: "bg-[rgba(196,75,107,0.12)] text-sauna-red",
  completed: "bg-[rgba(58,158,111,0.12)] text-success",
  refunded: "bg-[rgba(230,120,50,0.12)] text-orange-600",
  private: "bg-[rgba(212,134,60,0.12)] text-brand-pink",
  felles: "bg-[rgba(26,107,124,0.12)] text-teal",
  internal: "bg-[rgba(124,58,237,0.12)] text-vel-member",
  paid: "bg-[rgba(58,158,111,0.12)] text-success",
  free: "bg-[rgba(99,91,255,0.12)] text-stripe-blue",
};

const statusLabels: Record<string, string> = {
  confirmed: "Bekreftet",
  pending: "Venter",
  cancelled: "Avbrutt",
  completed: "Fullført",
  refunded: "Refundert",
  private: "Privat",
  felles: "Felles",
  internal: "Intern",
  paid: "Betalt",
  free: "Gratis",
};

export function StatusBadge({
  status,
  type,
  paymentStatus,
  label,
  variant = "status",
  className = "",
}: StatusBadgeProps) {
  let key: string;

  if (variant === "type" && type) {
    key = type;
  } else if (variant === "payment" && paymentStatus) {
    key = paymentStatus;
  } else if (variant === "custom" && label) {
    key = "confirmed";
  } else {
    key = status ?? "confirmed";
  }

  const displayLabel = label ?? statusLabels[key] ?? key;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${
        statusStyles[key] ?? statusStyles.confirmed
      } ${className}`}
    >
      {displayLabel}
    </span>
  );
}
