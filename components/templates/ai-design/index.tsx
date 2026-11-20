"use client";

import { useRef, useState } from "react";
import { IconCalendarEvent, IconGift, IconHeart, IconMessageCircle, IconPhoto } from "@tabler/icons-react";
import type { WeddingData } from "@/types/wedding";
import { DEFAULT_AI_THEME, type AiTheme } from "@/lib/ai-design/schema";
import { MusicToggle } from "@/components/common/music-toggle";
import { fontHref, themeFonts, themeStyle } from "./theme";
import { EdgeSprigs } from "./ornaments";
import { Closing, Countdown, Couple, Cover, DesktopStage, Events, Gallery, Gift, Opening, Rsvp, Story, Video } from "./sections";

interface Props {
  data: WeddingData;
  /** Overrides data.aiTheme (used by the live preview). */
  theme?: AiTheme;
  /** Rendered inside a phone frame: no music, no fixed elements, RSVP disabled. */
  embedded?: boolean;
  /** Render the cover CTA as a non-interactive span (used inside CoverThumb cards wrapped by button/Link). */
  staticCover?: boolean;
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

export default function AiDesignTemplate({ data, theme: themeProp, embedded = false, staticCover = false }: Props) {
  const theme = themeProp ?? data.aiTheme ?? DEFAULT_AI_THEME;
  const [opened, setOpened] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const screen = embedded ? "min-h-[700px]" : "min-h-svh";

  const open = () => {
    setOpened(true);
    requestAnimationFrame(() => rootRef.current?.querySelector("#pembuka")?.scrollIntoView({ behavior: "smooth" }));
  };

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
        <Cover theme={theme} data={data} opened={opened} onOpen={open} screen={screen} embedded={embedded} staticCover={staticCover} />
      ) : !embedded ? (
        <div className="lg:grid lg:grid-cols-[42%_58%] xl:grid-cols-[44%_56%]">
          <DesktopStage theme={theme} data={data} />
          <div className="relative min-w-0">
            <div className="lg:hidden">
              <Cover theme={theme} data={data} opened={opened} onOpen={open} screen={screen} embedded={embedded} />
            </div>
            <main className="animate-in fade-in duration-700">
              <div id="pembuka" />
              <Opening theme={theme} data={data} />
              <EdgeSprigs theme={theme} />
              <Couple theme={theme} data={data} />
              <Countdown theme={theme} data={data} />
              <Events theme={theme} data={data} />
              <Story theme={theme} data={data} />
              <Gallery theme={theme} data={data} />
              <Video theme={theme} data={data} />
              <Gift theme={theme} data={data} />
              <Rsvp theme={theme} data={data} preview={embedded} />
              <Closing theme={theme} data={data} />
              <BottomNav theme={theme} data={data} scrollRoot={() => rootRef.current} />
            </main>
          </div>
        </div>
      ) : (
        <>
          <Cover theme={theme} data={data} opened={opened} onOpen={open} screen={screen} embedded={embedded} />
          <main className="animate-in fade-in duration-700">
            <div id="pembuka" />
            <Opening theme={theme} data={data} />
            <EdgeSprigs theme={theme} />
            <Couple theme={theme} data={data} />
            <Countdown theme={theme} data={data} />
            <Events theme={theme} data={data} />
            <Story theme={theme} data={data} />
            <Gallery theme={theme} data={data} />
            <Video theme={theme} data={data} />
            <Gift theme={theme} data={data} />
            <Rsvp theme={theme} data={data} preview={embedded} />
            <Closing theme={theme} data={data} />
            <BottomNav theme={theme} data={data} scrollRoot={() => rootRef.current} />
          </main>
        </>
      )}
    </div>
  );
}
