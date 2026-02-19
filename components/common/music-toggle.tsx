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
function extractYouTubeId(url: string): string | null {
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/];
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

  const isYoutube = type === "youtube" || (!type && !!extractYouTubeId(url));
  const youtubeId = isYoutube ? extractYouTubeId(url) : null;

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

      <button
        onClick={toggle}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-xl border border-gray-100 flex items-center justify-center hover:scale-110 transition-all duration-300 ${playing ? "bg-white animate-spin-slow" : "bg-gray-100"}`}
        aria-label="Toggle Music"
      >
        {playing ? <IconMusic size={20} className="text-pink-500" /> : <IconMusicOff size={20} className="text-gray-400" />}
      </button>
    </>
  );
}
