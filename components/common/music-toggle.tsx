/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { IconMusic, IconMusicOff } from "@tabler/icons-react";

export function MusicToggle({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = new Audio(url);
    a.loop = true;
    setAudio(a);
    return () => {
      a.pause();
      a.src = "";
    };
  }, [url]);

  const toggle = () => {
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  return (
    <button onClick={toggle} className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center hover:scale-110 transition-transform" aria-label="Toggle Music">
      {playing ? <IconMusic size={20} className="text-pink-500" /> : <IconMusicOff size={20} className="text-gray-400" />}
    </button>
  );
}
