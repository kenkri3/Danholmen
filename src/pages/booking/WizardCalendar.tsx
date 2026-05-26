import { ChevronLeft, ChevronRight } from "lucide-react";

export type DateAvailability = "available" | "partial" | "full" | null;

interface WizardCalendarProps {
  currentMonth: Date;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onChangeMonth: (offset: number) => void;
  dateAvailability?: Record<string, DateAvailability>;
}

const MONTH_NAMES = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember",
];

const WEEK_DAYS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

const DOT_COLORS: Record<string, string> = {
  available: "bg-success",
  partial: "bg-warning",
  full: "bg-sauna-red",
};

export default function WizardCalendar({
  currentMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  dateAvailability = {},
}: WizardCalendarProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // First day of the month (0 = Sunday, we want 0 = Monday)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust so Monday = 0
  const mondayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days: (number | null)[] = [];
  // Empty cells for offset
  for (let i = 0; i < mondayOffset; i++) days.push(null);
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onSelectDate(dateStr);
  };

  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onChangeMonth(-1)}
          className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-cream transition-colors touch-target touch-min"
          aria-label="Forrige måned"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-display text-lg md:text-xl font-bold text-text-primary">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={() => onChangeMonth(1)}
          className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-cream transition-colors touch-target touch-min"
          aria-label="Neste måned"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_DAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-text-muted py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const availability = dateAvailability[dateStr];

          let dayClass = "text-text-primary hover:bg-cream bg-off-white/50";
          if (isSelected) {
            dayClass = "bg-deep-teal text-white shadow-teal";
          } else if (isPast) {
            dayClass = "text-text-muted/40 cursor-not-allowed bg-transparent";
          } else if (isToday) {
            dayClass = "bg-warm-amber/15 text-warm-amber font-bold ring-1 ring-warm-amber/40";
          }

          return (
            <button
              key={dateStr}
              onClick={() => !isPast && handleDayClick(day)}
              disabled={isPast}
              className={`
                h-11 sm:h-12 rounded-lg text-sm sm:text-base font-medium
                flex flex-col items-center justify-center gap-0.5
                transition-all duration-150
                ${dayClass}
              `}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              <span>{day}</span>
              {/* Availability dot */}
              {!isPast && !isSelected && availability && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[availability] ?? "bg-text-muted/30"}`}
                />
              )}
              {!isPast && !isSelected && !availability && (
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] sm:text-[11px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-deep-teal" />
          <span>Valgt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-warm-amber/40" />
          <span>I dag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>Ledig</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
          <span>Delvis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-sauna-red" />
          <span>Full</span>
        </div>
      </div>
    </div>
  );
}
