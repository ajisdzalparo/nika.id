"use client";

import React from "react";
import { WeddingData } from "@/types/wedding";

interface VideoSectionProps {
  data: WeddingData;
}

export function VideoSection({ data }: VideoSectionProps) {
  if (!data.video) return null;

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Simple fallback for other urls, though customized parsing might be needed for vimeo etc.
    return url;
  };

  return (
    <section className="py-12 px-6 bg-black/5">
      <div className="max-w-4xl mx-auto space-y-8 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-serif italic">Wedding Video</h2>
          <div className="h-px w-20 bg-gray-300 mx-auto" />
        </div>
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-xl">
          <iframe src={getEmbedUrl(data.video)} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Wedding Video" />
        </div>
      </div>
    </section>
  );
}
