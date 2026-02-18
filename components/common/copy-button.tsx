"use client";

import React, { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/80 border border-gray-200 hover:bg-white transition-all">
      {copied ? (
        <>
          <IconCheck size={14} className="text-green-500" /> Tersalin!
        </>
      ) : (
        <>
          <IconCopy size={14} /> Salin
        </>
      )}
    </button>
  );
}
