"use client";

import { useRef, useState, type ReactNode } from "react";
import { IconCalendarEvent, IconGift, IconHeart, IconMessageCircle, IconPhoto } from "@tabler/icons-react";
import type { WeddingData } from "@/types/wedding";
import { DEFAULT_AI_THEME, REORDERABLE_SECTIONS, type AiTheme, type ReorderableSectionId } from "@/lib/ai-design/schema";
import { MusicToggle } from "@/components/common/music-toggle";
import { fontHref, themeFonts, themeStyle } from "./theme";
import { CanvasSectionFrame, EdgeSprigs, type CanvasEditorBridge } from "./ornaments";
import { SandboxedHtmlFrame } from "./sandboxed-html-frame";
import { Closing, Countdown, Couple, Cover, DesktopStage, Events, Gallery, Gift, Opening, Rsvp, Story, Video } from "./sections";

interface Props {
  data: WeddingData;
  /** Overrides data.aiTheme (used by the live preview). */
  theme?: AiTheme;
  /** Rendered inside a phone frame: no music, no fixed elements, RSVP disabled. */
  embedded?: boolean;
  /** Render the cover CTA as a non-interactive span (used inside CoverThumb cards wrapped by button/Link). */
  staticCover?: boolean;
  /** Opens all sections immediately (used in Canvas Studio). */
  forceOpened?: boolean;
  /** Interactive canvas bridge for dragging & selecting layers in Canvas Studio. */
  canvasEditor?: CanvasEditorBridge;
}

function BottomNav({ theme, data, scrollRoot }: { theme: AiTheme; data: WeddingData; scrollRoot: () => HTMLElement | null }) {
  const items = [
    { id: "mempelai", label: "Mempelai", icon: IconHeart },
    { id: "acara", label: "Acara", icon: IconCalendarEvent },
    ...(data.gallery?.length ? [{ id: "galeri", label: "Galeri", icon: IconPhoto }] : []),
    ...(data.gifts?.enabled && data.gifts.bankAccounts?.length ? [{ id: "hadiah", label: "Hadiah", icon: IconGift }] : []),
    { id: "ucapan", label: "Ucapan", icon: IconMessageCircle },
  ];
  const go = (id: string) => scrollRoot()?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <nav className="pointer-events-none sticky bottom-4 z-40 flex justify-center px-4" aria-label="Navigasi undangan">
      <div
        className={`pointer-events-auto flex items-center gap-1 p-1.5 shadow-lg backdrop-blur-md ${theme.corners === "sharp" ? "rounded-none" : "rounded-full"}`}
        style={{ background: "color-mix(in srgb, var(--surface) 82%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}
      >
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => go(id)} aria-label={label} className={`flex h-11 w-11 items-center justify-center transition-colors ${theme.corners === "sharp" ? "rounded-none" : "rounded-full"} hover:bg-(--accent-soft)`}>
            <Icon size={19} stroke={1.6} style={{ color: "var(--ink)" }} />
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function AiDesignTemplate({
  data,
  theme: themeProp,
  embedded = false,
  staticCover = false,
  forceOpened = false,
  canvasEditor,
}: Props) {
  const theme = themeProp ?? data.aiTheme ?? DEFAULT_AI_THEME;
  const [openedState, setOpenedState] = useState(false);
  const opened = forceOpened || openedState;
  const rootRef = useRef<HTMLDivElement>(null);
  const screen = embedded ? "min-h-[700px]" : "min-h-svh";

  if (theme.customHtml?.trim()) {
    return (
      // The iframe scrolls by itself, so it must never be taller than a fixed-height parent (preview frames,
      // dialogs): h-full + max-h-full shrink it to that box, and on a normal page they resolve to the preset height.
      <div className="relative h-full w-full overflow-hidden bg-white">
        {!embedded && data.music?.enabled && data.music.url && <MusicToggle url={data.music.url} type={data.music.type} autoPlay />}
        <SandboxedHtmlFrame
          html={theme.customHtml}
          data={data}
          title={theme.name}
          className={`${embedded ? "h-[720px]" : "h-[100svh]"} block max-h-full w-full border-0 bg-white`}
        />
      </div>
    );
  }

  const open = () => {
    setOpenedState(true);
    requestAnimationFrame(() => rootRef.current?.querySelector("#pembuka")?.scrollIntoView({ behavior: "smooth" }));
  };

  // Standard fixed 11-section wedding structure: cover -> canonical 9 sections -> closing (no additions/removals).
  const orderedSections: readonly ReorderableSectionId[] = REORDERABLE_SECTIONS;

  const renderSection = (s: ReorderableSectionId): ReactNode => {
    switch (s) {
      case "opening":
        return (
          <CanvasSectionFrame key="opening" section="opening" theme={theme} data={data} canvasEditor={canvasEditor}>
            <div id="pembuka" />
            <Opening theme={theme} data={data} />
            <EdgeSprigs theme={theme} />
          </CanvasSectionFrame>
        );
      case "couple":
        return (
          <CanvasSectionFrame key="couple" section="couple" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Couple theme={theme} data={data} />
          </CanvasSectionFrame>
        );
      case "countdown":
        return (
          <CanvasSectionFrame key="countdown" section="countdown" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Countdown theme={theme} data={data} />
          </CanvasSectionFrame>
        );
      case "events":
        return (
          <CanvasSectionFrame key="events" section="events" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Events theme={theme} data={data} />
          </CanvasSectionFrame>
        );
      case "story":
        return (
          <CanvasSectionFrame key="story" section="story" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Story theme={theme} data={data} />
          </CanvasSectionFrame>
        );
      case "gallery":
        return (
          <CanvasSectionFrame key="gallery" section="gallery" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Gallery theme={theme} data={data} />
          </CanvasSectionFrame>
        );
      case "video":
        return (
          <CanvasSectionFrame key="video" section="video" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Video theme={theme} data={data} />
          </CanvasSectionFrame>
        );
      case "gift":
        return (
          <CanvasSectionFrame key="gift" section="gift" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Gift theme={theme} data={data} />
          </CanvasSectionFrame>
        );
      case "rsvp":
        return (
          <CanvasSectionFrame key="rsvp" section="rsvp" theme={theme} data={data} canvasEditor={canvasEditor}>
            <Rsvp theme={theme} data={data} preview={embedded} />
          </CanvasSectionFrame>
        );
    }
  };

  const renderCover = () => (
    <CanvasSectionFrame section="cover" theme={theme} data={data} canvasEditor={canvasEditor}>
      <Cover theme={theme} data={data} opened={opened} onOpen={open} screen={screen} embedded={embedded} staticCover={staticCover} />
    </CanvasSectionFrame>
  );

  const renderMainBody = () => (
    <main className="animate-in fade-in duration-700">
      {orderedSections.map(renderSection)}
      <CanvasSectionFrame section="closing" theme={theme} data={data} canvasEditor={canvasEditor}>
        <Closing theme={theme} data={data} />
      </CanvasSectionFrame>
      <BottomNav theme={theme} data={data} scrollRoot={() => rootRef.current} />
    </main>
  );

  return (
    <div ref={rootRef} className="relative overflow-x-clip antialiased" style={themeStyle(theme)}>
      {theme.assets?.backgroundImage && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: `url(${theme.assets.backgroundImage})` }}
        />
      )}
      {themeFonts(theme).map((f) => (
        <link key={f} rel="stylesheet" href={fontHref(f)} precedence="default" />
      ))}

      {!embedded && opened && data.music?.enabled && data.music.url && <MusicToggle url={data.music.url} type={data.music.type} autoPlay />}

      {!opened ? (
        renderCover()
      ) : !embedded ? (
        <div className="lg:grid lg:grid-cols-[42%_58%] xl:grid-cols-[44%_56%]">
          <DesktopStage theme={theme} data={data} />
          <div className="relative min-w-0">
            <div className="lg:hidden">{renderCover()}</div>
            {renderMainBody()}
          </div>
        </div>
      ) : (
        <>
          {renderCover()}
          {renderMainBody()}
        </>
      )}
    </div>
  );
}
