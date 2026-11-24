/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { IconMusic, IconMusicOff } from "@tabler/icons-react";

interface MusicToggleProps {
  url: string;
  type?: "youtube" | "upload";
  autoPlay?: boolean;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:(?:music|www|m)\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function MusicToggle({ url, type, autoPlay = false }: MusicToggleProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const youtubeId = extractYouTubeId(url);
  const isYoutube = Boolean(youtubeId) && type !== "upload";

  // Direct audio playback (uploaded files / direct MP3 links)
  useEffect(() => {
    if (isYoutube) return;

    const a = new Audio(url);
    a.loop = true;
    audioRef.current = a;

    if (autoPlay) {
      a.play()
        .then(() => setPlaying(true))
        .catch((e) => console.log("Auto-play blocked", e));
    }

    return () => {
      a.pause();
      a.src = "";
    };
  }, [url, autoPlay, isYoutube]);

  // YouTube: auto-play is handled by the iframe embed params
  useEffect(() => {
    if (isYoutube && autoPlay) {
      setPlaying(true);
    }
  }, [isYoutube, autoPlay]);

  const toggle = () => {
    if (isYoutube) {
      // Toggle YouTube playback by adding/removing the iframe
      setPlaying(!playing);
    } else {
      if (!audioRef.current) return;
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setPlaying(!playing);
    }
  };

  return (
    <>
      {/* Hidden YouTube iframe for audio playback */}
      {isYoutube && youtubeId && playing && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&modestbranding=1`}
          allow="autoplay"
          className="fixed w-0 h-0 opacity-0 pointer-events-none"
          style={{ position: "fixed", top: -9999, left: -9999 }}
          title="Background Music"
        />
      )}

      {/* Follows the invitation's palette through its CSS variables (falls back to ivory & gold) */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_8px_24px_-10px_rgba(0,0,0,0.35)] backdrop-blur transition-colors duration-300"
        style={{
          background: "color-mix(in srgb, var(--surface, #FFFDF9) 92%, transparent)",
          borderColor: "color-mix(in srgb, var(--accent, #8A6424) 35%, transparent)",
          color: playing ? "var(--accent, #8A6424)" : "var(--muted, #8C8272)",
        }}
        aria-label={playing ? "Jeda musik" : "Putar musik"}
        aria-pressed={playing}
      >
        {playing ? <IconMusic size={20} /> : <IconMusicOff size={20} />}
      </button>
    </>
  );
}
