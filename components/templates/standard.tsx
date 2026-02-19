"use client";

import React, { useState } from "react";
import { WeddingData } from "@/types/wedding";

// Shared Components
import { MusicToggle } from "@/components/common/music-toggle";
import { VideoSection } from "@/components/common/video-section";

// Sections
import { CoverPage } from "@/components/templates/standard/sections/cover-page";
import { HeroSection } from "@/components/templates/standard/sections/hero-section";
import { QuranVerseSection } from "@/components/templates/standard/sections/quran-verse-section";
import { CoupleSection } from "@/components/templates/standard/sections/couple-section";
import { EventSection } from "@/components/templates/standard/sections/event-section";
import { LoveStorySection } from "@/components/templates/standard/sections/love-story-section";
import { GallerySection } from "@/components/templates/standard/sections/gallery-section";
import { StreamingSection } from "@/components/templates/standard/sections/streaming-section";
import { GiftSection } from "@/components/templates/standard/sections/gift-section";
import { GuestMessageSection } from "@/components/templates/standard/sections/guest-message-section";
import { ClosingSection } from "@/components/templates/standard/sections/closing-section";

// ═══════════════════════════════════════════════════════════
// MAIN TEMPLATE
// ═══════════════════════════════════════════════════════════
export default function StandardTemplate({ data }: { data: WeddingData }) {
  const [opened, setOpened] = useState(false);

  if (!opened) {
    return <CoverPage groom={data.groom.nickname} bride={data.bride.nickname} guestName={data.guestName} onOpen={() => setOpened(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#FBF7F4] font-sans text-gray-800 overflow-x-hidden">
      {/* Music */}
      {data.music?.enabled && data.music.url && <MusicToggle url={data.music.url} type={data.music.type} autoPlay={true} />}

      {/* Sections */}
      <HeroSection data={data} />
      <QuranVerseSection data={data} />
      <CoupleSection data={data} />
      <EventSection data={data} />
      <LoveStorySection data={data} />
      <VideoSection data={data} />
      <GallerySection data={data} />
      <StreamingSection data={data} />
      <GiftSection data={data} />
      <GuestMessageSection />
      <ClosingSection data={data} />
    </div>
  );
}
