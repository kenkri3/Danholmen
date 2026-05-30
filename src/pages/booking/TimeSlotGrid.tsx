import { Clock, Lock } from "lucide-react";
import type { BookingType } from "@/data/types";

export type SlotStatus = "available" | "partial" | "booked" | "past";

export interface TimeSlot {
  time: string;
  label: string;
  status: SlotStatus;
  remainingSpots?: number;
  price: number;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  bookingType: BookingType;
}

const STATUS_COLORS: Record<SlotStatus, { bg: string; border: string; text: string; dot: string }> = {
  available: {
    bg: "bg-success/8 hover:bg-success/15",
    border: "border-success/30 hover:border-success/50",
    text: "text-success",
    dot: "bg-success",
  },
  partial: {
    bg: "bg-warning/8 hover:bg-warning/15",
    border: "border-warning/30 hover:border-warning/50",
    text: "text-warning",
    dot: "bg-warning",
  },
  booked: {
    bg: "bg-sauna-red/5",
    border: "border-sauna-red/20",
    text: "text-text-muted",
    dot: "bg-sauna-red/40",
  },
  past: {
    bg: "bg-off-white/50",
    border: "border-[#DDD6CC]/50",
    text: "text-text-muted/60",
    dot: "bg-text-muted/30",
  },
};

const STATUS_LABELS: Record<SlotStatus, string> = {
  available: "Ledig",
  partial: "Noen plasser",
  booked: "Opptatt",
  past: "Passert",
};

export default function TimeSlotGrid({
  slots,
  selectedTime,
  onSelectTime,
  bookingType,
}: TimeSlotGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.time;
        const isDisabled = slot.status === "booked" || slot.status === "past";
        const colors = STATUS_COLORS[slot.status];

        return (
          <button
            key={slot.time}
            onClick={() => !isDisabled && onSelectTime(slot.time)}
            disabled={isDisabled}
            className={`
              relative p-4 rounded-xl border-2 text-left
              min-h-[72px] flex flex-col justify-between gap-1
              transition-all duration-150
              ${isSelected
                ? "border-deep-teal bg-deep-teal/5 shadow-teal"
                : `${colors.border} ${isDisabled ? "" : colors.bg}`
              }
              ${isDisabled ? "opacity-60 cursor-not-allowed" : "active:scale-[0.98]"}
            `}
          >
            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isSelected ? "text-deep-teal" : colors.text}`} />
              <span className={`text-base font-semibold ${isSelected ? "text-deep-teal" : "text-text-primary"}`}>
                {slot.label}
              </span>
            </div>

            {/* Bottom row: status + price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <span className={`text-xs ${isSelected ? "text-deep-teal/80" : colors.text}`}>
                  {slot.status === "partial" && slot.remainingSpots
                    ? `${slot.remainingSpots} plasser`
                    : STATUS_LABELS[slot.status]
                  }
                </span>
              </div>

              {isDisabled ? (
                <Lock className="w-4 h-4 text-text-muted/50" />
              ) : (
                <span className={`text-sm font-medium ${isSelected ? "text-deep-teal" : "text-text-primary"}`}>
                  {bookingType === "private"
                    ? `${slot.price} kr`
                    : `${slot.price} kr/pers`
                  }
                </span>
              )}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-deep-teal flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
