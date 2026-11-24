"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconClock, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};
const useHydrated = () => React.useSyncExternalStore(noopSubscribe, () => true, () => false);

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTHS_SHORT_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const WEEKDAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const WEEKDAYS_FULL_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const TRIGGER_BASE =
  "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] px-3 text-left text-sm text-[#1F1A14] shadow-[0_1px_2px_rgba(26,21,16,.04)] transition-[color,box-shadow,border-color] outline-none hover:border-[#C9A24E] focus-visible:border-[#8A6424] focus-visible:ring-[3px] focus-visible:ring-[#8A6424]/15 data-[state=open]:border-[#8A6424] data-[state=open]:ring-[3px] data-[state=open]:ring-[#8A6424]/15 disabled:cursor-not-allowed disabled:opacity-50";

const POPOVER_SURFACE =
  "z-[60] rounded-2xl border border-[#EDE3CF] bg-[#FFFDF9] p-4 text-[#1F1A14] shadow-[0_24px_50px_-20px_rgba(26,21,16,.35)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";

function normalizeIsoDate(raw?: string | null): string {
  if (!raw) return "";
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

function parseIsoParts(iso: string): { year: number; month: number; day: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return { year, month, day };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayIso(): string {
  const d = new Date();
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDateLabel(iso: string, compact = false): string {
  const p = parseIsoParts(iso);
  if (!p) return "";
  const d = new Date(p.year, p.month, p.day);
  if (compact) return `${p.day} ${MONTHS_SHORT_ID[p.month]} ${p.year}`;
  return `${WEEKDAYS_FULL_ID[d.getDay()]}, ${p.day} ${MONTHS_SHORT_ID[p.month]} ${p.year}`;
}

function buildCalendarGrid(year: number, month: number): { iso: string; day: number; inMonth: boolean }[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;

  const cells: { iso: string; day: number; inMonth: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push({ iso: toIsoDate(prevYear, prevMonth, day), day, inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toIsoDate(year, month, day), day, inMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ iso: toIsoDate(nextYear, nextMonth, nextDay), day: nextDay, inMonth: false });
    nextDay++;
  }
  return cells;
}

export interface DatePickerFieldProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (isoDate: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  compact?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Custom champagne/espresso/gold date picker replacing native <input type="date">.
 * Works controlled (`value` + `onChange`) or uncontrolled (`defaultValue` + `name` in forms).
 * Value format is always ISO `YYYY-MM-DD`.
 */
export function DatePickerField({
  id,
  name,
  value,
  defaultValue,
  onChange,
  min,
  max,
  placeholder = "Pilih tanggal",
  required = false,
  disabled = false,
  clearable = !required,
  compact = false,
  className,
  "aria-label": ariaLabel,
}: DatePickerFieldProps) {
  const hydrated = useHydrated();
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(() => normalizeIsoDate(defaultValue));
  const current = normalizeIsoDate(isControlled ? value : internal);
  const minIso = normalizeIsoDate(min);
  const maxIso = normalizeIsoDate(max);

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"days" | "months">("days");
  const initialRef = parseIsoParts(current) ?? parseIsoParts(todayIso())!;
  const [viewYear, setViewYear] = React.useState(initialRef.year);
  const [viewMonth, setViewMonth] = React.useState(initialRef.month);

  const openPopover = (nextOpen: boolean) => {
    if (nextOpen) {
      const target = parseIsoParts(current) ?? parseIsoParts(todayIso())!;
      setViewYear(target.year);
      setViewMonth(target.month);
      setMode("days");
    }
    setOpen(nextOpen);
  };

  const commit = (nextIso: string) => {
    if (!isControlled) setInternal(nextIso);
    onChange?.(nextIso);
  };

  const isDisabledDay = (iso: string) => {
    if (minIso && iso < minIso) return true;
    if (maxIso && iso > maxIso) return true;
    return false;
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const label = current ? formatDateLabel(current, compact) : "";
  const today = hydrated ? todayIso() : "";
  const cells = React.useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const triggerButton = (
    <button
      type="button"
      id={id}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(TRIGGER_BASE, className)}
    >
      <span className={cn("truncate tabular-nums", !label && "text-[#8E8268]")}>{label || placeholder}</span>
      <IconCalendar size={16} stroke={1.7} className="shrink-0 text-[#8A6424]" />
    </button>
  );

  if (!hydrated) {
    return (
      <>
        {name && <input type="hidden" name={name} value={current} />}
        {triggerButton}
      </>
    );
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={current} required={required} />}
      <PopoverPrimitive.Root open={open} onOpenChange={openPopover}>
        <PopoverPrimitive.Trigger asChild>{triggerButton}</PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content align="start" sideOffset={6} className={cn(POPOVER_SURFACE, "w-[296px]")}>
            {/* Header */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={mode === "days" ? prevMonth : () => setViewYear((y) => y - 1)}
                aria-label={mode === "days" ? "Bulan sebelumnya" : "Tahun sebelumnya"}
                className="flex size-8 items-center justify-center rounded-full border border-[#EDE3CF] bg-white text-[#40372B] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
              >
                <IconChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setMode((m) => (m === "days" ? "months" : "days"))}
                className="flex h-8 items-center gap-1 rounded-full px-3 text-sm font-medium text-[#1F1A14] transition hover:bg-[#F6EEDF]"
                title="Pilih bulan & tahun"
              >
                <span className="font-(family-name:--font-landing-display) text-base">
                  {mode === "days" ? `${MONTHS_ID[viewMonth]} ${viewYear}` : `${viewYear}`}
                </span>
              </button>

              <button
                type="button"
                onClick={mode === "days" ? nextMonth : () => setViewYear((y) => y + 1)}
                aria-label={mode === "days" ? "Bulan berikutnya" : "Tahun berikutnya"}
                className="flex size-8 items-center justify-center rounded-full border border-[#EDE3CF] bg-white text-[#40372B] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
              >
                <IconChevronRight size={16} />
              </button>
            </div>

            {mode === "months" ? (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {MONTHS_SHORT_ID.map((mLabel, idx) => {
                  const active = idx === viewMonth;
                  return (
                    <button
                      key={mLabel}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx);
                        setMode("days");
                      }}
                      className={cn(
                        "h-9 rounded-xl text-xs font-medium transition",
                        active
                          ? "bg-[#1F1A14] text-[#F6EEDD]"
                          : "bg-[#FCF8F1] text-[#40372B] hover:bg-[#F6EEDF] hover:text-[#1F1A14]",
                      )}
                    >
                      {mLabel}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="mb-1.5 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wider text-[#8E8268]">
                  {WEEKDAYS_ID.map((w) => (
                    <span key={w} className="py-1">
                      {w}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((cell) => {
                    const selected = cell.iso === current;
                    const isToday = cell.iso === today;
                    const dayDisabled = isDisabledDay(cell.iso);
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        disabled={dayDisabled}
                        onClick={() => {
                          commit(cell.iso);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full text-xs tabular-nums transition",
                          selected
                            ? "bg-[#1F1A14] font-semibold text-[#F6EEDD] shadow-xs"
                            : isToday
                              ? "bg-[#F6EEDF] font-semibold text-[#8A6424] ring-1 ring-[#D9B56A]/60 hover:bg-[#EDE0C6]"
                              : cell.inMonth
                                ? "text-[#1F1A14] hover:bg-[#F6EEDF]"
                                : "text-[#C4B7A0] hover:bg-[#FCF8F1]",
                          dayDisabled && "pointer-events-none opacity-30",
                        )}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-[#F3EBDB] pt-2.5 text-xs">
              <button
                type="button"
                disabled={!today || isDisabledDay(today)}
                onClick={() => {
                  if (!today || isDisabledDay(today)) return;
                  commit(today);
                  setOpen(false);
                }}
                className="font-medium text-[#8A6424] hover:underline disabled:opacity-40"
              >
                Hari ini
              </button>
              <div className="flex items-center gap-3">
                {clearable && current && (
                  <button
                    type="button"
                    onClick={() => {
                      commit("");
                      setOpen(false);
                    }}
                    className="inline-flex items-center gap-0.5 text-[#8E8268] hover:text-[#9A3B2E]"
                  >
                    <IconX size={13} /> Hapus
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="font-medium text-[#40372B] hover:text-[#1F1A14]">
                  Tutup
                </button>
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const QUICK_TIMES = ["08:00", "09:00", "10:00", "11:00", "13:00", "18:30", "19:00"];

function parseTimeParts(raw?: string | null): { hour: string; minute: string } | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { hour: String(h).padStart(2, "0"), minute: String(min).padStart(2, "0") };
}

export interface TimePickerFieldProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Custom champagne/espresso/gold time picker replacing native <input type="time">.
 * Outputs `HH:mm` (24-hour format) with wedding quick-presets and scrollable Jam/Menit lists.
 */
export function TimePickerField({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder = "Pilih waktu",
  disabled = false,
  clearable = true,
  className,
  "aria-label": ariaLabel,
}: TimePickerFieldProps) {
  const hydrated = useHydrated();
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const rawCurrent = (isControlled ? value : internal) ?? "";
  const parsed = parseTimeParts(rawCurrent);
  const [open, setOpen] = React.useState(false);

  const commit = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const selectedHour = parsed?.hour ?? "";
  const selectedMinute = parsed?.minute ?? "";

  const pickHour = (h: string) => {
    commit(`${h}:${selectedMinute || "00"}`);
  };

  const pickMinute = (m: string) => {
    commit(`${selectedHour || "08"}:${m}`);
  };

  const displayLabel = parsed ? `${parsed.hour}:${parsed.minute}` : rawCurrent.trim();

  const triggerButton = (
    <button
      type="button"
      id={id}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(TRIGGER_BASE, className)}
    >
      <span className={cn("truncate tabular-nums", !displayLabel && "text-[#8E8268]")}>{displayLabel || placeholder}</span>
      <IconClock size={16} stroke={1.7} className="shrink-0 text-[#8A6424]" />
    </button>
  );

  if (!hydrated) {
    return (
      <>
        {name && <input type="hidden" name={name} value={rawCurrent} />}
        {triggerButton}
      </>
    );
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={rawCurrent} />}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>{triggerButton}</PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content align="start" sideOffset={6} className={cn(POPOVER_SURFACE, "w-[276px]")}>
            {/* Quick presets */}
            <div className="mb-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8E8268]">Waktu populer</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TIMES.map((preset) => {
                  const active = displayLabel === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        commit(preset);
                        setOpen(false);
                      }}
                      className={cn(
                        "h-7 rounded-full border px-2.5 text-xs tabular-nums transition",
                        active
                          ? "border-[#1F1A14] bg-[#1F1A14] font-medium text-[#F6EEDD]"
                          : "border-[#EDE3CF] bg-[#FCF8F1] text-[#40372B] hover:border-[#8A6424] hover:text-[#1F1A14]",
                      )}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-column Hour & Minute lists */}
            <div className="grid grid-cols-2 gap-2 border-t border-[#F3EBDB] pt-3">
              <div>
                <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#8E8268]">Jam</p>
                <div
                  onWheel={(e) => e.stopPropagation()}
                  className="grid max-h-44 grid-cols-2 gap-1 overflow-y-auto rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/60 p-1.5"
                >
                  {HOURS.map((h) => {
                    const active = selectedHour === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => pickHour(h)}
                        className={cn(
                          "h-8 rounded-lg text-xs tabular-nums transition",
                          active ? "bg-[#1F1A14] font-semibold text-[#F6EEDD]" : "text-[#40372B] hover:bg-[#F6EEDF]",
                        )}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[#8E8268]">Menit</p>
                <div
                  onWheel={(e) => e.stopPropagation()}
                  className="grid max-h-44 grid-cols-2 gap-1 overflow-y-auto rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/60 p-1.5"
                >
                  {MINUTES.map((m) => {
                    const active = selectedMinute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => pickMinute(m)}
                        className={cn(
                          "h-8 rounded-lg text-xs tabular-nums transition",
                          active ? "bg-[#1F1A14] font-semibold text-[#F6EEDD]" : "text-[#40372B] hover:bg-[#F6EEDF]",
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between border-t border-[#F3EBDB] pt-2.5 text-xs">
              <span className="font-medium tabular-nums text-[#8A6424]">{displayLabel || "--:--"}</span>
              <div className="flex items-center gap-2.5">
                {clearable && rawCurrent && (
                  <button
                    type="button"
                    onClick={() => {
                      commit("");
                      setOpen(false);
                    }}
                    className="inline-flex items-center gap-0.5 text-[#8E8268] hover:text-[#9A3B2E]"
                  >
                    <IconX size={13} /> Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-[#1F1A14] px-3 py-1 font-medium text-[#F6EEDD] hover:bg-[#2B241B]"
                >
                  Selesai
                </button>
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  );
}
