import React from "react";
import { IconBrandInstagram } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { SectionHeader } from "../shared";

function CoupleCard({
  roleLabel,
  childOfLabel,
  person,
}: {
  roleLabel: string;
  childOfLabel: string;
  person: WeddingData["groom"];
}) {
  const initial = (person.nickname || person.fullName || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-6 w-52 sm:w-56">
        <div
          className="pointer-events-none absolute -inset-2 rounded-t-full rounded-b-2xl border border-[#C8B08A]/60"
          aria-hidden="true"
        />
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-full rounded-b-xl border border-[#DFD4C4] bg-[#F1EAE0] shadow-sm">
          {person.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo}
              alt={person.fullName}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[#EFE8DC] text-[#8C6D3F]">
              <span className="font-serif text-5xl italic">{initial}</span>
              <span className="mt-2 text-[10px] uppercase tracking-[0.26em] text-[#9A8B7A]">
                {roleLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#9A7B4F]">
        {roleLabel}
      </p>
      <h3 className="mt-2 font-serif text-2xl font-normal text-[#1F1C18] sm:text-[1.75rem]">
        {person.fullName}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-[#6B6257]">
        {childOfLabel}
        <br />
        <span className="font-medium text-[#3B352D]">
          {person.fatherName} &amp; {person.motherName}
        </span>
      </p>

      {person.instagram ? (
        <a
          href={`https://instagram.com/${person.instagram.replace(/^@/, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 border border-[#DDD2C2] bg-[#FFFDF9] px-3.5 py-1.5 text-xs text-[#5D554B] transition-colors hover:border-[#9A7B4F] hover:text-[#1F1C18]"
        >
          <IconBrandInstagram size={14} stroke={1.6} />
          @{person.instagram.replace(/^@/, "")}
        </a>
      ) : null}
    </div>
  );
}

export function CoupleSection({ data }: { data: WeddingData }) {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl space-y-14">
        <SectionHeader
          kicker="Mempelai Berbahagia"
          title="Assalamualaikum Warahmatullahi Wabarakatuh"
          subtitle="Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:"
        />

        <div className="grid items-start gap-12 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <CoupleCard
            roleLabel="Mempelai Pria"
            childOfLabel="Putra dari pasangan"
            person={data.groom}
          />

          <div className="flex items-center justify-center md:pt-36">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4C4AE] bg-[#FFFDF9] font-serif text-2xl italic text-[#9A7B4F]">
              &amp;
            </div>
          </div>

          <CoupleCard
            roleLabel="Mempelai Wanita"
            childOfLabel="Putri dari pasangan"
            person={data.bride}
          />
        </div>
      </div>
    </section>
  );
}
