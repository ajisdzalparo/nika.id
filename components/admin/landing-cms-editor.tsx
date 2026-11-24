"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconExternalLink,
  IconLoader2,
  IconPlus,
  IconRestore,
  IconTrash,
} from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LandingContent } from "@/lib/landing-content-shared";

export function LandingCmsEditor({ initialContent }: { initialContent: LandingContent }) {
  const [content, setContent] = useState<LandingContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        return toast.error(data.message || "Gagal menyimpan tulisan landing page");
      }
      if (data.content) setContent(data.content);
      toast.success("Tulisan landing page berhasil disimpan");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setConfirmReset(false);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        return toast.error(data.message || "Gagal mereset tulisan");
      }
      if (data.content) setContent(data.content);
      toast.success("Tulisan dikembalikan ke bawaan awal");
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving && <IconLoader2 size={16} className="mr-2 animate-spin" />}
            Simpan Semua Tulisan
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => setConfirmReset(true)}
          >
            <IconRestore size={16} className="mr-2" /> Reset ke Bawaan
          </Button>
        </div>
        <Button type="button" variant="ghost" asChild>
          <Link href="/" target="_blank">
            Lihat Landing Page <IconExternalLink size={15} className="ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero (Bagian Atas)</CardTitle>
          <CardDescription>Judul utama, subjudul, tombol aksi, dan 3 poin ringkas di halaman depan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="hero-eyebrow">Label Kecil Atas</Label>
            <Input
              id="hero-eyebrow"
              value={content.hero.eyebrow}
              onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, eyebrow: e.target.value } }))}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="hero-h1-prefix">Awal Judul</Label>
              <Input
                id="hero-h1-prefix"
                value={content.hero.headlinePrefix}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, headlinePrefix: e.target.value } }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-h1-hi">Kata Aksen (Miring Emas)</Label>
              <Input
                id="hero-h1-hi"
                value={content.hero.headlineHighlight}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, headlineHighlight: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-h1-suffix">Akhir Judul</Label>
              <Input
                id="hero-h1-suffix"
                value={content.hero.headlineSuffix}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, headlineSuffix: e.target.value } }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hero-sub">Subjudul</Label>
            <Textarea
              id="hero-sub"
              rows={3}
              value={content.hero.subheadline}
              onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, subheadline: e.target.value } }))}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta1">Tombol Utama</Label>
              <Input
                id="hero-cta1"
                value={content.hero.primaryCta}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, primaryCta: e.target.value } }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-cta2">Tombol Sekunder</Label>
              <Input
                id="hero-cta2"
                value={content.hero.secondaryCta}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, secondaryCta: e.target.value } }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>3 Poin Sorotan Bawah Hero</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {content.hero.highlights.map((h, i) => (
                <div key={i} className="space-y-2 rounded-xl border p-3">
                  <Input
                    value={h.title}
                    aria-label="Judul" placeholder="Judul singkat"
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        hero: {
                          ...c.hero,
                          highlights: c.hero.highlights.map((item, idx) =>
                            idx === i ? { ...item, title: e.target.value } : item,
                          ),
                        },
                      }))
                    }
                    required
                  />
                  <Input
                    value={h.description}
                    aria-label="Keterangan" placeholder="Keterangan"
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        hero: {
                          ...c.hero,
                          highlights: c.hero.highlights.map((item, idx) =>
                            idx === i ? { ...item, description: e.target.value } : item,
                          ),
                        },
                      }))
                    }
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Bagian Cara Kerja</CardTitle>
          <CardDescription>Judul dan langkah-langkah pembuatan undangan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="steps-eyebrow">Label Bagian</Label>
              <Input
                id="steps-eyebrow"
                value={content.steps.eyebrow}
                onChange={(e) => setContent((c) => ({ ...c, steps: { ...c.steps, eyebrow: e.target.value } }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="steps-heading">Judul Bagian</Label>
              <Input
                id="steps-heading"
                value={content.steps.heading}
                onChange={(e) => setContent((c) => ({ ...c, steps: { ...c.steps, heading: e.target.value } }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {content.steps.items.map((st, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-3">
                <p className="text-xs font-medium text-muted-foreground">Langkah 0{i + 1}</p>
                <Input
                  value={st.title}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      steps: {
                        ...c.steps,
                        items: c.steps.items.map((item, idx) =>
                          idx === i ? { ...item, title: e.target.value } : item,
                        ),
                      },
                    }))
                  }
                  required
                />
                <Textarea
                  rows={3}
                  value={st.body}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      steps: {
                        ...c.steps,
                        items: c.steps.items.map((item, idx) =>
                          idx === i ? { ...item, body: e.target.value } : item,
                        ),
                      },
                    }))
                  }
                  required
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Bagian Fitur &amp; WhatsApp Tamu</CardTitle>
          <CardDescription>Deskripsi fitur utama dan 6 kartu fitur undangan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="feat-eyebrow">Label Bagian</Label>
              <Input
                id="feat-eyebrow"
                value={content.features.eyebrow}
                onChange={(e) => setContent((c) => ({ ...c, features: { ...c.features, eyebrow: e.target.value } }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feat-heading">Judul Bagian</Label>
              <Input
                id="feat-heading"
                value={content.features.heading}
                onChange={(e) => setContent((c) => ({ ...c, features: { ...c.features, heading: e.target.value } }))}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feat-desc">Deskripsi</Label>
            <Textarea
              id="feat-desc"
              rows={2}
              value={content.features.description}
              onChange={(e) => setContent((c) => ({ ...c, features: { ...c.features, description: e.target.value } }))}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {content.features.items.map((item, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-3">
                <Input
                  value={item.title}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      features: {
                        ...c.features,
                        items: c.features.items.map((x, idx) =>
                          idx === i ? { ...x, title: e.target.value } : x,
                        ),
                      },
                    }))
                  }
                  required
                />
                <Textarea
                  rows={2}
                  value={item.body}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      features: {
                        ...c.features,
                        items: c.features.items.map((x, idx) =>
                          idx === i ? { ...x, body: e.target.value } : x,
                        ),
                      },
                    }))
                  }
                  required
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Bagian FAQ</CardTitle>
              <CardDescription>Daftar pertanyaan yang sering diajukan pengunjung</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={content.faq.items.length >= 15}
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  faq: {
                    ...c.faq,
                    items: [...c.faq.items, { question: "Pertanyaan baru", answer: "Jawaban pertanyaan." }],
                  },
                }))
              }
            >
              <IconPlus size={15} className="mr-1" /> Tambah FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="faq-eyebrow">Label Bagian</Label>
              <Input
                id="faq-eyebrow"
                value={content.faq.eyebrow}
                onChange={(e) => setContent((c) => ({ ...c, faq: { ...c.faq, eyebrow: e.target.value } }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faq-heading">Judul Bagian</Label>
              <Input
                id="faq-heading"
                value={content.faq.heading}
                onChange={(e) => setContent((c) => ({ ...c, faq: { ...c.faq, heading: e.target.value } }))}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            {content.faq.items.map((qa, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={qa.question}
                    placeholder="Pertanyaan"
                    onChange={(e) =>
                      setContent((c) => ({
                        ...c,
                        faq: {
                          ...c.faq,
                          items: c.faq.items.map((x, idx) =>
                            idx === i ? { ...x, question: e.target.value } : x,
                          ),
                        },
                      }))
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={content.faq.items.length <= 1}
                    aria-label="Hapus FAQ"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setContent((c) => ({
                        ...c,
                        faq: {
                          ...c.faq,
                          items: c.faq.items.filter((_, idx) => idx !== i),
                        },
                      }))
                    }
                  >
                    <IconTrash size={16} />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={qa.answer}
                  placeholder="Jawaban"
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      faq: {
                        ...c.faq,
                        items: c.faq.items.map((x, idx) =>
                          idx === i ? { ...x, answer: e.target.value } : x,
                        ),
                      },
                    }))
                  }
                  required
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Final CTA & Footer */}
      <Card>
        <CardHeader>
          <CardTitle>CTA Penutup &amp; Footer</CardTitle>
          <CardDescription>Ajakan terakhir di bawah halaman dan teks hak cipta footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="cta-prefix">Awal Judul CTA</Label>
              <Input
                id="cta-prefix"
                value={content.finalCta.headingPrefix}
                onChange={(e) =>
                  setContent((c) => ({ ...c, finalCta: { ...c.finalCta, headingPrefix: e.target.value } }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-hi">Kata Aksen</Label>
              <Input
                id="cta-hi"
                value={content.finalCta.headingHighlight}
                onChange={(e) =>
                  setContent((c) => ({ ...c, finalCta: { ...c.finalCta, headingHighlight: e.target.value } }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-suffix">Akhir Judul CTA</Label>
              <Input
                id="cta-suffix"
                value={content.finalCta.headingSuffix}
                onChange={(e) =>
                  setContent((c) => ({ ...c, finalCta: { ...c.finalCta, headingSuffix: e.target.value } }))
                }
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="space-y-1.5">
              <Label htmlFor="cta-desc">Deskripsi CTA</Label>
              <Input
                id="cta-desc"
                value={content.finalCta.description}
                onChange={(e) =>
                  setContent((c) => ({ ...c, finalCta: { ...c.finalCta, description: e.target.value } }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cta-btn">Teks Tombol</Label>
              <Input
                id="cta-btn"
                value={content.finalCta.buttonLabel}
                onChange={(e) =>
                  setContent((c) => ({ ...c, finalCta: { ...c.finalCta, buttonLabel: e.target.value } }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="footer-tagline">Tagline Footer</Label>
              <Input
                id="footer-tagline"
                value={content.footer.tagline}
                onChange={(e) =>
                  setContent((c) => ({ ...c, footer: { ...c.footer, tagline: e.target.value } }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="footer-copy">Copyright Footer</Label>
              <Input
                id="footer-copy"
                value={content.footer.copyright}
                onChange={(e) =>
                  setContent((c) => ({ ...c, footer: { ...c.footer, copyright: e.target.value } }))
                }
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset semua tulisan ke bawaan awal?</AlertDialogTitle>
            <AlertDialogDescription>
              Perubahan teks yang sudah Anda simpan di CMS akan dikembalikan ke teks bawaan UNDANGIN YUK.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Ya, reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
