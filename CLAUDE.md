# SatuMoment — working rules

## UI: reuse before you build (mandatory)

Before writing any UI, check whether a component already exists and use it. Only create a new
component when nothing fits, and then make it reusable instead of a one-off.

Where to look first:

- `components/ui/` — shadcn primitives with the brand styling (Button, Select, Dialog, Tabs, Input,
  Textarea, Switch, Checkbox, Sheet, Tooltip, DropdownMenu, …).
- `components/common/` — app-wide building blocks (`PhoneInput`, `DatePickerField`, `TimePickerField`,
  `LocationPicker`, `MusicSourcePicker`, `SafeImg`, `ReferenceUploader`, …).
- `components/landing/primitives.tsx` — landing palette `L`, `Reveal`, `Display`, `Eyebrow`, `Phone` mockup.
- `components/admin/image-upload-field.tsx` and the other admin/user components for page-level patterns.

Specific rules:

- Never use a raw `<select>`, `<input type="date">`, or `<input type="time">`: use `SelectField`
  (or the composable `Select*` parts from `components/ui/select.tsx`) and `DatePickerField` /
  `TimePickerField` from `components/common/date-time-picker.tsx`.
- Buttons: `Button` from `components/ui/button.tsx` (variants include `gold` = brand foil CTA and `ink`).
  For a link that looks like a button inside a Server Component, use `<Link className={buttonVariants({ variant: "gold" })}>`
  rather than `<Button asChild>`: the Radix Slot there shifts React ids and causes hydration warnings.
- Dashboard surfaces: `PageHeader`, `Panel`, `PanelTitle`, `StatTile` from `components/common/studio-ui.tsx`.
- Phone / WhatsApp numbers: `PhoneInput` + helpers in `lib/phone.ts` (`waLink` for wa.me links).
- Change the look of a shared component in its own file once, so every page stays consistent, rather
  than overriding colours at each call site.

## Design

Follow the `invitation-design` skill (`.claude/skills/invitation-design`) for every page, component,
template and AI design prompt change. Brand: champagne background, espresso ink, gold accent
(`#8A6424`), Bodoni Moda for headings and Plus Jakarta Sans for text.
