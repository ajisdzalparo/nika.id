"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SelectField } from "@/components/ui/select";
import { PHONE_COUNTRIES, joinPhone, normalizeLocalPhone, splitPhone } from "@/lib/phone";

/**
 * The one phone / WhatsApp input for the app: country code + local number in a single field.
 * `value` and `onChange` use stored international digits (e.g. "6281234567890").
 * Height and radius follow the surrounding inputs via `className` (e.g. "h-11 rounded-xl").
 */
export function PhoneInput({
  id,
  value,
  onChange,
  required,
  disabled,
  placeholder = "81234567890",
  className,
  "aria-describedby": describedBy,
}: {
  id?: string;
  value: string;
  onChange: (digits: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  "aria-describedby"?: string;
}) {
  const parsed = splitPhone(value);
  // While the field is empty there is no number to read the code from, so remember the picked one
  const [emptyCountry, setEmptyCountry] = useState(parsed.country);
  const country = value ? parsed.country : emptyCountry;
  const local = parsed.local;

  return (
    <div
      className={cn(
        "flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <div className="flex shrink-0 items-stretch border-r border-input">
        <SelectField
          aria-label="Kode negara"
          value={country}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            setEmptyCountry(next);
            onChange(joinPhone(next, normalizeLocalPhone(local, next)));
          }}
          className="h-full! w-auto rounded-none border-0 bg-transparent pl-3 pr-2.5 tabular-nums shadow-none focus-visible:ring-0"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.short} +{c.code}
            </option>
          ))}
        </SelectField>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={local}
        required={required}
        disabled={disabled}
        aria-describedby={describedBy}
        placeholder={placeholder}
        onChange={(e) => onChange(joinPhone(country, normalizeLocalPhone(e.target.value, country)))}
        className="min-w-0 flex-1 bg-transparent px-3 text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm"
      />
    </div>
  );
}
