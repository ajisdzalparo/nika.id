"use client";

import React, { useState } from "react";
import { WeddingData } from "@/types/wedding";
import { MusicToggle } from "@/components/common/music-toggle";
import { VideoSection } from "@/components/common/video-section";
import { CoverPage } from "./standard/sections/cover-page";
import { HeroSection } from "./standard/sections/hero-section";
import { QuranVerseSection } from "./standard/sections/quran-verse-section";
import { CoupleSection } from "./standard/sections/couple-section";
import { EventSection } from "./standard/sections/event-section";
import { LoveStorySection } from "./standard/sections/love-story-section";
import { GallerySection } from "./standard/sections/gallery-section";
import { StreamingSection } from "./standard/sections/streaming-section";
import { GiftSection } from "./standard/sections/gift-section";
import { GuestMessageSection } from "./standard/sections/guest-message-section";
import { ClosingSection } from "./standard/sections/closing-section";

export default function StandardTemplate({ data }: { data: WeddingData }) {
  const [opened, setOpened] = useState(false);

  if (!opened) {
    return <CoverPage data={data} onOpen={() => setOpened(true)} />;
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#F8F4ED] text-[#1F1C18] selection:bg-[#C8B08A]/30 selection:text-[#1F1C18]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(200, 176, 138, 0.14) 0%, transparent 55%)",
      }}
    >
      {data.music?.enabled && data.music.url ? (
        <MusicToggle url={data.music.url} type={data.music.type} autoPlay={true} />
      ) : null}

      <HeroSection data={data} />
      <QuranVerseSection data={data} />
      <CoupleSection data={data} />
      <EventSection data={data} />
      <LoveStorySection data={data} />
      <GallerySection data={data} />
      <div className="[&>section]:bg-[#F2ECE2]/75 [&>section]:py-20 [&>section_h2]:text-[#1F1C18]">
        <VideoSection data={data} />
      </div>
      <StreamingSection data={data} />
      <GiftSection data={data} />
      <GuestMessageSection data={data} />
      <ClosingSection data={data} />
    </div>
  );
}
