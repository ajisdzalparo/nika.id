"use client";

import React from "react";
import { IconGift } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { CopyButton } from "@/components/common/copy-button";

interface GiftSectionProps {
  data: WeddingData;
}

export function GiftSection({ data }: GiftSectionProps) {
  if (!data.gifts?.enabled || data.gifts.bankAccounts.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-lg mx-auto text-center">
        <div className="space-y-3 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto">
            <IconGift size={32} className="text-rose-500" />
          </div>
          <h2 className="text-3xl font-serif italic text-gray-900">Kirim Hadiah</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih Anda, Anda dapat memberi kado secara cashless</p>
        </div>

        <div className="space-y-4">
          {data.gifts.bankAccounts.map((bank, i) => (
            <div key={i} className="bg-[#FBF7F4] rounded-2xl p-6 space-y-3">
              <p className="text-sm font-bold text-rose-500 uppercase tracking-wider">{bank.bankName}</p>
              <p className="text-2xl font-black text-gray-900 tracking-wide">{bank.accountNumber}</p>
              <p className="text-sm text-gray-500">a.n {bank.accountHolder}</p>
              <CopyButton text={bank.accountNumber} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
