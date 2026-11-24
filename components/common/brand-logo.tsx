import { cn } from "@/lib/utils";

/** Brand name used for alt text and labels next to the logo. */
export const BRAND_NAME = "SatuMoment";

const LOCKUP_SRC = {
  /** Gold symbol + charcoal wordmark, for light surfaces. */
  default: "/brand/lockup-primary.svg",
  /** All-white lockup, for dark surfaces. */
  light: "/brand/lockup-reversed.svg",
  /** All-charcoal lockup, for print or single-colour use. */
  mono: "/brand/lockup-mono.svg",
} as const;

type BrandLogoProps = {
  /** `lockup` = symbol + wordmark (default), `symbol` = SM mark only, `stacked` = symbol above wordmark. */
  variant?: "lockup" | "symbol" | "stacked";
  /** Colourway for the lockup. Ignored for `symbol` and `stacked`. */
  tone?: keyof typeof LOCKUP_SRC;
  className?: string;
  alt?: string;
};

/**
 * The SatuMoment logo exported from the brand Figma file (public/brand).
 * Size it with a height class (e.g. `h-8`); width follows the artwork's ratio.
 */
export function BrandLogo({ variant = "lockup", tone = "default", className, alt = BRAND_NAME }: BrandLogoProps) {
  const src =
    variant === "symbol" ? "/brand/symbol-gold.svg" : variant === "stacked" ? "/brand/lockup-stacked.svg" : LOCKUP_SRC[tone];
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt={alt} draggable={false} className={cn(variant === "symbol" ? "aspect-square object-contain" : "w-auto object-contain", className)} />
  );
}
