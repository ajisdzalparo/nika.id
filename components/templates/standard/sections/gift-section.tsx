import React from "react";
import { IconGift } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { CopyButton } from "@/components/common/copy-button";
import { SectionHeader } from "../shared";

export function GiftSection({ data }: { data: WeddingData }) {
  if (!data.gifts?.enabled || data.gifts.bankAccounts.length === 0) return null;

  return (
    <section className="border-t border-[#E5DCCF] bg-[#F2ECE2]/75 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl space-y-12">
        <SectionHeader
          kicker="Tanda Kasih"
          title="Kado Pernikahan"
          subtitle="Doa restu Anda merupakan karunia terindah. Namun apabila berkenan memberi tanda kasih, dapat disalurkan melalui rekening berikut:"
        />

        <div
          className={`grid gap-6 ${
            data.gifts.bankAccounts.length === 1
              ? "mx-auto max-w-md grid-cols-1"
              : "sm:grid-cols-2"
          }`}
        >
          {data.gifts.bankAccounts.map((bank, idx) => (
            <div
              key={`${bank.bankName}-${bank.accountNumber}-${idx}`}
              className="relative flex flex-col justify-between border border-[#DFD4C4] bg-[#FFFDF9] p-6 text-center shadow-[0_18px_45px_-30px_rgba(31,28,24,0.25)] sm:p-7"
            >
              <span
                className="absolute inset-x-8 top-0 h-px bg-[#B0915D]/60"
                aria-hidden="true"
              />

              <div className="space-y-3">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#E3DACD] bg-[#FAF6F0] text-[#9A7B4F]">
                  <IconGift size={16} stroke={1.6} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9A7B4F]">
                  {bank.bankName}
                </p>
                <p className="font-mono text-xl font-medium tracking-wider text-[#1F1C18] tabular-nums">
                  {bank.accountNumber}
                </p>
                <p className="text-xs text-[#6B6257]">
                  a.n.{" "}
                  <span className="font-medium text-[#1F1C18]">
                    {bank.accountHolder}
                  </span>
                </p>
              </div>

              <div className="mt-5 flex justify-center [&_button]:border-[#D8CBB8] [&_button]:bg-[#FAF6F0] [&_button]:text-[#1F1C18] [&_button:hover]:bg-[#EFE7DA]">
                <CopyButton text={bank.accountNumber} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
