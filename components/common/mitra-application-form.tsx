"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconBrandWhatsapp, IconCircleCheck, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import { PhoneInput } from "@/components/common/phone-input";
import { waLink } from "@/lib/phone";
import { APPLICANT_TYPE_LABEL, APPLICANT_TYPES, BUSINESS_KIND_LABEL, BUSINESS_KINDS, type ApplicantType, type BusinessKind } from "@/lib/mitra-application";

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Join request for the Mitra program, used on the landing page (visitors) and /mitra (logged-in users).
 * Nothing is activated here: an admin reviews the request, or the applicant chats the admin on WhatsApp.
 */
export function MitraApplicationForm({
  defaultName = "",
  defaultEmail = "",
  emailLocked = false,
  adminWhatsapp,
  onSubmitted,
  tone = "light",
}: {
  defaultName?: string;
  defaultEmail?: string;
  /** Logged-in user: the account email is used, so it can't be changed here */
  emailLocked?: boolean;
  adminWhatsapp?: string | null;
  onSubmitted?: () => void;
  tone?: "light" | "dark";
}) {
  const [applicantType, setApplicantType] = useState<ApplicantType>("USAHA");
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessKind, setBusinessKind] = useState<BusinessKind>("WO");
  const [instagram, setInstagram] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const dark = tone === "dark";
  const labelCls = dark ? "text-[#E6DCC8]" : undefined;
  // On the dark landing section fields sit on warm champagne paper so typed text & placeholders stay crisp
  const fieldCls = dark
    ? "border-[#463B2C] bg-[#FCF8F1] text-[#1F1A14] placeholder:text-[#8E8268] focus-visible:border-[#D9B56A] focus-visible:ring-[#D9B56A]/25"
    : "bg-white placeholder:text-[#8E8268]";
  const waHref = waLink(adminWhatsapp, "Halo admin SatuMoment, saya ingin bergabung jadi Mitra.");

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_FORMAT_RE.test(trimmedEmail);
  const showEmailError = !emailLocked && emailTouched && trimmedEmail.length > 0 && !emailValid;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!EMAIL_FORMAT_RE.test(trimmedEmail)) {
      toast.error("Format email tidak valid. Contoh: nama@email.com");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/public/mitra-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantType,
          name: name.trim(),
          email: trimmedEmail,
          whatsapp,
          businessName: applicantType === "USAHA" ? businessName.trim() : "",
          businessKind: applicantType === "USAHA" ? businessKind : null,
          instagram: instagram.trim(),
          city: city.trim(),
          note: note.trim(),
          website,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok && d.error !== "ALREADY_PENDING") return toast.error(d.message || "Gagal mengirim pengajuan");
      setDone(true);
      onSubmitted?.();
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={`space-y-3 rounded-2xl p-6 text-center ${dark ? "bg-white/5 text-[#F6EEDD]" : "bg-[#FCF8F1] text-[#1F1A14]"}`}>
        <IconCircleCheck size={36} className="mx-auto text-[#B08A3E]" />
        <p className="font-serif text-2xl">Pengajuan terkirim</p>
        <p className={`text-sm ${dark ? "text-[#CFC4AE]" : "text-[#5E5446]"}`}>
          Admin akan meninjau dan menghubungimu lewat WhatsApp. Pastikan kamu sudah punya akun SatuMoment dengan email yang sama.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div role="radiogroup" aria-label="Jenis pendaftar" className="grid grid-cols-2 gap-2">
        {APPLICANT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={applicantType === t}
            onClick={() => setApplicantType(t)}
            className={`min-h-11 rounded-xl border px-3 text-sm font-medium transition-colors ${
              applicantType === t
                ? dark
                  ? "border-[#D9B56A] bg-[#D9B56A] text-[#1F1A14]"
                  : "border-[#1F1A14] bg-[#1F1A14] text-[#F6EEDD]"
                : dark
                  ? "border-white/15 text-[#E6DCC8] hover:border-[#D9B56A]"
                  : "border-[#E9DDC6] bg-white text-[#40372B] hover:border-[#8A6424]"
            }`}
          >
            {APPLICANT_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mitra-name" className={labelCls}>Nama kamu</Label>
          <Input
            id="mitra-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Contoh: Rina Wijaya"
            className={`h-11 ${fieldCls}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mitra-email" className={labelCls}>Email akun</Label>
          <Input
            id="mitra-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            required
            readOnly={emailLocked}
            maxLength={120}
            pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
            title="Masukkan alamat email yang valid, contoh: nama@email.com"
            aria-invalid={showEmailError}
            placeholder="nama@email.com"
            className={`h-11 ${fieldCls} ${emailLocked ? "opacity-80" : ""}`}
          />
          {showEmailError && (
            <p className={`text-xs ${dark ? "text-[#F2A79B]" : "text-[#9A3B2B]"}`}>
              Format email belum benar, contoh: nama@email.com
            </p>
          )}
        </div>
      </div>

      {applicantType === "USAHA" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="mitra-business" className={labelCls}>Nama usaha</Label>
            <Input
              id="mitra-business"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              maxLength={80}
              placeholder="Contoh: Kirana Wedding"
              className={`h-11 ${fieldCls}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>Jenis usaha</Label>
            <SelectField value={businessKind} onChange={(e) => setBusinessKind(e.target.value as BusinessKind)} aria-label="Jenis usaha" className={`h-11 ${fieldCls}`}>
              {BUSINESS_KINDS.map((k) => (
                <option key={k} value={k}>
                  {BUSINESS_KIND_LABEL[k]}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mitra-wa" className={labelCls}>WhatsApp</Label>
          <PhoneInput id="mitra-wa" value={whatsapp} onChange={setWhatsapp} required className={`h-11 ${fieldCls}`} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mitra-ig" className={labelCls}>Instagram (opsional)</Label>
          <Input id="mitra-ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} maxLength={60} placeholder="@namakamu" className={`h-11 ${fieldCls}`} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mitra-city" className={labelCls}>Kota (opsional)</Label>
        <Input id="mitra-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder="Contoh: Bandung" className={`h-11 ${fieldCls}`} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mitra-note" className={labelCls}>Ceritakan sedikit (opsional)</Label>
        <Textarea
          id="mitra-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Berapa klien pernikahan per bulan, atau rencana jualanmu"
          className={fieldCls}
        />
      </div>
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" variant="gold" disabled={busy || showEmailError} className="h-11 flex-1 rounded-full">
          {busy && <IconLoader2 className="animate-spin" />}
          Kirim pengajuan Mitra
        </Button>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors ${
              dark ? "border-white/20 text-[#F6EEDD] hover:border-[#D9B56A]" : "border-[#E9DDC6] text-[#40372B] hover:border-[#8A6424]"
            }`}
          >
            <IconBrandWhatsapp size={17} className={dark ? "text-[#D9B56A]" : "text-[#8A6424]"} /> Chat admin
          </a>
        )}
      </div>
    </form>
  );
}
