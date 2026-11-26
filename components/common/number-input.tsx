"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NativeInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type" | "inputMode" | "max" | "min" | "prefix">;

export interface NumberInputProps extends NativeInputProps {
  /** Digits only (e.g. "350000"); "" when empty. Keep it a string so account numbers keep leading zeros. */
  value: string;
  onValueChange: (digits: string) => void;
  /**
   * `plain` shows the digits as typed (counts, account numbers).
   * `thousands` shows 350.000 while the value stays "350000" (money).
   */
  format?: "plain" | "thousands";
  /** Values above this are clamped while typing (e.g. 100 for a percentage) */
  max?: number;
  /** Maximum number of digits (default 15, inside Number.MAX_SAFE_INTEGER) */
  maxDigits?: number;
  /** Short text shown inside the field before the number, e.g. "Rp" */
  prefix?: string;
  /** Short text shown inside the field after the number, e.g. "%" */
  suffix?: string;
}

/** Keeps only 0-9, so letters, signs, "e" and pasted text never reach the state. */
export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Text field that only accepts whole numbers. Use it instead of `<input type="number">` or a bare
 * `inputMode="numeric"`: those still let people type letters, "e", "-" or scroll the value.
 * `min` is not enforced while typing (it would fight the keyboard); validate it on submit.
 */
export function NumberInput({
  value,
  onValueChange,
  format = "plain",
  max,
  maxDigits = 15,
  prefix,
  suffix,
  className,
  ...props
}: NumberInputProps) {
  const shown = format === "thousands" && value !== "" ? Number(value).toLocaleString("id-ID") : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = onlyDigits(e.target.value).slice(0, maxDigits);
    // Money and counts drop leading zeros; plain values (account numbers) keep them
    if (format === "thousands" && digits !== "") digits = String(Number(digits));
    if (max !== undefined && digits !== "" && Number(digits) > max) digits = String(max);
    onValueChange(digits);
  };

  const input = (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete={props.autoComplete ?? "off"}
      value={shown}
      onChange={handleChange}
      className={cn("tabular-nums", prefix && "pl-11", suffix && "pr-10", className)}
    />
  );

  if (!prefix && !suffix) return input;
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8E8268]">{prefix}</span>
      )}
      {input}
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#8E8268]">{suffix}</span>
      )}
    </div>
  );
}
