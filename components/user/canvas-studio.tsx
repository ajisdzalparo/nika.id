"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconArrowLeft,
  IconBold,
  IconBrush,
  IconCheck,
  IconFlower,
  IconCopy,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconDeviceMobile,
  IconFilePlus,
  IconFlipHorizontal,
  IconFlipVertical,
  IconItalic,
  IconLayersSubtract,
  IconLayout,
  IconLoader2,
  IconLock,
  IconLockOpen,
  IconPalette,
  IconPlus,
  IconSearch,
  IconShape,
  IconShoppingBag,
  IconSparkles,
  IconStackBackward,
  IconStackForward,
  IconTrash,
  IconTypography,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import AiDesignTemplate from "@/components/templates/ai-design";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import type { PaletteDragPayload } from "@/components/templates/ai-design/ornaments";
import { ImageUploadField } from "@/components/admin/image-upload-field";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MarketplaceSellDialog } from "@/components/user/marketplace-sell-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPresetOrnament, PRESET_ORNAMENTS, type PresetOrnament } from "@/lib/ai-design/ornament-library";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import {
  BLANK_CANVAS_THEME,
  BODY_FONTS,
  CANVAS_SECTION_IDS,
  COUPLE_LAYOUTS,
  COVER_LAYOUTS,
  DISPLAY_FONTS,
  EVENT_LAYOUTS,
  GALLERY_LAYOUTS,
  LAYER_ANIMATIONS,
  ORNAMENTS,
  SCRIPT_FONTS,
  SECTION_ENTRANCES,
  TEXTURES,
  type AiTheme,
  type CanvasLayer,
  type CanvasSectionId,
  type LayerAnimation,
  type SectionEntrance,
  type SectionStyle,
} from "@/lib/ai-design/schema";
import type { AiQuota } from "@/lib/ai-design/server";
import { ART_KIT_DEFS, artKitLibrary, composeArtKit, withArtKit, type ArtKitKey } from "@/lib/ai-design/art-kits";
import type { WeddingData } from "@/types/wedding";
import { SelectField } from "@/components/ui/select";

interface DesignItem {
  id: string;
  source: string;
  prompt: string;
  createdAt: string;
  theme: AiTheme;
}

interface MyTemplateItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  platformFeePct: number;
  reviewStatus: string;
  reviewNote: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

const SECTION_LABELS: Record<CanvasSectionId, string> = {
  cover: "Sampul",
  opening: "Pembuka",
  couple: "Mempelai",
  countdown: "Hitung Mundur",
  events: "Jadwal Acara",
  story: "Cerita Cinta",
  gallery: "Galeri Foto",
  video: "Video",
  gift: "Amplop Digital",
  rsvp: "RSVP & Ucapan",
  closing: "Penutup",
};

const ELEMENT_GROUPS: readonly PresetOrnament["category"][] = [
  "Bingkai Foto",
  "Bunga & Daun",
  "Adat & Klasik",
  "Sudut & Bingkai",
  "Minimalis & Segel",
];

const CURATED_WEDDING_KEYS = new Set([
  "frame-photo-rounded",
  "frame-photo-arch",
  "frame-photo-circle",
  "frame-photo-rect",
  "floral-sprig",
  "leaf-branch",
  "jasmine-bud",
  "wreath",
  "kawung",
  "gunungan",
  "arabesque-star",
  "artdeco-fan",
  "arch-frame",
  "classic-corner",
  "oval-medallion",
  "filigree-crest",
  "wax-seal",
  "monogram-rings",
  "minimal-heart",
  "sparkle-star",
]);

const SECTION_STYLE_PRESETS: ReadonlyArray<{ label: string; style: Partial<SectionStyle> }> = [
  {
    label: "Klasik Emas",
    style: { background: "#FAF6EC", backgroundEnd: "#EFE4CC", textColor: "#241D14", accentColor: "#8A6424", surfaceColor: "#FFFDF9", displayFont: "Cormorant Garamond" },
  },
  {
    label: "Minimalis Putih",
    style: { background: "#FFFFFF", backgroundEnd: undefined, textColor: "#1A1510", accentColor: "#5E5446", surfaceColor: "#FCF8F1", displayFont: "Tenor Sans", clearDecor: true },
  },
  {
    label: "Malam Mewah",
    style: { background: "#141210", backgroundEnd: "#221D16", textColor: "#F6F0E4", accentColor: "#D4AF63", surfaceColor: "#1E1A15", displayFont: "Playfair Display" },
  },
  {
    label: "Botanical Sage",
    style: { background: "#F1F5EE", backgroundEnd: "#E3EAD9", textColor: "#1F2D22", accentColor: "#4A6B4E", surfaceColor: "#FAFDF8", displayFont: "Fraunces" },
  },
];

const ART_LIBRARY = artKitLibrary();
const ART_SLOT_SIZE = { frame: 380, corner: 220, side: 80, emblem: 80 } as const;
const ART_SLOT_LABEL = { frame: "Bingkai atas", corner: "Bunga sudut", side: "Sulur", emblem: "Lambang" } as const;

/** Previews of tinted (line) art are shown in the theme accent instead of black. */
function tintSrc(src: string, tinted: boolean) {
  return tinted && src.startsWith("data:image/svg+xml") ? src.replace(/currentColor/g, encodeURIComponent("#8A6424")) : src;
}

function isDarkHex(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.45;
}

const ANIMATION_LABELS: Record<LayerAnimation, string> = {
  none: "Tanpa Animasi",
  float: "Mengambang (Float)",
  sway: "Bergoyang Angin (Sway)",
  pulse: "Denyut Halus (Pulse)",
  "spin-slow": "Putar Pelan (Spin)",
  "fade-up": "Muncul Naik (Fade Up)",
  "zoom-in": "Zoom Masuk (Zoom In)",
  "slide-left": "Geser Kiri (Slide Left)",
  "slide-right": "Geser Kanan (Slide Right)",
  drift: "Melayang Berputar (Drift)",
};

const ENTRANCE_LABELS: Record<SectionEntrance, string> = {
  none: "Tanpa Efek",
  "fade-up": "Naik Halus (Fade Up)",
  "zoom-in": "Zoom Masuk",
  "slide-left": "Geser dari Kiri",
  "slide-right": "Geser dari Kanan",
};

const ALL_LAYER_FONTS = [...DISPLAY_FONTS, ...SCRIPT_FONTS, ...BODY_FONTS];

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export function CanvasStudio({
  previewData,
  invitationTitle,
  initialTheme,
  initialDesignId,
  initialDesigns,
  initialQuota,
  initialMyTemplates,
}: {
  previewData: WeddingData;
  invitationTitle: string;
  initialTheme: AiTheme;
  initialDesignId: string | null;
  initialDesigns: DesignItem[];
  initialQuota: AiQuota;
  initialMyTemplates: MyTemplateItem[];
}) {
  const router = useRouter();
  // A theme without hand-placed layers opens with its art kit laid out as normal, editable layers
  const [theme, setTheme] = useState<AiTheme>(() => withArtKit(initialTheme));
  const [designId, setDesignId] = useState<string | null>(initialDesignId);
  const [designs, setDesigns] = useState<DesignItem[]>(initialDesigns);
  // Set while the canvas holds a built-in preset or a catalog template: those can be used, not sold
  const [templateOrigin, setTemplateOrigin] = useState<string | null>(() => {
    const d = initialDesigns.find((x) => x.id === initialDesignId);
    return d?.source === "CATALOG" ? d.theme.name : null;
  });
  const [quota, setQuota] = useState<AiQuota>(initialQuota);
  const [myTemplates, setMyTemplates] = useState<MyTemplateItem[]>(initialMyTemplates);

  const [toolTab, setToolTab] = useState<"ornaments" | "colors" | "type" | "layout">("ornaments");
  const [ornamentSourceTab, setOrnamentSourceTab] = useState<"art" | "library" | "ai" | "upload" | "text">("art");
  const [activeSection, setActiveSection] = useState<CanvasSectionId>("cover");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // AI ornament generator
  const [aiOrnamentPrompt, setAiOrnamentPrompt] = useState("");
  const [generatingOrnament, setGeneratingOrnament] = useState(false);
  const [generatedOrnaments, setGeneratedOrnaments] = useState<{ prompt: string; dataUri: string }[]>([]);

  // Custom upload & text
  const [uploadedAssetUrl, setUploadedAssetUrl] = useState("");
  const [uploadedGallery, setUploadedGallery] = useState<string[]>([]);
  const [showGlobalAssets, setShowGlobalAssets] = useState(
    () => Boolean(initialTheme.assets?.backgroundImage || initialTheme.assets?.ornamentImage),
  );
  const [textLayerInput, setTextLayerInput] = useState("The Wedding");

  // Load saved uploaded assets tray from localStorage so uploads stay reusable across sections
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("uy_canvas_uploads");
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setUploadedGallery(parsed.filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 24));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const rememberUploadedAsset = (url: string) => {
    const clean = url.trim();
    if (!clean) return;
    setUploadedGallery((prev) => {
      const next = [clean, ...prev.filter((u) => u !== clean)].slice(0, 24);
      try {
        window.localStorage.setItem("uy_canvas_uploads", JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const removeUploadedAsset = (url: string) => {
    setUploadedGallery((prev) => {
      const next = prev.filter((u) => u !== url);
      try {
        window.localStorage.setItem("uy_canvas_uploads", JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  // Save / Apply / Marketplace modal
  const [saving, setSaving] = useState(false);
  const [sellTheme, setSellTheme] = useState<AiTheme | null>(null);
  const [showSectionBgEditor, setShowSectionBgEditor] = useState(false);
  const [deleteDesignTarget, setDeleteDesignTarget] = useState<DesignItem | null>(null);
  const [deletingDesign, setDeletingDesign] = useState(false);
  const [draggingPalette, setDraggingPalette] = useState<PaletteDragPayload | null>(null);
  const [elementQuery, setElementQuery] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<PresetOrnament["category"] | null>(null);
  const [pcPreviewOpen, setPcPreviewOpen] = useState(false);

  const layers = useMemo(() => theme.layers ?? [], [theme.layers]);
  const sectionLayers = useMemo(
    () =>
      layers
        .filter((l) => l.section === activeSection)
        .map((l, idx) => ({ layer: l, order: l.zIndex ?? idx }))
        .sort((a, b) => a.order - b.order)
        .map((x) => x.layer),
    [layers, activeSection],
  );
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const activeSectionStyle = theme.sectionStyles?.[activeSection] ?? {};

  const addLayer = (layer: Omit<CanvasLayer, "id">) => {
    const id = `lyr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const targetSecLayers = layers.filter((l) => l.section === layer.section);
    const maxZ = targetSecLayers.reduce((m, l) => Math.max(m, l.zIndex ?? 10), 10);
    const next: CanvasLayer = { zIndex: Math.min(50, maxZ + 1), ...layer, id };
    setTheme((prev) => ({ ...prev, layers: [...(prev.layers ?? []), next] }));
    setActiveSection(layer.section);
    setSelectedLayerId(id);
  };

  const startPaletteDrag = (e: React.DragEvent, payload: PaletteDragPayload) => {
    setDraggingPalette(payload);
    e.dataTransfer.effectAllowed = "copy";
    const json = JSON.stringify(payload);
    e.dataTransfer.setData("application/x-uy-canvas", json);
    e.dataTransfer.setData("text/plain", json);
  };

  const endPaletteDrag = () => {
    setDraggingPalette(null);
  };

  const shiftLayerZ = (id: string, dir: 1 | -1) => {
    const target = layers.find((l) => l.id === id);
    if (!target) return;
    const current = target.zIndex ?? 12;
    const nextZ = Math.max(1, Math.min(50, current + dir));
    updateLayer(id, { zIndex: nextZ });
  };

  const toggleLayerDepth = (id: string) => {
    const target = layers.find((l) => l.id === id);
    if (!target) return;
    const isBehind = (target.zIndex ?? 12) <= 5;
    updateLayer(id, { zIndex: isBehind ? 15 : 2 });
    toast.success(isBehind ? "Elemen dipindah ke depan teks" : "Elemen ditaruh di belakang teks (background)");
  };

  const updateSectionStyle = (sec: CanvasSectionId, patch: Partial<SectionStyle>) => {
    setTheme((prev) => {
      const current = prev.sectionStyles?.[sec] ?? {};
      const nextSec: SectionStyle = { ...current, ...patch };
      const hasAny = Object.values(nextSec).some((v) => v !== undefined && v !== false);
      if (!hasAny) {
        const rest = { ...(prev.sectionStyles ?? {}) };
        delete rest[sec];
        return { ...prev, sectionStyles: Object.keys(rest).length ? rest : undefined };
      }
      return {
        ...prev,
        sectionStyles: { ...(prev.sectionStyles ?? {}), [sec]: nextSec },
      };
    });
  };

  /** Lays the kit out on every section; earlier kit pieces are replaced, the user's own layers stay. */
  const applyArtKit = (key: Exclude<ArtKitKey, "none">) => {
    setTheme((prev) => {
      const { layers: kitLayers, sectionStyles } = composeArtKit(prev, key);
      const own = (prev.layers ?? []).filter((l) => !l.id.startsWith("kit-"));
      return {
        ...prev,
        artKit: key,
        particles: ART_KIT_DEFS[key].particles,
        layers: [...kitLayers, ...own],
        sectionStyles: { ...(prev.sectionStyles ?? {}), ...sectionStyles },
      };
    });
    setSelectedLayerId(null);
    toast.success(`Paket ${ART_KIT_DEFS[key].label} dipasang. Geser, ubah ukuran atau hapus elemennya sesuka hati.`);
  };

  const removeArtKit = () => {
    setTheme((prev) => ({ ...prev, artKit: "none", particles: "none", layers: (prev.layers ?? []).filter((l) => !l.id.startsWith("kit-")) }));
    setSelectedLayerId(null);
    toast.success("Paket ilustrasi dilepas");
  };

  /** Only original designs go to the marketplace; AI + server double-checks similarity before & on submit. */
  const openSell = (t: AiTheme, origin: string | null) => {
    if (origin) {
      toast.error(`Desain ini berasal dari template "${origin}". Template bawaan tidak bisa dijual ulang: mulai dari Kanvas Kosong atau Desain AI untuk membuat desain yang bisa dijual.`, { duration: 7000 });
      return;
    }
    setSellTheme(t);
  };

  const loadBlankCanvas = () => {
    setTheme(BLANK_CANVAS_THEME);
    setTemplateOrigin(null);
    setDesignId(null);
    setSelectedLayerId(null);
    setActiveSection("cover");
    toast.success("Kanvas kosong siap dikreasikan dari 0%!");
  };

  const updateLayer = (id: string, patch: Partial<CanvasLayer>) => {
    setTheme((prev) => ({
      ...prev,
      layers: (prev.layers ?? []).map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const removeLayer = (id: string) => {
    setTheme((prev) => ({
      ...prev,
      layers: (prev.layers ?? []).filter((l) => l.id !== id),
    }));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const generateOrnament = async () => {
    if (aiOrnamentPrompt.trim().length < 4) {
      toast.error("Tulis deskripsi ornamen minimal 4 karakter.");
      return;
    }
    setGeneratingOrnament(true);
    try {
      const res = await fetch("/api/ai/ornament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiOrnamentPrompt }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.quota) setQuota(d.quota);
        toast.error(d.message || "Gagal membuat ornamen AI");
        return;
      }
      setQuota(d.quota);
      setGeneratedOrnaments((prev) => [{ prompt: aiOrnamentPrompt.trim(), dataUri: d.dataUri }, ...prev]);
      addLayer({
        section: activeSection,
        kind: "image",
        value: d.dataUri,
        x: 50,
        y: 25,
        size: 110,
        rotation: 0,
        opacity: 0.9,
      });
      setAiOrnamentPrompt("");
      toast.success("Ornamen AI dibuat dan langsung ditaruh di kanvas!");
    } finally {
      setGeneratingOrnament(false);
    }
  };

  const saveCanvas = async (applyToInvitation: boolean, asNewCopy = false) => {
    setSaving(true);
    try {
      const targetName = asNewCopy && !theme.name.includes("(Salinan)") ? `${theme.name} (Salinan)` : theme.name;
      const payloadTheme = asNewCopy ? { ...theme, name: targetName } : theme;
      const res = await fetch("/api/user/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: asNewCopy ? null : designId,
          name: targetName,
          theme: payloadTheme,
          apply: applyToInvitation,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal menyimpan desain kanvas");
        return;
      }
      setDesignId(d.design.id);
      if (asNewCopy) setTheme(d.design.theme);
      setDesigns((prev) => {
        const exists = prev.some((x) => x.id === d.design.id);
        return exists ? prev.map((x) => (x.id === d.design.id ? d.design : x)) : [d.design, ...prev];
      });
      toast.success(
        applyToInvitation
          ? `Desain "${targetName}" disimpan & dipakai di ${invitationTitle}!`
          : asNewCopy
            ? `Tersimpan sebagai desain baru "${targetName}".`
            : `Draf "${targetName}" tersimpan.`,
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const duplicateSavedDesign = async (item: DesignItem) => {
    setSaving(true);
    try {
      const copyName = `${item.theme.name} (Salinan)`;
      const copyTheme = { ...item.theme, name: copyName };
      const res = await fetch("/api/user/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: null, name: copyName, theme: copyTheme, apply: false }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal menduplikat desain");
        return;
      }
      setDesigns((prev) => [d.design, ...prev]);
      toast.success(`"${copyName}" ditambahkan ke daftar desain.`);
    } finally {
      setSaving(false);
    }
  };

  const deleteSavedDesign = async (item: DesignItem) => {
    setDeletingDesign(true);
    try {
      const res = await fetch(`/api/user/canvas?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.message || "Gagal menghapus desain");
        return;
      }
      setDesigns((prev) => prev.filter((x) => x.id !== item.id));
      if (designId === item.id) setDesignId(null);
      setDeleteDesignTarget(null);
      toast.success(`Desain "${item.theme.name}" dihapus.`);
      router.refresh();
    } finally {
      setDeletingDesign(false);
    }
  };

  const queryClean = elementQuery.trim().toLowerCase();
  const curatedPresets = useMemo(
    () => PRESET_ORNAMENTS.filter((p) => CURATED_WEDDING_KEYS.has(p.key)),
    [],
  );
  const shownPresets = useMemo(() => {
    const base = expandedGroup ? curatedPresets.filter((p) => p.category === expandedGroup) : curatedPresets;
    if (!queryClean) return base;
    return PRESET_ORNAMENTS.filter((p) => `${p.label} ${p.category} ${p.key}`.toLowerCase().includes(queryClean));
  }, [curatedPresets, expandedGroup, queryClean]);

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden bg-[#FCF8F1] px-4 pb-20 pt-6 lg:px-8">
      <div className="w-full space-y-6">
        {/* Top Studio Toolbar */}
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-[#EDE3CF] bg-white p-4 sm:p-5 xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/kanvas"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-3.5 text-xs font-medium text-[#1A1510] hover:bg-[#F3EBDB]"
            >
              <IconArrowLeft size={14} /> Daftar Desain
            </Link>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5E8CA] text-[#8A6424]">
              <IconBrush size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">Kanvas Desain Kreatif</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <input
                  value={theme.name}
                  onChange={(e) => setTheme((prev) => ({ ...prev, name: e.target.value }))}
                  aria-label="Nama desain"
                  className="h-9 min-w-0 w-full rounded-lg border border-[#E9DDC6] bg-[#FCF8F1] px-2.5 font-serif text-xl font-medium text-[#1A1510] outline-none focus:border-[#8A6424] sm:w-52"
                />
                <SelectField size="sm"
                  aria-label="Muat preset atau desain tersimpan"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    if (val === "blank") {
                      loadBlankCanvas();
                      return;
                    }
                    if (val.startsWith("preset:")) {
                      const k = val.slice(7);
                      const p = AI_THEME_PRESETS[k];
                      if (p) {
                        setTheme(withArtKit(p.theme));
                        setTemplateOrigin(p.theme.name);
                        setDesignId(null);
                        setSelectedLayerId(null);
                        toast.success(`Preset "${p.label}" dimuat ke kanvas`);
                      }
                    } else if (val.startsWith("design:")) {
                      const id = val.slice(7);
                      const found = designs.find((d) => d.id === id);
                      if (found) {
                        setTheme(withArtKit(found.theme));
                        setTemplateOrigin(found.source === "CATALOG" ? found.theme.name : null);
                        setDesignId(found.source === "CANVAS" ? found.id : null);
                        setSelectedLayerId(null);
                        toast.success(`Desain "${found.theme.name}" dimuat ke kanvas`);
                      }
                    }
                  }}
                  className="min-w-0 max-w-full"
                >
                  <option value="">Muat dari kanvas / preset…</option>
                  <option value="blank">Kanvas Kosong (Mulai dari 0%)</option>
                  <optgroup label="Preset Bawaan">
                    {Object.entries(AI_THEME_PRESETS).map(([k, v]) => (
                      <option key={k} value={`preset:${k}`}>
                        {v.label}
                      </option>
                    ))}
                  </optgroup>
                  {designs.length > 0 && (
                    <optgroup label="Desain Saya">
                      {designs.map((d) => (
                        <option key={d.id} value={`design:${d.id}`}>
                          {d.theme.name} ({d.source})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </SelectField>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={loadBlankCanvas}
              className="h-10 rounded-full border-[#E9DDC6] bg-[#FCF8F1] px-3.5 text-xs font-medium text-[#1A1510]"
            >
              <IconFilePlus size={15} className="mr-1.5 text-[#8A6424]" /> Kanvas Kosong
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => void saveCanvas(false)}
              className="h-10 rounded-full border-[#E9DDC6] px-4 text-xs font-medium"
            >
              <IconDeviceFloppy size={15} className="mr-1.5" /> {designId ? "Simpan" : "Simpan Draf"}
            </Button>
            {designId && (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void saveCanvas(false, true)}
                className="h-10 rounded-full border-[#E9DDC6] px-3.5 text-xs font-medium"
              >
                <IconCopy size={15} className="mr-1.5" /> Simpan Baru
              </Button>
            )}
            <Button
              type="button"
              disabled={saving}
              onClick={() => void saveCanvas(true)}
              className="h-10 rounded-full bg-[#1A1510] px-4 text-xs font-medium text-[#FCF8F1] hover:bg-[#2B241B]"
            >
              {saving ? <IconLoader2 size={15} className="mr-1.5 animate-spin" /> : <IconCheck size={15} className="mr-1.5" />}
              Pakai di Undangan
            </Button>
            <Button
              type="button"
              onClick={() => {
                openSell(theme, templateOrigin);
              }}
              className="h-10 rounded-full bg-[#8A6424] px-4 text-xs font-semibold text-white hover:bg-[#755925]"
            >
              <IconShoppingBag size={15} className="mr-1.5" /> Jual Template
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          {/* LEFT: Canva-style Left Icon Rail + Contextual Drawer */}
          <div className="min-w-0 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              {/* Canva Left Vertical Rail */}
              <nav
                aria-label="Alat kanvas"
                className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-[#EDE3CF] bg-white p-1.5 sm:w-[76px] sm:flex-col sm:overflow-visible"
              >
                {(
                  [
                    ["ornaments", "Ilustrasi", IconFlower, "art"],
                    ["ornaments", "AI", IconSparkles, "ai"],
                    ["ornaments", "Bingkai & Hiasan", IconShape, "library"],
                    ["type", "Teks", IconTypography, "text"],
                    ["ornaments", "Unggahan", IconUpload, "upload"],
                    ["colors", "Warna", IconPalette, null],
                    ["layout", "Layout", IconLayout, null],
                  ] as const
                ).map(([tabKey, label, Icon, sub]) => {
                  const active =
                    tabKey === "ornaments"
                      ? toolTab === "ornaments" && ornamentSourceTab === sub
                      : toolTab === tabKey;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setToolTab(tabKey);
                        if (sub) setOrnamentSourceTab(sub);
                      }}
                      className={`flex min-w-[62px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium transition sm:min-w-0 sm:w-full ${
                        active
                          ? "bg-[#1A1510] text-[#FCF8F1] shadow-xs"
                          : "text-[#5E5446] hover:bg-[#FCF8F1] hover:text-[#1A1510]"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="leading-none">{label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="min-w-0 flex-1 space-y-6">
            {/* Context-Aware Click-to-Edit Section Card (WordPress/Canva style) */}
            <div className="rounded-2xl border border-[#E6D5B2] bg-[#FFFDF9] p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F5E8CA] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A6424]">
                    Section Dipilih
                  </span>
                  <SelectField size="sm"
                    aria-label="Pilih section aktif"
                    value={activeSection}
                    onChange={(e) => {
                      setActiveSection(e.target.value as CanvasSectionId);
                      setSelectedLayerId(null);
                    }}
                    className="font-semibold"
                  >
                    {CANVAS_SECTION_IDS.map((s) => (
                      <option key={s} value={s}>
                        {SECTION_LABELS[s]}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <span className="text-[11px] font-medium text-[#6B5F50]">Struktur Baku 11 Section</span>
              </div>

              {/* Instant Layout / Copy Controls for clicked section */}
              {activeSection === "cover" && (
                <div className="mt-3 space-y-2.5 border-t border-[#F3EBDB] pt-3">
                  <p className="text-[11px] font-medium text-[#5E5446]">Layout Sampul (klik langsung untuk ganti):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COVER_LAYOUTS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, cover: l } }))}
                        className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition ${
                          theme.layout.cover === l
                            ? "border-[#1A1510] bg-[#1A1510] text-white"
                            : "border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={theme.copy.coverEyebrow}
                      onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, coverEyebrow: e.target.value } }))}
                      placeholder="Label atas sampul (mis. The Wedding of)"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={theme.copy.openButton}
                      onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, openButton: e.target.value } }))}
                      placeholder="Teks tombol buka"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              {activeSection === "couple" && (
                <div className="mt-3 space-y-2 border-t border-[#F3EBDB] pt-3">
                  <p className="text-[11px] font-medium text-[#5E5446]">Layout Mempelai:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COUPLE_LAYOUTS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, couple: l } }))}
                        className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition ${
                          theme.layout.couple === l
                            ? "border-[#1A1510] bg-[#1A1510] text-white"
                            : "border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "events" && (
                <div className="mt-3 space-y-2 border-t border-[#F3EBDB] pt-3">
                  <p className="text-[11px] font-medium text-[#5E5446]">Layout Jadwal Acara:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EVENT_LAYOUTS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, events: l } }))}
                        className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition ${
                          theme.layout.events === l
                            ? "border-[#1A1510] bg-[#1A1510] text-white"
                            : "border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "gallery" && (
                <div className="mt-3 space-y-2 border-t border-[#F3EBDB] pt-3">
                  <p className="text-[11px] font-medium text-[#5E5446]">Layout Galeri Foto:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {GALLERY_LAYOUTS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, gallery: l } }))}
                        className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition ${
                          theme.layout.gallery === l
                            ? "border-[#1A1510] bg-[#1A1510] text-white"
                            : "border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "opening" && (
                <div className="mt-3 space-y-2 border-t border-[#F3EBDB] pt-3">
                  <Input
                    value={theme.copy.greeting}
                    onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, greeting: e.target.value } }))}
                    placeholder="Salam pembuka..."
                    className="h-8 text-xs"
                  />
                  <Textarea
                    rows={2}
                    value={theme.copy.opening}
                    onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, opening: e.target.value } }))}
                    placeholder="Teks pembuka undangan..."
                    className="min-h-[54px] text-xs"
                  />
                </div>
              )}

              {activeSection === "closing" && (
                <div className="mt-3 space-y-2 border-t border-[#F3EBDB] pt-3">
                  <Textarea
                    rows={2}
                    value={theme.copy.closing}
                    onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, closing: e.target.value } }))}
                    placeholder="Teks penutup undangan..."
                    className="min-h-[54px] text-xs"
                  />
                </div>
              )}

              {/* Quick trigger & full per-section style panel (always reachable for ALL 11 sections) */}
              <div className="mt-3 border-t border-[#F3EBDB] pt-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#40372B]">
                    <IconPalette size={14} className="text-[#8A6424]" />
                    Kustomisasi Tampilan Section: <strong>{SECTION_LABELS[activeSection]}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {theme.sectionStyles?.[activeSection] && (
                      <button
                        type="button"
                        onClick={() =>
                          setTheme((prev) => {
                            const next = { ...(prev.sectionStyles ?? {}) };
                            delete next[activeSection];
                            return { ...prev, sectionStyles: Object.keys(next).length ? next : undefined };
                          })
                        }
                        className="text-[11px] text-rose-700 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSectionBgEditor((v) => !v)}
                      className="rounded-full border border-[#E6D5B2] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#8A6424] hover:bg-[#FCF5E6]"
                    >
                      {showSectionBgEditor ? "Tutup Gaya Section" : "Ubah Warna, Font & Gaya →"}
                    </button>
                  </div>
                </div>

                {showSectionBgEditor && (
                  <div className="mt-3 grid gap-3 rounded-xl border border-[#F3EBDB] bg-[#FCF8F1] p-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-[11px]">Preset Cepat Gaya Section (1 Klik)</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {SECTION_STYLE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => updateSectionStyle(activeSection, preset.style)}
                            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-white px-2.5 text-[11px] font-medium text-[#40372B] hover:border-[#8A6424] hover:bg-[#FCF5E6]"
                          >
                            <span
                              aria-hidden="true"
                              className="h-2.5 w-2.5 rounded-full border border-black/15"
                              style={{ background: preset.style.background }}
                            />
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Latar Section (Solid / Gradasi)</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="color"
                          title="Warna awal / solid"
                          value={activeSectionStyle.background || theme.palette.background}
                          onChange={(e) => updateSectionStyle(activeSection, { background: e.target.value })}
                          className="h-8 w-10 cursor-pointer rounded-lg border border-[#E9DDC6] bg-white p-0.5"
                        />
                        <span className="text-[10px] text-[#6B5F50]">→</span>
                        <input
                          type="color"
                          title="Warna akhir gradasi (opsional)"
                          value={activeSectionStyle.backgroundEnd || activeSectionStyle.background || theme.palette.surface}
                          onChange={(e) =>
                            updateSectionStyle(activeSection, {
                              background: activeSectionStyle.background || theme.palette.background,
                              backgroundEnd: e.target.value,
                            })
                          }
                          className="h-8 w-10 cursor-pointer rounded-lg border border-[#E9DDC6] bg-white p-0.5"
                        />
                        {(activeSectionStyle.background || activeSectionStyle.backgroundEnd) && (
                          <button
                            type="button"
                            onClick={() => updateSectionStyle(activeSection, { background: undefined, backgroundEnd: undefined })}
                            className="text-[10px] text-[#8A6424] underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Warna Teks, Aksen &amp; Kartu</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1 text-[10px] text-[#5E5446]">
                          Teks
                          <input
                            type="color"
                            value={activeSectionStyle.textColor || theme.palette.ink}
                            onChange={(e) => updateSectionStyle(activeSection, { textColor: e.target.value })}
                            className="h-8 w-9 cursor-pointer rounded-lg border border-[#E9DDC6] bg-white p-0.5"
                          />
                        </label>
                        <label className="inline-flex items-center gap-1 text-[10px] text-[#5E5446]">
                          Aksen
                          <input
                            type="color"
                            value={activeSectionStyle.accentColor || theme.palette.accent}
                            onChange={(e) => updateSectionStyle(activeSection, { accentColor: e.target.value })}
                            className="h-8 w-9 cursor-pointer rounded-lg border border-[#E9DDC6] bg-white p-0.5"
                          />
                        </label>
                        <label className="inline-flex items-center gap-1 text-[10px] text-[#5E5446]">
                          Kartu
                          <input
                            type="color"
                            value={activeSectionStyle.surfaceColor || theme.palette.surface}
                            onChange={(e) => updateSectionStyle(activeSection, { surfaceColor: e.target.value })}
                            className="h-8 w-9 cursor-pointer rounded-lg border border-[#E9DDC6] bg-white p-0.5"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Font Judul Section</Label>
                      <SelectField size="sm"
                        value={activeSectionStyle.displayFont ?? ""}
                        onChange={(e) =>
                          updateSectionStyle(activeSection, {
                            displayFont: e.target.value ? (e.target.value as SectionStyle["displayFont"]) : undefined,
                          })
                        }
                        className="w-full"
                      >
                        <option value="">Ikuti font global ({theme.typography.display})</option>
                        {[...DISPLAY_FONTS, ...SCRIPT_FONTS].map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </SelectField>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Font Isi Section</Label>
                      <SelectField size="sm"
                        value={activeSectionStyle.bodyFont ?? ""}
                        onChange={(e) =>
                          updateSectionStyle(activeSection, {
                            bodyFont: e.target.value ? (e.target.value as SectionStyle["bodyFont"]) : undefined,
                          })
                        }
                        className="w-full"
                      >
                        <option value="">Ikuti font global ({theme.typography.body})</option>
                        {BODY_FONTS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </SelectField>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Perataan Teks &amp; Jarak Atas-Bawah</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ["left", "Kiri"],
                            ["center", "Tengah"],
                            ["right", "Kanan"],
                          ] as const
                        ).map(([al, lbl]) => (
                          <button
                            key={al}
                            type="button"
                            onClick={() => updateSectionStyle(activeSection, { textAlign: al })}
                            className={`h-7 rounded-lg border px-2 text-[11px] ${
                              (activeSectionStyle.textAlign ?? "center") === al
                                ? "border-[#1A1510] bg-[#1A1510] text-white"
                                : "border-[#E9DDC6] bg-white text-[#40372B]"
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                        {(
                          [
                            ["compact", "Rapat"],
                            ["normal", "Normal"],
                            ["spacious", "Luas"],
                          ] as const
                        ).map(([pad, lbl]) => (
                          <button
                            key={pad}
                            type="button"
                            onClick={() => updateSectionStyle(activeSection, { paddingY: pad })}
                            className={`h-7 rounded-lg border px-2 text-[11px] ${
                              (activeSectionStyle.paddingY ?? "normal") === pad
                                ? "border-[#8A6424] bg-[#FCF5E6] font-semibold text-[#5C431A]"
                                : "border-[#E9DDC6] bg-white text-[#40372B]"
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Animasi Masuk Section</Label>
                      <SelectField size="sm"
                        value={activeSectionStyle.entrance ?? "none"}
                        onChange={(e) =>
                          updateSectionStyle(activeSection, {
                            entrance: e.target.value === "none" ? undefined : (e.target.value as SectionEntrance),
                          })
                        }
                        className="w-full"
                      >
                        {SECTION_ENTRANCES.map((ent) => (
                          <option key={ent} value={ent}>
                            {ENTRANCE_LABELS[ent]}
                          </option>
                        ))}
                      </SelectField>
                    </div>

                    <div className="space-y-1">
                      <label className="block space-y-1 text-[11px]">
                        <span className="flex justify-between font-medium text-[#40372B]">
                          <span>Tinggi Minimal Kanvas Section</span>
                          <span className="tabular-nums text-[#6B5F50]">{activeSectionStyle.minHeight ?? 0}px</span>
                        </span>
                        <input
                          type="range"
                          min={200}
                          max={760}
                          step={20}
                          value={activeSectionStyle.minHeight ?? 240}
                          onChange={(e) => updateSectionStyle(activeSection, { minHeight: Number(e.target.value) })}
                          className="w-full accent-[#8A6424]"
                        />
                      </label>
                    </div>

                    <div className="flex items-center">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E9DDC6] bg-white px-3 py-2 text-[11px] font-medium text-[#40372B]">
                        <input
                          type="checkbox"
                          checked={Boolean(activeSectionStyle.clearDecor)}
                          onChange={(e) => updateSectionStyle(activeSection, { clearDecor: e.target.checked })}
                          className="h-4 w-4 accent-[#8A6424]"
                        />
                        <span>Kanvas Bersih (sembunyikan ornamen bawaan section ini)</span>
                      </label>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-[11px]">Gambar Latar Section (opsional)</Label>
                      <ImageUploadField
                        value={activeSectionStyle.backgroundImage ?? ""}
                        onChange={(url) => updateSectionStyle(activeSection, { backgroundImage: url || undefined })}
                        aspect="aspect-[16/9]"
                      />
                      {activeSectionStyle.backgroundImage && (
                        <label className="mt-1.5 block space-y-1 text-[11px]">
                          <span className="flex justify-between">
                            <span>Gelap/Tint Overlay Gambar Latar</span>
                            <span>{Math.round((activeSectionStyle.overlayOpacity ?? 0.35) * 100)}%</span>
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={85}
                            value={Math.round((activeSectionStyle.overlayOpacity ?? 0.35) * 100)}
                            onChange={(e) => updateSectionStyle(activeSection, { overlayOpacity: Number(e.target.value) / 100 })}
                            className="w-full accent-[#8A6424]"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TAB 1: Ornaments & Canvas Layers */}
            {toolTab === "ornaments" && (
              <div className="min-w-0 space-y-5 overflow-hidden rounded-2xl border border-[#EDE3CF] bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3EBDB] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8A6424]">Target Section Kanvas</p>
                    <p className="text-xs text-[#6B5F50]">Pilih section lalu tambahkan ornamen, dan seret langsung di pratinjau HP.</p>
                  </div>
                  <SelectField
                    value={activeSection}
                    onChange={(e) => {
                      setActiveSection(e.target.value as CanvasSectionId);
                      setSelectedLayerId(null);
                    }}
                    className="font-medium"
                  >
                    {CANVAS_SECTION_IDS.map((s) => (
                      <option key={s} value={s}>
                        {SECTION_LABELS[s]}
                      </option>
                    ))}
                  </SelectField>
                </div>

                {/* Source sub-tabs */}
                <div className="grid grid-cols-2 gap-2 2xl:grid-cols-5">
                  {(
                    [
                      ["art", "Ilustrasi"],
                      ["ai", "AI Studio & Ornamen"],
                      ["library", "Bingkai & Hiasan"],
                      ["upload", "Upload Sendiri"],
                      ["text", "Tambah Teks"],
                    ] as const
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setOrnamentSourceTab(k)}
                      className={`h-10 rounded-xl border text-xs font-medium transition ${
                        ornamentSourceTab === k
                          ? "border-[#8A6424] bg-[#FCF5E6] text-[#5C431A]"
                          : "border-[#F3EBDB] bg-[#FCF8F1] text-[#5E5446] hover:bg-[#F6EEDF]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {ornamentSourceTab === "library" && (
                  <div className="space-y-3.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-[#E9DDC6] bg-[#FCF8F1] px-3 text-xs">
                        <IconSearch size={14} className="shrink-0 text-[#6B5F50]" />
                        <input
                          value={elementQuery}
                          onChange={(e) => setElementQuery(e.target.value)}
                          placeholder="Cari bingkai foto, bunga, adat, segel…"
                          className="w-full min-w-0 bg-transparent text-xs text-[#1A1510] outline-none placeholder:text-[#8E8578]"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpandedGroup(null)}
                        className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition ${
                          !expandedGroup
                            ? "border-[#1A1510] bg-[#1A1510] text-white"
                            : "border-[#E9DDC6] bg-white text-[#5E5446] hover:bg-[#FCF8F1]"
                        }`}
                      >
                        Pilihan Undangan ({curatedPresets.length})
                      </button>
                      {ELEMENT_GROUPS.map((groupName) => (
                        <button
                          key={groupName}
                          type="button"
                          onClick={() => setExpandedGroup(groupName)}
                          className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition ${
                            expandedGroup === groupName
                              ? "border-[#1A1510] bg-[#1A1510] text-white"
                              : "border-[#E9DDC6] bg-white text-[#5E5446] hover:bg-[#FCF8F1]"
                          }`}
                        >
                          {groupName}
                        </button>
                      ))}
                    </div>

                    <p className="text-[11px] text-[#6B5F50]">
                      Gunakan <strong>Bingkai Foto</strong> atau <strong>Upload Sendiri / AI</strong> untuk hasil paling unik — seret atau klik ke section <strong>{SECTION_LABELS[activeSection]}</strong>.
                    </p>

                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {shownPresets.map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            startPaletteDrag(e, {
                              kind: "preset",
                              value: o.key,
                              size: o.photoMask ? 150 : 96,
                            });
                          }}
                          onDragEnd={endPaletteDrag}
                          onClick={() => {
                            addLayer({
                              section: activeSection,
                              kind: "preset",
                              value: o.key,
                              x: 50,
                              y: 26,
                              size: o.photoMask ? 150 : 96,
                              rotation: 0,
                              opacity: o.photoMask ? 1 : 0.85,
                            });
                          }}
                          title={o.label}
                          className="flex cursor-grab flex-col items-center gap-1 rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/70 p-2 text-center transition hover:border-[#8A6424] hover:bg-[#FCF5E6] active:cursor-grabbing"
                        >
                          <svg
                            viewBox={o.viewBox}
                            className="pointer-events-none h-9 w-9"
                            style={{ color: theme.palette.accent }}
                            dangerouslySetInnerHTML={{ __html: o.paths }}
                          />
                          <span className="pointer-events-none line-clamp-1 text-[10px] font-medium text-[#40372B]">
                            {o.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {ornamentSourceTab === "ai" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E6D5B2] bg-[#FCF5E6] px-3.5 py-2.5 text-xs">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[#1A1510]">Generate Tema Otomatis dengan AI Designer</p>
                        <p className="text-[11px] text-[#5E5446]">
                          Buat seluruh palet warna, tipografi, dan tata letak tema utuh menggunakan AI resmi SatuMoment.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href="/ai-design"
                          className="inline-flex h-8 items-center gap-1 rounded-full bg-[#1A1510] px-3 text-[11px] font-medium text-[#FCF8F1] hover:bg-[#2B241B]"
                        >
                          <IconSparkles size={13} /> Buka AI Designer
                        </Link>
                        <Link
                          href="/upgrade?pilih=kredit#kredit-ai"
                          className="inline-flex h-8 items-center rounded-full border border-[#D9B56A] bg-white px-3 text-[11px] font-medium text-[#8A6424] hover:bg-[#FCF8F1]"
                        >
                          Top-up Kredit
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5E5446]">
                      <span>Deskripsikan ornamen vektor yang ingin dibuat AI (1 kredit per generate).</span>
                      <span className="rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-2.5 py-0.5 font-medium text-[#5C431A]">
                        Sisa: {quota.remaining} kredit
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={aiOrnamentPrompt}
                        onChange={(e) => setAiOrnamentPrompt(e.target.value)}
                        placeholder="Mis. Bunga melati dan sulur batik gaya line-art minimalis"
                        className="h-11 flex-1"
                        disabled={generatingOrnament}
                      />
                      <Button
                        type="button"
                        disabled={generatingOrnament || quota.remaining < 1}
                        onClick={() => void generateOrnament()}
                        className="h-11 rounded-xl bg-[#1A1510] px-5 text-xs font-medium text-[#FCF8F1]"
                      >
                        {generatingOrnament ? <IconLoader2 size={16} className="mr-1.5 animate-spin" /> : <IconSparkles size={16} className="mr-1.5" />}
                        {generatingOrnament ? "Membuat..." : "Generate Ornamen (1 Kredit)"}
                      </Button>
                    </div>
                    {quota.remaining < 1 && (
                      <p className="text-xs text-amber-800">
                        Kredit AI habis.{" "}
                        <Link href="/upgrade?pilih=kredit#kredit-ai" className="font-semibold underline">
                          Top-up Kredit AI →
                        </Link>
                      </p>
                    )}
                    {generatedOrnaments.length > 0 && (
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                        {generatedOrnaments.map((g, i) => (
                          <button
                            key={i}
                            type="button"
                            draggable
                            onDragStart={(e) =>
                              startPaletteDrag(e, {
                                kind: "image",
                                value: g.dataUri,
                                size: 110,
                              })
                            }
                            onDragEnd={endPaletteDrag}
                            onClick={() =>
                              addLayer({
                                section: activeSection,
                                kind: "image",
                                value: g.dataUri,
                                x: 50,
                                y: 24,
                                size: 110,
                                rotation: 0,
                                opacity: 0.9,
                              })
                            }
                            className="flex cursor-grab flex-col items-center gap-1.5 rounded-xl border border-[#E6D5B2] bg-[#FCF8F1] p-2.5 hover:border-[#8A6424] active:cursor-grabbing"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={g.dataUri} alt={g.prompt} className="pointer-events-none h-14 w-14 object-contain" />
                            <span className="pointer-events-none line-clamp-1 text-[10px] text-[#5E5446]">{g.prompt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {ornamentSourceTab === "art" && (
                  <div className="space-y-6">
                    {/* One click: a complete layered composition on every section */}
                    <div className="space-y-2.5">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#1A1510]">Paket ilustrasi</p>
                          <p className="text-[11px] text-[#6B5F50]">Pasang bingkai, bunga sudut, sulur, lambang, latar & partikel ke semua section sekaligus. Setelah itu tiap elemen bebas digeser, diubah ukurannya, ditumpuk atau dihapus.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {ART_LIBRARY.map((kit) => {
                          const active = theme.artKit === kit.key;
                          const corner = kit.items.find((i) => i.slot === "corner") ?? kit.items[0];
                          return (
                            <button
                              key={kit.key}
                              type="button"
                              onClick={() => applyArtKit(kit.key)}
                              className={`group overflow-hidden rounded-xl border text-left transition ${active ? "border-[#8A6424] ring-2 ring-[#8A6424]/20" : "border-[#EDE3CF] hover:border-[#8A6424]"}`}
                            >
                              <span className="relative block h-20 overflow-hidden" style={{ background: kit.tinted ? theme.palette.background : "#F6F2EA" }}>
                                {kit.backdrop && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={kit.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                                )}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={tintSrc(corner.src, kit.tinted)} alt="" className="absolute bottom-0 left-0 h-[85%] w-auto transition-transform duration-500 group-hover:scale-105" />
                              </span>
                              <span className="flex items-center justify-between gap-1 px-2.5 py-2 text-xs font-medium text-[#1A1510]">
                                {kit.label}
                                {active && <IconCheck size={14} className="text-[#8A6424]" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {theme.artKit && theme.artKit !== "none" && (
                        <button type="button" onClick={removeArtKit} className="text-[11px] font-medium text-[#8A6424] hover:underline">
                          Lepas paket ilustrasi
                        </button>
                      )}
                    </div>

                    {/* Ambient particles */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[#1A1510]">Partikel jatuh (sampul & penutup)</p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["none", "Tanpa"],
                            ["petals", "Kelopak bunga"],
                            ["gold-dust", "Debu emas"],
                            ["leaves", "Daun"],
                          ] as const
                        ).map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setTheme((prev) => ({ ...prev, particles: k }))}
                            className={`h-9 rounded-full border px-3.5 text-xs font-medium transition ${
                              (theme.particles ?? "none") === k ? "border-[#1A1510] bg-[#1A1510] text-white" : "border-[#E9DDC6] bg-white text-[#40372B] hover:border-[#8A6424]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Individual illustrations: click or drag onto the canvas, stack them freely */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1A1510]">Elemen ilustrasi</p>
                        <p className="text-[11px] text-[#6B5F50]">
                          Klik untuk menambah ke <strong>{SECTION_LABELS[activeSection]}</strong> atau seret ke posisi yang diinginkan. Atur urutan tumpukan di daftar layer di bawah.
                        </p>
                      </div>
                      {ART_LIBRARY.map((kit) => (
                        <div key={kit.key} className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B5F50]">{kit.label}</p>
                          <div className="grid grid-cols-4 gap-2">
                            {kit.items.map((item) => {
                              const size = ART_SLOT_SIZE[item.slot];
                              const src = tintSrc(item.src, kit.tinted);
                              const payload = { kind: "image" as const, value: item.src, size, heightRatio: item.ratio, color: kit.tinted ? theme.palette.accent : undefined };
                              return (
                                <button
                                  key={item.slot}
                                  type="button"
                                  draggable
                                  onDragStart={(e) => startPaletteDrag(e, payload)}
                                  onDragEnd={endPaletteDrag}
                                  onClick={() =>
                                    addLayer({
                                      section: activeSection,
                                      kind: "image",
                                      value: item.src,
                                      x: 50,
                                      y: item.slot === "frame" ? 8 : item.slot === "corner" ? 90 : 40,
                                      size,
                                      heightRatio: item.ratio,
                                      rotation: 0,
                                      opacity: 1,
                                      animation: item.slot === "frame" ? undefined : item.slot === "emblem" ? "float" : "sway",
                                      ...(kit.tinted ? { color: theme.palette.accent } : {}),
                                    })
                                  }
                                  title={`${kit.label} · ${ART_SLOT_LABEL[item.slot]}`}
                                  className="flex cursor-grab flex-col items-center gap-1 rounded-xl border border-[#F3EBDB] p-1.5 transition hover:border-[#8A6424] active:cursor-grabbing"
                                  style={{ background: kit.tinted ? theme.palette.background : "#FCF8F1" }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={src} alt="" className="pointer-events-none h-12 w-full object-contain" draggable={false} />
                                  <span className="pointer-events-none text-[10px] font-medium" style={{ color: kit.tinted && isDarkHex(theme.palette.background) ? "#F6EEDD" : "#40372B" }}>
                                    {ART_SLOT_LABEL[item.slot]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Illustrated backdrops for the active section */}
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[#1A1510]">Latar ilustrasi untuk {SECTION_LABELS[activeSection]}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {ART_LIBRARY.filter((k) => k.backdrop).map((kit) => (
                          <button
                            key={kit.key}
                            type="button"
                            onClick={() => {
                              updateSectionStyle(activeSection, { backgroundImage: kit.backdrop, overlayOpacity: 0.12 });
                              toast.success(`Latar ${kit.label} dipasang di ${SECTION_LABELS[activeSection]}`);
                            }}
                            className="overflow-hidden rounded-xl border border-[#EDE3CF] transition hover:border-[#8A6424]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={kit.backdrop} alt={`Latar ${kit.label}`} className="h-16 w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {ornamentSourceTab === "upload" && (
                  <div className="space-y-5">
                    {/* Primary: Canva-style upload dropzone + reusable gallery */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[#1A1510]">Unggah Stiker, Ilustrasi PNG, atau Foto</p>
                          <p className="text-[11px] text-[#6B5F50]">
                            File yang diunggah otomatis tersimpan di galeri di bawah dan langsung dipasang ke <strong>{SECTION_LABELS[activeSection]}</strong>.
                          </p>
                        </div>
                      </div>

                      <ImageUploadField
                        value={uploadedAssetUrl}
                        onChange={setUploadedAssetUrl}
                        onUploaded={(url) => {
                          rememberUploadedAsset(url);
                          addLayer({
                            section: activeSection,
                            kind: "image",
                            value: url,
                            x: 50,
                            y: 25,
                            size: 130,
                            rotation: 0,
                            opacity: 0.95,
                          });
                          setUploadedAssetUrl("");
                          toast.success(`Aset dipasang ke ${SECTION_LABELS[activeSection]} & disimpan ke galeri`);
                        }}
                        aspect="aspect-[16/5]"
                        fit="contain"
                        fullWidth
                        compact
                        placeholder="Klik atau seret gambar/PNG ke sini untuk langsung dipasang"
                      />

                      {uploadedAssetUrl.trim() && (
                        <Button
                          type="button"
                          variant="ink"
                          onClick={() => {
                            const url = uploadedAssetUrl.trim();
                            if (!url) return;
                            rememberUploadedAsset(url);
                            addLayer({
                              section: activeSection,
                              kind: "image",
                              value: url,
                              x: 50,
                              y: 25,
                              size: 130,
                              rotation: 0,
                              opacity: 0.95,
                            });
                            setUploadedAssetUrl("");
                            toast.success(`Aset dipasang ke ${SECTION_LABELS[activeSection]}`);
                          }}
                          className="h-9 w-full text-xs"
                        >
                          <IconPlus size={15} /> Pasang ke {SECTION_LABELS[activeSection]} &amp; Simpan di Galeri
                        </Button>
                      )}

                      {/* Reusable uploads gallery */}
                      {uploadedGallery.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6424]">
                              Galeri Unggahanmu ({uploadedGallery.length})
                            </p>
                            <span className="text-[11px] text-[#8E8268]">Klik atau seret ke layar HP</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                            {uploadedGallery.map((url) => (
                              <div
                                key={url}
                                draggable
                                onDragStart={(e) =>
                                  startPaletteDrag(e, {
                                    kind: "image",
                                    value: url,
                                    size: 130,
                                  })
                                }
                                onDragEnd={endPaletteDrag}
                                className="group relative overflow-hidden rounded-xl border border-[#E9DDC6] bg-[#FCF8F1] transition hover:border-[#8A6424] hover:shadow-sm"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    addLayer({
                                      section: activeSection,
                                      kind: "image",
                                      value: url,
                                      x: 50,
                                      y: 25,
                                      size: 130,
                                      rotation: 0,
                                      opacity: 0.95,
                                    });
                                    toast.success(`Dipasang ke ${SECTION_LABELS[activeSection]}`);
                                  }}
                                  title={`Pasang ke ${SECTION_LABELS[activeSection]}`}
                                  className="flex aspect-square w-full cursor-grab items-center justify-center p-2 active:cursor-grabbing"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt="Aset unggahan" className="max-h-full max-w-full object-contain" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeUploadedAsset(url);
                                  }}
                                  aria-label="Hapus dari galeri unggahan"
                                  title="Hapus dari galeri"
                                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-[#1A1510]/75 text-white opacity-0 transition hover:bg-[#9A3B2E] group-hover:opacity-100"
                                >
                                  <IconX size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Secondary collapsible: Global page background & corner ornament */}
                    <div className="rounded-2xl border border-[#EDE3CF] bg-[#FCF8F1]/70 p-4">
                      <button
                        type="button"
                        onClick={() => setShowGlobalAssets((v) => !v)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-[#1A1510]">Latar &amp; Hiasan Sudut untuk Semua Section</p>
                            {(theme.assets?.backgroundImage || theme.assets?.ornamentImage) && (
                              <span className="rounded-full bg-[#F5E8CA] px-2 py-0.5 text-[10px] font-semibold text-[#8A6424]">
                                {[theme.assets?.backgroundImage, theme.assets?.ornamentImage].filter(Boolean).length} aktif
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#6B5F50]">
                            Opsional — berlaku otomatis ke seluruh halaman undangan tanpa perlu diseret satu per satu.
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-[#E9DDC6] bg-white px-3 py-1 text-[11px] font-medium text-[#40372B]">
                          {showGlobalAssets ? "Sembunyikan" : "Atur"}
                        </span>
                      </button>

                      {showGlobalAssets && (
                        <div className="mt-4 grid gap-4 border-t border-[#EDE3CF] pt-4 sm:grid-cols-2">
                          <div className="space-y-1.5 rounded-xl border border-[#EDE3CF] bg-white p-3">
                            <Label className="text-xs text-[#1A1510]">Tekstur / Latar Semua Halaman</Label>
                            <p className="text-[11px] text-[#8E8268]">Tampil sebagai latar halus di belakang setiap section.</p>
                            <ImageUploadField
                              value={theme.assets?.backgroundImage ?? ""}
                              onChange={(url) =>
                                setTheme((prev) => ({
                                  ...prev,
                                  assets: { ...prev.assets, backgroundImage: url || undefined },
                                }))
                              }
                              aspect="aspect-[16/10]"
                              fit="cover"
                              fullWidth
                              compact
                              placeholder="Unggah tekstur latar"
                            />
                          </div>
                          <div className="space-y-1.5 rounded-xl border border-[#EDE3CF] bg-white p-3">
                            <Label className="text-xs text-[#1A1510]">Hiasan 4 Sudut Otomatis</Label>
                            <p className="text-[11px] text-[#8E8268]">PNG bunga/bingkai yang otomatis muncul di sudut tiap section.</p>
                            <ImageUploadField
                              value={theme.assets?.ornamentImage ?? ""}
                              onChange={(url) =>
                                setTheme((prev) => ({
                                  ...prev,
                                  assets: { ...prev.assets, ornamentImage: url || undefined },
                                }))
                              }
                              aspect="aspect-[16/10]"
                              fit="contain"
                              fullWidth
                              compact
                              placeholder="Unggah PNG hiasan sudut"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {ornamentSourceTab === "text" && (
                  <div className="space-y-3">
                    <p className="text-[11px] text-[#6B5F50]">
                      Ketik teks di bawah atau <strong>seret kartu gaya teks</strong> langsung ke pratinjau HP.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={textLayerInput}
                        onChange={(e) => setTextLayerInput(e.target.value)}
                        placeholder="Mis. Save the Date / Walimatul Ursy"
                        className="h-11 flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (!textLayerInput.trim()) return;
                          addLayer({
                            section: activeSection,
                            kind: "text",
                            value: textLayerInput.trim(),
                            x: 50,
                            y: 16,
                            size: 72,
                            rotation: 0,
                            opacity: 0.95,
                            font: theme.typography.display,
                          });
                        }}
                        className="h-11 rounded-xl bg-[#1A1510] px-5 text-xs text-[#FCF8F1]"
                      >
                        <IconPlus size={15} className="mr-1.5" /> Tambah Teks ke Kanvas
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {(
                        [
                          {
                            label: "Judul Elegan",
                            value: textLayerInput.trim() || "The Wedding",
                            size: 88,
                            font: theme.typography.display,
                            italic: true,
                          },
                          {
                            label: "Kaligrafi Nama",
                            value: textLayerInput.trim() || "Rama & Sinta",
                            size: 112,
                            font: "Great Vibes" as CanvasLayer["font"],
                          },
                          {
                            label: "Label Kapital",
                            value: textLayerInput.trim() || "SAVE THE DATE",
                            size: 46,
                            font: "Plus Jakarta Sans" as CanvasLayer["font"],
                            fontWeight: "bold" as const,
                            uppercase: true,
                          },
                        ]
                      ).map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          draggable
                          onDragStart={(e) =>
                            startPaletteDrag(e, {
                              kind: "text",
                              value: chip.value,
                              size: chip.size,
                              font: chip.font,
                              italic: chip.italic,
                              fontWeight: chip.fontWeight,
                              uppercase: chip.uppercase,
                            })
                          }
                          onDragEnd={endPaletteDrag}
                          onClick={() =>
                            addLayer({
                              section: activeSection,
                              kind: "text",
                              value: chip.value,
                              x: 50,
                              y: 22,
                              size: chip.size,
                              rotation: 0,
                              opacity: 0.95,
                              font: chip.font,
                              italic: chip.italic,
                              fontWeight: chip.fontWeight,
                              uppercase: chip.uppercase,
                            })
                          }
                          className="flex cursor-grab flex-col items-start rounded-xl border border-[#E6D5B2] bg-[#FCF8F1] px-3 py-2.5 text-left transition hover:border-[#8A6424] hover:bg-[#FCF5E6] active:cursor-grabbing"
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6424]">{chip.label}</span>
                          <span className="mt-0.5 truncate text-xs text-[#1A1510]">{chip.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Section Layers & Selected Layer Inspector */}
                {sectionLayers.length > 0 && (
                  <div className="space-y-3 border-t border-[#F3EBDB] pt-4">
                    <p className="text-xs font-semibold text-[#1A1510]">Layer di {SECTION_LABELS[activeSection]} ({sectionLayers.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {sectionLayers.map((l, idx) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedLayerId(l.id)}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs ${
                            selectedLayerId === l.id
                              ? "border-[#1A1510] bg-[#1A1510] text-[#FCF8F1]"
                              : "border-[#E9DDC6] bg-[#FCF8F1] text-[#40372B]"
                          }`}
                        >
                          <span>
                            #{idx + 1} {l.kind === "text" ? `"${l.value.slice(0, 12)}"` : l.kind === "preset" ? l.value : "Gambar"}
                          </span>
                        </button>
                      ))}
                    </div>

                    {selectedLayer && (
                      <div className="min-w-0 space-y-3 overflow-hidden rounded-xl border border-[#E6D5B2] bg-[#FAF6EC] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#5C431A]">Atur Layer Terpilih (seret posisi &amp; sudut kanan bawah untuk ukuran)</span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleLayerDepth(selectedLayer.id)}
                              title="Taruh di belakang teks (background) atau di depan teks"
                              className={`flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-medium ${
                                (selectedLayer.zIndex ?? 12) <= 5
                                  ? "border-[#8A6424] bg-[#FCF5E6] text-[#8A6424]"
                                  : "border-[#E9DDC6] bg-white text-[#40372B]"
                              }`}
                            >
                              <IconLayersSubtract size={14} />
                              {(selectedLayer.zIndex ?? 12) <= 5 ? "Di Belakang Teks" : "Taruh Belakang"}
                            </button>
                            <button
                              type="button"
                              onClick={() => shiftLayerZ(selectedLayer.id, 1)}
                              title="Majukan layer ke depan"
                              className="flex h-8 items-center gap-1 rounded-lg border border-[#E9DDC6] bg-white px-2 text-xs"
                            >
                              <IconStackForward size={14} /> Maju
                            </button>
                            <button
                              type="button"
                              onClick={() => shiftLayerZ(selectedLayer.id, -1)}
                              title="Mundurkan layer ke belakang"
                              className="flex h-8 items-center gap-1 rounded-lg border border-[#E9DDC6] bg-white px-2 text-xs"
                            >
                              <IconStackBackward size={14} /> Mundur
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLayer(selectedLayer.id, { flipX: !selectedLayer.flipX })}
                              title="Balik horizontal (kiri ↔ kanan)"
                              aria-pressed={Boolean(selectedLayer.flipX)}
                              className={`flex h-8 items-center gap-1 rounded-lg border px-2 text-xs ${selectedLayer.flipX ? "border-[#8A6424] bg-[#FCF5E6] text-[#8A6424]" : "border-[#E9DDC6] bg-white"}`}
                            >
                              <IconFlipVertical size={14} /> Balik ↔
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLayer(selectedLayer.id, { flipY: !selectedLayer.flipY })}
                              title="Balik vertikal (atas ↕ bawah)"
                              aria-pressed={Boolean(selectedLayer.flipY)}
                              className={`flex h-8 items-center gap-1 rounded-lg border px-2 text-xs ${selectedLayer.flipY ? "border-[#8A6424] bg-[#FCF5E6] text-[#8A6424]" : "border-[#E9DDC6] bg-white"}`}
                            >
                              <IconFlipHorizontal size={14} /> Balik ↕
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const { id: _ignored, ...rest } = selectedLayer;
                                void _ignored;
                                addLayer({ ...rest, x: Math.min(92, rest.x + 8), y: Math.min(92, rest.y + 8) });
                              }}
                              title="Duplikat layer"
                              className="flex h-8 items-center gap-1 rounded-lg border border-[#E9DDC6] bg-white px-2 text-xs"
                            >
                              <IconCopy size={14} /> Duplikat
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLayer(selectedLayer.id)}
                              title="Hapus layer"
                              className="flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-white px-2 text-xs text-red-600"
                            >
                              <IconTrash size={14} /> Hapus
                            </button>
                          </div>
                        </div>

                        {selectedLayer.kind === "preset" && getPresetOrnament(selectedLayer.value)?.photoMask && (
                          <div className="rounded-xl border border-[#EDE3CF] bg-white p-3">
                            <label className="block space-y-1 text-xs">
                              <span className="block font-medium text-[#40372B]">Foto di Dalam Bingkai (otomatis terisi data undangan pembeli)</span>
                              <SelectField size="sm"
                                value={selectedLayer.frameSlot ?? ""}
                                onChange={(e) =>
                                  updateLayer(selectedLayer.id, {
                                    frameSlot: e.target.value ? (e.target.value as CanvasLayer["frameSlot"]) : undefined,
                                  })
                                }
                                className="w-full"
                              >
                                <option value="">Placeholder Pemandangan (Kanvas)</option>
                                <option value="cover">Foto Sampul Utama</option>
                                <option value="bride">Foto Mempelai Wanita</option>
                                <option value="groom">Foto Mempelai Pria</option>
                                <option value="gallery0">Foto Galeri #1</option>
                                <option value="gallery1">Foto Galeri #2</option>
                              </SelectField>
                            </label>
                          </div>
                        )}

                        {selectedLayer.kind === "text" && (
                          <div className="min-w-0 space-y-3 overflow-hidden rounded-xl border border-[#EDE3CF] bg-white p-3">
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              <label className="block min-w-0 space-y-1 text-xs">
                                <span className="block font-medium text-[#40372B]">Isi Teks</span>
                                <Input
                                  value={selectedLayer.value}
                                  onChange={(e) => updateLayer(selectedLayer.id, { value: e.target.value })}
                                  className="h-9 w-full min-w-0 text-xs"
                                />
                              </label>
                              <label className="block min-w-0 space-y-1 text-xs">
                                <span className="block font-medium text-[#40372B]">Font Layer Teks</span>
                                <SelectField size="sm"
                                  value={selectedLayer.font || theme.typography.display}
                                  onChange={(e) =>
                                    updateLayer(selectedLayer.id, { font: e.target.value as CanvasLayer["font"] })
                                  }
                                  className="w-full min-w-0"
                                >
                                  {ALL_LAYER_FONTS.map((f) => (
                                    <option key={f} value={f}>
                                      {f}
                                    </option>
                                  ))}
                                </SelectField>
                              </label>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateLayer(selectedLayer.id, {
                                    fontWeight: selectedLayer.fontWeight === "bold" ? "medium" : "bold",
                                  })
                                }
                                className={`flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs ${
                                  selectedLayer.fontWeight === "bold"
                                    ? "border-[#1A1510] bg-[#1A1510] text-white"
                                    : "border-[#E9DDC6] bg-[#FCF8F1] text-[#40372B]"
                                }`}
                              >
                                <IconBold size={13} /> Tebal
                              </button>
                              <button
                                type="button"
                                onClick={() => updateLayer(selectedLayer.id, { italic: !selectedLayer.italic })}
                                className={`flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs ${
                                  selectedLayer.italic
                                    ? "border-[#1A1510] bg-[#1A1510] text-white"
                                    : "border-[#E9DDC6] bg-[#FCF8F1] text-[#40372B]"
                                }`}
                              >
                                <IconItalic size={13} /> Miring
                              </button>
                              <button
                                type="button"
                                onClick={() => updateLayer(selectedLayer.id, { uppercase: !selectedLayer.uppercase })}
                                className={`flex h-8 items-center rounded-lg border px-2.5 text-xs font-medium ${
                                  selectedLayer.uppercase
                                    ? "border-[#1A1510] bg-[#1A1510] text-white"
                                    : "border-[#E9DDC6] bg-[#FCF8F1] text-[#40372B]"
                                }`}
                              >
                                AA Kapital
                              </button>
                              <div className="flex items-center overflow-hidden rounded-lg border border-[#E9DDC6]">
                                {(
                                  [
                                    ["left", IconAlignLeft],
                                    ["center", IconAlignCenter],
                                    ["right", IconAlignRight],
                                  ] as const
                                ).map(([al, Icon]) => (
                                  <button
                                    key={al}
                                    type="button"
                                    onClick={() => updateLayer(selectedLayer.id, { textAlign: al })}
                                    className={`flex h-8 w-8 items-center justify-center ${
                                      (selectedLayer.textAlign ?? "center") === al
                                        ? "bg-[#1A1510] text-white"
                                        : "bg-[#FCF8F1] text-[#40372B]"
                                    }`}
                                  >
                                    <Icon size={14} />
                                  </button>
                                ))}
                              </div>
                              <label className="ml-auto flex items-center gap-1.5 text-[11px] text-[#40372B]">
                                <span>Latar Badge:</span>
                                <input
                                  type="color"
                                  value={selectedLayer.bgColor || "#FCF8F1"}
                                  onChange={(e) => updateLayer(selectedLayer.id, { bgColor: e.target.value, borderRadius: selectedLayer.borderRadius ?? 14 })}
                                  className="h-7 w-8 cursor-pointer rounded border border-[#E9DDC6] bg-white p-0.5"
                                />
                                {selectedLayer.bgColor && (
                                  <button
                                    type="button"
                                    onClick={() => updateLayer(selectedLayer.id, { bgColor: undefined })}
                                    className="text-[11px] text-[#8A6424] underline"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </label>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block space-y-1 text-xs">
                            <span className="flex justify-between">
                              <span>{selectedLayer.kind === "text" ? "Ukuran Teks" : "Lebar"}</span>
                              <span>{selectedLayer.size}px</span>
                            </span>
                            <input
                              type="range"
                              min={24}
                              max={360}
                              value={selectedLayer.size}
                              onChange={(e) => updateLayer(selectedLayer.id, { size: Number(e.target.value) })}
                              className="w-full accent-[#8A6424]"
                            />
                          </label>
                          {selectedLayer.kind !== "text" ? (
                            <label className="block space-y-1 text-xs">
                              <span className="flex justify-between">
                                <span>Rasio Tinggi</span>
                                <span>{Math.round((selectedLayer.heightRatio ?? 1) * 100)}%</span>
                              </span>
                              <input
                                type="range"
                                min={25}
                                max={260}
                                value={Math.round((selectedLayer.heightRatio ?? 1) * 100)}
                                onChange={(e) => updateLayer(selectedLayer.id, { heightRatio: Number(e.target.value) / 100 })}
                                className="w-full accent-[#8A6424]"
                              />
                            </label>
                          ) : (
                            <label className="block space-y-1 text-xs">
                              <span className="flex justify-between">
                                <span>Spasi Huruf</span>
                                <span>{(selectedLayer.letterSpacing ?? 0).toFixed(2)}em</span>
                              </span>
                              <input
                                type="range"
                                min={-4}
                                max={35}
                                value={Math.round((selectedLayer.letterSpacing ?? 0) * 100)}
                                onChange={(e) => updateLayer(selectedLayer.id, { letterSpacing: Number(e.target.value) / 100 })}
                                className="w-full accent-[#8A6424]"
                              />
                            </label>
                          )}
                          <label className="block space-y-1 text-xs">
                            <span className="flex justify-between">
                              <span>Rotasi</span>
                              <span>{selectedLayer.rotation}°</span>
                            </span>
                            <input
                              type="range"
                              min={-180}
                              max={180}
                              value={selectedLayer.rotation}
                              onChange={(e) => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })}
                              className="w-full accent-[#8A6424]"
                            />
                          </label>
                          <label className="block space-y-1 text-xs">
                            <span className="flex justify-between">
                              <span>Opasitas</span>
                              <span>{Math.round(selectedLayer.opacity * 100)}%</span>
                            </span>
                            <input
                              type="range"
                              min={10}
                              max={100}
                              value={Math.round(selectedLayer.opacity * 100)}
                              onChange={(e) => updateLayer(selectedLayer.id, { opacity: Number(e.target.value) / 100 })}
                              className="w-full accent-[#8A6424]"
                            />
                          </label>
                          <label className="block space-y-1 text-xs">
                            <span className="block">Warna Layer</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedLayer.color || theme.palette.accent}
                                onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                                className="h-8 w-10 cursor-pointer rounded border border-[#E9DDC6] bg-white p-0.5"
                              />
                              <button
                                type="button"
                                onClick={() => updateLayer(selectedLayer.id, { color: undefined })}
                                className="text-[11px] text-[#8A6424] underline"
                              >
                                Ikuti aksen
                              </button>
                            </div>
                          </label>
                          <label className="block space-y-1 text-xs sm:col-span-2">
                            <span className="block">Animasi Layer</span>
                            <SelectField size="sm"
                              value={selectedLayer.animation ?? "none"}
                              onChange={(e) =>
                                updateLayer(selectedLayer.id, {
                                  animation: e.target.value === "none" ? undefined : (e.target.value as LayerAnimation),
                                })
                              }
                              className="w-full"
                            >
                              {LAYER_ANIMATIONS.map((anim) => (
                                <option key={anim} value={anim}>
                                  {ANIMATION_LABELS[anim]}
                                </option>
                              ))}
                            </SelectField>
                          </label>
                          {selectedLayer.animation && selectedLayer.animation !== "none" && (
                            <label className="block space-y-1 text-xs">
                              <span className="flex justify-between">
                                <span>Kecepatan Animasi</span>
                                <span>{selectedLayer.animationDuration ?? 4}d</span>
                              </span>
                              <input
                                type="range"
                                min={1}
                                max={12}
                                step={0.5}
                                value={selectedLayer.animationDuration ?? 4}
                                onChange={(e) => updateLayer(selectedLayer.id, { animationDuration: Number(e.target.value) })}
                                className="w-full accent-[#8A6424]"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Colors, Texture & Style */}
            {toolTab === "colors" && (
              <div className="space-y-5 rounded-2xl border border-[#EDE3CF] bg-white p-5">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Palet Warna &amp; Gaya Visual</h2>
                  <p className="text-xs text-[#6B5F50]">Sesuaikan setiap warna atau pilih gaya bingkai dan tekstur kertas.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["background", "Latar Utama"],
                      ["surface", "Permukaan Kartu"],
                      ["ink", "Teks Utama"],
                      ["muted", "Teks Sekunder"],
                      ["accent", "Aksen / Tombol"],
                      ["accentSoft", "Aksen Lembut"],
                      ["onAccent", "Teks Tombol"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2.5 rounded-xl border border-[#F3EBDB] bg-[#FCF8F1] p-2.5 text-xs">
                      <input
                        type="color"
                        value={theme.palette[key]}
                        onChange={(e) =>
                          setTheme((prev) => ({
                            ...prev,
                            palette: { ...prev.palette, [key]: e.target.value },
                          }))
                        }
                        className="h-8 w-8 shrink-0 cursor-pointer rounded border border-[#E9DDC6] bg-white p-0.5"
                      />
                      <span className="min-w-0 truncate font-medium text-[#40372B]">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid gap-4 border-t border-[#F3EBDB] pt-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ornamen Sudut &amp; Pemisah Bawaan</Label>
                    <SelectField
                      value={theme.ornament}
                      onChange={(e) => setTheme((prev) => ({ ...prev, ornament: e.target.value as AiTheme["ornament"] }))}
                      className="w-full"
                    >
                      {ORNAMENTS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tekstur Kertas</Label>
                    <SelectField
                      value={theme.texture}
                      onChange={(e) => setTheme((prev) => ({ ...prev, texture: e.target.value as AiTheme["texture"] }))}
                      className="w-full"
                    >
                      {TEXTURES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bentuk Sudut &amp; Foto</Label>
                    <SelectField
                      value={theme.corners}
                      onChange={(e) => setTheme((prev) => ({ ...prev, corners: e.target.value as AiTheme["corners"] }))}
                      className="w-full"
                    >
                      <option value="arch">Arch (Lengkung)</option>
                      <option value="soft">Soft (Memudar)</option>
                      <option value="sharp">Sharp (Tegas)</option>
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Garis Bingkai Kartu</Label>
                    <SelectField
                      value={theme.frame}
                      onChange={(e) => setTheme((prev) => ({ ...prev, frame: e.target.value as AiTheme["frame"] }))}
                      className="w-full"
                    >
                      <option value="hairline">Hairline</option>
                      <option value="double">Double</option>
                      <option value="dotted">Dotted</option>
                      <option value="none">Tanpa Bingkai</option>
                    </SelectField>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#40372B]">
                  <input
                    type="checkbox"
                    checked={theme.metallic}
                    onChange={(e) => setTheme((prev) => ({ ...prev, metallic: e.target.checked }))}
                    className="h-4 w-4 accent-[#8A6424]"
                  />
                  <span>Efek Foil Metalik pada nama mempelai &amp; ornamen aksen</span>
                </label>
              </div>
            )}

            {/* TAB 3: Typography & Copy */}
            {toolTab === "type" && (
              <div className="space-y-5 rounded-2xl border border-[#EDE3CF] bg-white p-5">
                <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Tipografi &amp; Kata Pengantar</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Judul</Label>
                    <SelectField
                      value={theme.typography.display}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, typography: { ...prev.typography, display: e.target.value as AiTheme["typography"]["display"] } }))
                      }
                      className="w-full"
                    >
                      {DISPLAY_FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Nama Mempelai</Label>
                    <SelectField
                      value={theme.typography.names}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, typography: { ...prev.typography, names: e.target.value as AiTheme["typography"]["names"] } }))
                      }
                      className="w-full"
                    >
                      {[...SCRIPT_FONTS, ...DISPLAY_FONTS].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Font Teks Isi</Label>
                    <SelectField
                      value={theme.typography.body}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, typography: { ...prev.typography, body: e.target.value as AiTheme["typography"]["body"] } }))
                      }
                      className="w-full"
                    >
                      {BODY_FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[#F3EBDB] pt-4 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#40372B]">
                    <input
                      type="checkbox"
                      checked={theme.typography.displayItalic}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          typography: { ...prev.typography, displayItalic: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 accent-[#8A6424]"
                    />
                    <span>Judul Miring (Italic)</span>
                  </label>
                  <div className="space-y-1">
                    <Label className="text-xs">Gaya Label Kecil (The Wedding of)</Label>
                    <SelectField size="sm"
                      value={theme.typography.labelStyle}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            labelStyle: e.target.value as AiTheme["typography"]["labelStyle"],
                          },
                        }))
                      }
                      className="w-full"
                    >
                      <option value="uppercase-tracked">KAPITAL BERJARAK</option>
                      <option value="small-caps">Small Caps Elegan</option>
                      <option value="plain">Normal Bersih</option>
                    </SelectField>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="block text-xs">Label Sampul</span>
                    <Input
                      value={theme.copy.coverEyebrow}
                      onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, coverEyebrow: e.target.value } }))}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="block text-xs">Tombol Sampul</span>
                    <Input
                      value={theme.copy.openButton}
                      onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, openButton: e.target.value } }))}
                    />
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="block text-xs">Salam Pembuka</span>
                  <Input
                    value={theme.copy.greeting}
                    onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, greeting: e.target.value } }))}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="block text-xs">Teks Pembuka</span>
                  <Textarea
                    value={theme.copy.opening}
                    onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, opening: e.target.value } }))}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="block text-xs">Teks Penutup</span>
                  <Textarea
                    value={theme.copy.closing}
                    onChange={(e) => setTheme((prev) => ({ ...prev, copy: { ...prev.copy, closing: e.target.value } }))}
                  />
                </label>
              </div>
            )}

            {/* TAB 4: Layout Variants & Standardized 11-Section Structure */}
            {toolTab === "layout" && (
              <div className="space-y-5 rounded-2xl border border-[#EDE3CF] bg-white p-5">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Variasi Layout &amp; Struktur Baku</h2>
                  <p className="text-xs text-[#6B5F50]">
                    Tampilan tiap section bebas dikustomisasi, sementara struktur 11 section utama bersifat baku (tanpa penambahan/pengurangan).
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Layout Sampul</Label>
                    <SelectField
                      value={theme.layout.cover}
                      onChange={(e) => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, cover: e.target.value as AiTheme["layout"]["cover"] } }))}
                      className="w-full"
                    >
                      {COVER_LAYOUTS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Layout Mempelai</Label>
                    <SelectField
                      value={theme.layout.couple}
                      onChange={(e) => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, couple: e.target.value as AiTheme["layout"]["couple"] } }))}
                      className="w-full"
                    >
                      {COUPLE_LAYOUTS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Layout Acara</Label>
                    <SelectField
                      value={theme.layout.events}
                      onChange={(e) => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, events: e.target.value as AiTheme["layout"]["events"] } }))}
                      className="w-full"
                    >
                      {EVENT_LAYOUTS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Layout Galeri</Label>
                    <SelectField
                      value={theme.layout.gallery}
                      onChange={(e) => setTheme((prev) => ({ ...prev, layout: { ...prev.layout, gallery: e.target.value as AiTheme["layout"]["gallery"] } }))}
                      className="w-full"
                    >
                      {GALLERY_LAYOUTS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#F3EBDB] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8A6424]">Struktur Baku 11 Section</p>
                    <span className="rounded-full bg-[#F7F0E1] px-2.5 py-0.5 text-[10px] font-semibold text-[#8A6424]">
                      Standar Lengkap • Tetap
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {CANVAS_SECTION_IDS.map((sec, idx) => {
                      const isSel = activeSection === sec;
                      return (
                        <li key={sec}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection(sec);
                              setSelectedLayerId(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                              isSel
                                ? "border-[#8A6424] bg-[#FCF5E6] font-semibold text-[#1A1510]"
                                : "border-[#F3EBDB] bg-[#FCF8F1]/70 font-medium text-[#40372B] hover:border-[#E6D5B2]"
                            }`}
                          >
                            <span>
                              {idx + 1}. {SECTION_LABELS[sec]}
                            </span>
                            <span className="text-[10px] text-[#8A6424]">{isSel ? "Aktif" : "Atur gaya"}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            {/* Daftar Desain & Draf Saya (bisa buat banyak template sekaligus) */}
            <section className="space-y-4 rounded-2xl border border-[#EDE3CF] bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#1A1510]">Daftar Desain Saya ({designs.length})</h3>
                  <p className="text-xs text-[#6B5F50]">Buat dan kelola beberapa konsep template sebelum dijual atau dipakai.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadBlankCanvas}
                  className="h-9 rounded-full border-[#E9DDC6] bg-[#FCF8F1] px-3.5 text-xs font-medium text-[#1A1510]"
                >
                  <IconPlus size={14} className="mr-1" /> Buat Desain Baru
                </Button>
              </div>

              {designs.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#E9DDC6] bg-[#FCF8F1]/60 px-4 py-6 text-center text-xs text-[#6B5F50]">
                  Belum ada draf desain tersimpan. Klik <strong>Simpan Draf</strong> di atas untuk menyimpan karya pertamamu ke daftar ini.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {designs.map((d) => {
                    const isEditing = designId === d.id;
                    const layerCount = d.theme.layers?.length ?? 0;
                    return (
                      <article
                        key={d.id}
                        className={`flex flex-col justify-between gap-2.5 rounded-xl border p-2.5 transition ${
                          isEditing
                            ? "border-[#8A6424] bg-[#FCF5E6] ring-1 ring-[#D9B56A]/40"
                            : "border-[#F3EBDB] bg-[#FCF8F1]/50 hover:border-[#E6D5B2]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="relative w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white">
                            <CoverThumb theme={d.theme} zoom={0.28} className="aspect-[9/16] w-full" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate font-serif text-base font-medium leading-tight text-[#1A1510]">
                              {d.theme.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="rounded-full bg-[#F5EDDD] px-2 py-0.5 font-medium text-[#5C431A]">
                                {d.source === "CANVAS" ? "Kanvas" : d.source === "AI" ? "AI" : "Katalog"}
                              </span>
                              {layerCount > 0 && (
                                <span className="text-[#6B5F50]">{layerCount} layer</span>
                              )}
                              {isEditing && (
                                <span className="rounded-full bg-[#1A1510] px-2 py-0.5 font-medium text-[#FCF8F1]">
                                  Diedit
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 border-t border-[#F3EBDB] pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTheme(d.theme);
                              setDesignId(d.source === "CANVAS" ? d.id : null);
                              setSelectedLayerId(null);
                              toast.success(`"${d.theme.name}" dibuka di kanvas`);
                            }}
                            className="flex h-7 flex-1 items-center justify-center rounded-lg bg-[#1A1510] px-2 text-[11px] font-medium text-[#FCF8F1] hover:bg-[#2B241B]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void duplicateSavedDesign(d)}
                            title="Duplikat desain ini"
                            className="flex h-7 items-center justify-center rounded-lg border border-[#E9DDC6] bg-white px-2 text-[11px] text-[#40372B] hover:bg-[#FCF8F1] disabled:opacity-45"
                          >
                            Duplikat
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const origin = d.source === "CATALOG" ? d.theme.name : null;
                              setTheme(d.theme);
                              setDesignId(d.source === "CANVAS" ? d.id : null);
                              setTemplateOrigin(origin);
                              openSell(d.theme, origin);
                            }}
                            title="Jual template ini"
                            className="flex h-7 items-center justify-center rounded-lg bg-[#8A6424] px-2 text-[11px] font-medium text-white hover:bg-[#755925]"
                          >
                            Jual
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteDesignTarget(d)}
                            aria-label={`Hapus ${d.theme.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B5F50] hover:bg-red-50 hover:text-red-600"
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Submitted Marketplace Templates */}
            {myTemplates.length > 0 && (
              <section className="space-y-3 rounded-2xl border border-[#EDE3CF] bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif text-xl font-medium text-[#1A1510]">Template Saya di Marketplace</h3>
                  <Link href="/dompet" className="text-xs font-medium text-[#8A6424] hover:underline">
                    Lihat penghasilan di Dompet →
                  </Link>
                </div>
                <div className="divide-y divide-[#F3EBDB]">
                  {myTemplates.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-medium text-[#1A1510]">
                          {t.name} <span className="text-xs font-normal text-[#6B5F50]">· {t.category}</span>
                        </p>
                        <p className="text-xs text-[#6B5F50]">
                          Harga {rupiah(t.price)} · Komisi platform {t.platformFeePct}% · Dipakai {t.usageCount}×
                        </p>
                        {t.reviewNote && t.reviewStatus === "REJECTED" && <p className="text-xs text-red-600">Catatan: {t.reviewNote}</p>}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          t.reviewStatus === "APPROVED" && t.isActive
                            ? "border border-[#E6D5B2] bg-[#F7F0E1] text-[#5C431A]"
                            : t.reviewStatus === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {t.reviewStatus === "APPROVED" && t.isActive ? "Tayang" : t.reviewStatus === "REJECTED" ? "Perlu Revisi" : "Menunggu Review"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
              </div>
            </div>
          </div>

          {/* RIGHT: Clean Flat Artboard Canvas (Canva/WordPress style) + Android / PC Preview */}
          <aside className="min-w-0 xl:sticky xl:top-20">
            <div className="mx-auto w-full max-w-[360px]">
              {/* Top artboard controls: Android vs PC preview + lock/duplicate/delete */}
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-0.5">
                <div className="inline-flex items-center rounded-full border border-[#E6D5B2] bg-white p-0.5 text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1510] px-2.5 py-1 text-[#FCF8F1]">
                    <IconDeviceMobile size={12} /> Android
                  </span>
                  <button
                    type="button"
                    onClick={() => setPcPreviewOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[#5E5446] transition hover:text-[#1A1510]"
                  >
                    <IconDeviceDesktop size={12} /> Preview PC
                  </button>
                </div>

                {selectedLayer ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateLayer(selectedLayer.id, { locked: !selectedLayer.locked })}
                      title={selectedLayer.locked ? "Buka kunci layer" : "Kunci layer"}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-white text-[#1A1510] ${
                        selectedLayer.locked ? "border-[#8A6424] bg-[#FCF5E6] text-[#8A6424]" : "border-[#EDE3CF]"
                      }`}
                    >
                      {selectedLayer.locked ? <IconLock size={13} /> : <IconLockOpen size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const { id: _i, ...rest } = selectedLayer;
                        void _i;
                        addLayer({ ...rest, locked: false, x: Math.min(92, rest.x + 6), y: Math.min(92, rest.y + 6) });
                      }}
                      title="Duplikat layer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EDE3CF] bg-white text-[#1A1510]"
                    >
                      <IconCopy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLayer(selectedLayer.id)}
                      title="Hapus layer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600"
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full border border-[#E6D5B2] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#5C431A]">
                    {SECTION_LABELS[activeSection]}
                  </span>
                )}
              </div>

              {/* Clean flat paper Canva-style artboard (no thick phone bezel) */}
              <div className="relative overflow-hidden rounded-lg border-2 border-[#D9B56A]/70 bg-white shadow-sm">
                <div className="h-[720px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                  <AiDesignTemplate
                    data={previewData}
                    theme={theme}
                    embedded
                    forceOpened
                    canvasEditor={{
                      activeSection,
                      selectedLayerId,
                      draggingPalette,
                      onSelectSection: (sec) => setActiveSection(sec),
                      onSelectLayer: (id) => setSelectedLayerId(id),
                      onMoveLayer: (id, x, y) => updateLayer(id, { x, y }),
                      onResizeLayer: (id, size) => updateLayer(id, { size }),
                      onRotateLayer: (id, rotation) => updateLayer(id, { rotation }),
                      onFlipLayer: (id, axis) => {
                        const target = layers.find((l) => l.id === id);
                        if (target) updateLayer(id, axis === "x" ? { flipX: !target.flipX } : { flipY: !target.flipY });
                      },
                      onLockLayer: (id) => {
                        const target = layers.find((l) => l.id === id);
                        if (target) updateLayer(id, { locked: !target.locked });
                      },
                      onDuplicateLayer: (id) => {
                        const target = layers.find((l) => l.id === id);
                        if (target) {
                          const { id: _i, ...rest } = target;
                          void _i;
                          addLayer({ ...rest, locked: false, x: Math.min(92, rest.x + 6), y: Math.min(92, rest.y + 6) });
                        }
                      },
                      onDeleteLayer: (id) => removeLayer(id),
                      onShiftLayerForward: (id) => shiftLayerZ(id, 1),
                      onToggleLayerDepth: (id) => toggleLayerDepth(id),
                      onQuickInsert: (sec) => {
                        setActiveSection(sec);
                        setToolTab("ornaments");
                        setOrnamentSourceTab("library");
                        toast(`Pilih atau seret elemen untuk menghias ${SECTION_LABELS[sec]}`);
                      },
                      onDropPaletteItem: (sec, payload, x, y) => {
                        addLayer({
                          section: sec,
                          kind: payload.kind,
                          value: payload.value,
                          x,
                          y,
                          size: payload.size,
                          ...(payload.heightRatio ? { heightRatio: payload.heightRatio } : {}),
                          ...(payload.color ? { color: payload.color } : {}),
                          rotation: 0,
                          opacity: payload.kind === "text" || payload.value.startsWith("frame-photo-") ? 1 : 0.88,
                          font: payload.font,
                          fontWeight: payload.fontWeight,
                          italic: payload.italic,
                          uppercase: payload.uppercase,
                        });
                        setDraggingPalette(null);
                        toast.success(`Elemen ditambahkan ke ${SECTION_LABELS[sec]}`);
                      },
                    }}
                  />
                </div>
              </div>
              <p className="mt-2.5 text-center text-xs text-[#6B5F50]">
                Klik section untuk ubah layoutnya, seret elemen dari kiri ke kanvas, atau klik <strong>Preview PC</strong>.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Sell on Marketplace Dialog with pre-sell AI plagiarism check */}
      <MarketplaceSellDialog
        open={sellTheme !== null}
        onOpenChange={(open) => !open && setSellTheme(null)}
        theme={sellTheme}
        initialName={sellTheme?.name ?? ""}
        initialDescription={sellTheme?.mood ?? ""}
        previewData={previewData}
        onSubmitted={(created) => {
          setMyTemplates((prev) => [created, ...prev]);
          router.refresh();
        }}
      />

      <AlertDialog open={deleteDesignTarget !== null} onOpenChange={(open) => !open && !deletingDesign && setDeleteDesignTarget(null)}>
        <AlertDialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
              Hapus desain &ldquo;{deleteDesignTarget?.theme.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5E5446]">
              Draf desain ini akan dihapus dari daftar Anda. Template yang sudah terbit di Marketplace tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deletingDesign} className="rounded-full border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingDesign}
              onClick={(e) => {
                e.preventDefault();
                if (deleteDesignTarget) void deleteSavedDesign(deleteDesignTarget);
              }}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {deletingDesign ? "Menghapus..." : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Live Desktop (PC) Preview Modal */}
      <Dialog open={pcPreviewOpen} onOpenChange={setPcPreviewOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex! top-0! left-0! h-dvh! max-h-none! w-screen! max-w-none! translate-x-0! translate-y-0! flex-col gap-0 overflow-hidden rounded-none! border-0 bg-[#1A1510] p-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 text-[#F6EEDD] sm:px-6">
            <DialogTitle className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <IconDeviceDesktop size={18} className="shrink-0 text-[#D9B56A]" />
              <span className="truncate">Pratinjau Layar PC / Desktop — {theme.name}</span>
              <span className="hidden rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-[#CDBF9F] sm:inline">
                Tampilan split desktop asli
              </span>
            </DialogTitle>
            <DialogClose asChild>
              <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-medium hover:bg-white/20">
                <IconX size={15} /> Tutup
              </button>
            </DialogClose>
          </div>
          <div
            className={`min-h-0 flex-1 overscroll-contain bg-[#FCF8F1] ${theme.customHtml?.trim() ? "overflow-hidden" : "overflow-y-auto"}`}
            style={{ ["--uy-stage-h" as string]: "calc(100dvh - 53px)" }}
          >
            <AiDesignTemplate data={previewData} theme={theme} forceOpened sampleMode />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
