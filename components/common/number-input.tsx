"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type NativeInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "inputMode" | "max" | "min" | "prefix">;

export interface NumberInputProps extends NativeInputProps {
  /** Digits only (e.g. "350000"); "" when empty. Keep it a string so account numbers keep leading zeros. */
  value: string;
  onValueChange: (digits: string) => void;
  /**
   * `plain` renders a native `<input type="number">` for counts/percentages/days (or digit text when `keepLeadingZeros` / `maxDigits > 15`).
   * `thousands` formats money as `350.000` while keeping the value `"350000"`.
   */
  format?: "plain" | "thousands";
  /** Values above this are clamped while typing (e.g. 100 for a percentage) */
  max?: number;
  /** Maximum number of digits (default 15, inside Number.MAX_SAFE_INTEGER) */
  maxDigits?: number;
  /** Preserve leading zeros (e.g. bank account or e-wallet numbers); automatically enabled when maxDigits > 15 */
  keepLeadingZeros?: boolean;
  /** Short text shown inside a separated cap before the number, e.g. "Rp" */
  prefix?: string;
  /** Short text shown inside a separated cap after the number, e.g. "%" or "hari" */
  suffix?: string;
}

/** Keeps only 0-9, so letters, signs, "e" and pasted text never reach the state. */
export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Strip horizontal padding classes from wrapper className so prefix/suffix caps never collide with input text. */
function stripHorizontalPadding(cls?: string): string | undefined {
  if (!cls) return undefined;
  return cls.replace(/\b(?:sm:|md:|lg:|xl:)?(?:px|pl|pr)-\S+/g, "").trim();
}

const BLOCKED_NUMBER_KEYS = new Set(["e", "E", "+", "-", ".", ","]);

/**
 * Numeric / currency field with non-overlapping flex prefix/suffix caps.
 * Uses native `type="number"` for plain numbers and formatted Indonesian thousands for currency.
 */
export function NumberInput({
  value,
  onValueChange,
  format = "plain",
  max,
  maxDigits = 15,
  keepLeadingZeros,
  prefix,
  suffix,
  className,
  onKeyDown,
  onWheel,
  ...props
}: NumberInputProps) {
  const preserveZeros = keepLeadingZeros ?? maxDigits > 15;
  const useNativeNumber = format === "plain" && !preserveZeros;
  const shown = format === "thousands" && value !== "" ? Number(value).toLocaleString("id-ID") : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = onlyDigits(e.target.value).slice(0, maxDigits);
    if ((format === "thousands" || useNativeNumber) && digits !== "") {
      digits = String(Number(digits));
    }
    if (max !== undefined && digits !== "" && Number(digits) > max) {
      digits = String(max);
    }
    onValueChange(digits);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (useNativeNumber && BLOCKED_NUMBER_KEYS.has(e.key)) {
      e.preventDefault();
      return;
    }
    onKeyDown?.(e);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (useNativeNumber) e.currentTarget.blur();
    onWheel?.(e);
  };

  const nativeInput = (
    <input
      {...props}
      data-slot="input"
      type={useNativeNumber ? "number" : "text"}
      inputMode="numeric"
      min={useNativeNumber ? 0 : undefined}
      max={useNativeNumber ? max : undefined}
      step={useNativeNumber ? 1 : undefined}
      autoComplete={props.autoComplete ?? "off"}
      value={shown}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      className={cn(
        prefix || suffix
          ? "h-full min-w-0 flex-1 bg-transparent px-3 py-1 text-base tabular-nums text-foreground outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          : cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-white px-3 py-1 text-base tabular-nums shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              className,
            ),
      )}
    />
  );

  if (!prefix && !suffix) return nativeInput;

  return (
    <div
      className={cn(
        "border-input flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-white shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
        stripHorizontalPadding(className),
      )}
    >
      {prefix && (
        <span className="flex h-full shrink-0 select-none items-center border-r border-[#EDE3CF] bg-[#FCF8F1] px-3 text-xs font-semibold text-[#6B5F50]">
          {prefix}
        </span>
      )}
      {nativeInput}
      {suffix && (
        <span className="flex h-full shrink-0 select-none items-center border-l border-[#EDE3CF] bg-[#FCF8F1] px-3 text-xs font-medium text-[#6B5F50]">
          {suffix}
        </span>
      )}
    </div>
  );
}
