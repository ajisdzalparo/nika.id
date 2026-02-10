import React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconHeart, IconMapPin, IconCalendar, IconClock, IconGift, IconPhoto } from "@tabler/icons-react";

interface BankAccount {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

interface WeddingData {
  guestName?: string;
  groom: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
    instagram?: string;
    photo?: string;
  };
  bride: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
    instagram?: string;
    photo?: string;
  };
  event: {
    date: Date;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  };
  gallery: string[];
  video?: string;
  story: {
    title: string;
    content: string;
  };
  gifts: {
    enabled: boolean;
    bankAccounts: BankAccount[];
  };
  extra?: Record<string, string | number | boolean>;
}

export default function ClassicPremium({ data }: { data: WeddingData }) {
  const eventDate = new Date(data.event.date);

  return (
    <div className="min-h-screen bg-[#FDF8F5] font-serif text-[#4A403A]">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center p-6 bg-white overflow-hidden">
        {/* Subtle Floral Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/floral-paper.png')]" />

        <div className="z-10 space-y-8 animate-in fade-in zoom-in duration-1000">
          <p className="text-sm uppercase tracking-[0.4em] text-[#C4A484] font-sans">The Wedding Celebration Of</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <h1 className="text-6xl md:text-8xl font-light italic">{data.groom.nickname}</h1>
            <span className="text-4xl text-[#C4A484] font-sans">&amp;</span>
            <h1 className="text-6xl md:text-8xl font-light italic">{data.bride.nickname}</h1>
          </div>
          <div className="h-px w-24 bg-[#C4A484] mx-auto" />
          <p className="text-xl tracking-widest font-sans">{format(eventDate, "dd . MM . yyyy")}</p>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto space-y-6">
        <IconHeart className="w-8 h-8 mx-auto text-[#C4A484] fill-current opacity-50" />
        <p className="text-lg leading-relaxed italic">&ldquo;Maka timbulah kasih sayang di antara mereka. Sungguh pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.&rdquo;</p>
        <p className="text-sm font-sans font-bold uppercase tracking-wider text-[#C4A484]">Ar-Rum: 21</p>
      </section>

      {/* Couple Detail Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-20">
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-56 h-72 bg-[#FDF8F5] rounded-t-full border-8 border-white shadow-2xl overflow-hidden">
                {data.groom.photo ? (
                  <img src={data.groom.photo} alt={data.groom.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#C4A484]">Groom Photo</div>
                )}
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">🤵</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl italic">{data.groom.fullName}</h2>
              <p className="text-sm text-gray-500 font-sans">Putra dari</p>
              <p className="text-lg font-bold">
                Bpk. {data.groom.fatherName} &amp; Ibu {data.groom.motherName}
              </p>
              {data.groom.instagram && <p className="text-xs text-[#C4A484] font-sans">@{data.groom.instagram}</p>}
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-56 h-72 bg-[#FDF8F5] rounded-t-full border-8 border-white shadow-2xl overflow-hidden">
                {data.bride.photo ? (
                  <img src={data.bride.photo} alt={data.bride.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#C4A484]">Bride Photo</div>
                )}
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">👰</div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl italic">{data.bride.fullName}</h2>
              <p className="text-sm text-gray-500 font-sans">Putri dari</p>
              <p className="text-lg font-bold">
                Bpk. {data.bride.fatherName} &amp; Ibu {data.bride.motherName}
              </p>
              {data.bride.instagram && <p className="text-xs text-[#C4A484] font-sans">@{data.bride.instagram}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Event Info */}
      <section className="py-24 px-6 bg-[#F9F3EE] relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-12 text-center">
          <div className="space-y-2">
            <h2 className="text-4xl italic">Akad &amp; Resepsi</h2>
            <div className="h-px w-16 bg-[#C4A484] mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-8 w-full">
            <div className="bg-white p-10 rounded-3xl shadow-xl space-y-6 hover:translate-y-[-5px] transition-transform">
              <IconCalendar className="w-10 h-10 mx-auto text-[#C4A484]" />
              <div className="space-y-1">
                <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Hari &amp; Tanggal</p>
                <p className="text-xl font-bold">{format(eventDate, "EEEE, d MMMM yyyy", { locale: idLocale })}</p>
              </div>
            </div>
            <div className="bg-white p-10 rounded-3xl shadow-xl space-y-6 hover:translate-y-[-5px] transition-transform">
              <IconClock className="w-10 h-10 mx-auto text-[#C4A484]" />
              <div className="space-y-1">
                <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Waktu Acara</p>
                <p className="text-xl font-bold">{data.event.time} WIB - Selesai</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-2xl space-y-6">
            <IconMapPin className="w-10 h-10 mx-auto text-[#C4A484]" />
            <div className="space-y-4">
              <div>
                <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Lokasi Acara</p>
                <p className="text-xl font-bold">{data.event.venue}</p>
              </div>
              <p className="text-gray-500 leading-relaxed">{data.event.address}</p>
              <a href={data.event.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#4A403A] text-white px-8 py-3 rounded-full font-sans font-bold hover:bg-[#C4A484] transition-colors">
                Buka Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {data.gallery && data.gallery.length > 0 && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <IconPhoto className="w-8 h-8 mx-auto text-[#C4A484]" />
              <h2 className="text-4xl italic">Momen Bahagia</h2>
              <div className="h-px w-16 bg-[#C4A484] mx-auto" />
            </div>

            <div className="columns-1 md:columns-3 gap-4 space-y-4">
              {data.gallery.map((photo, i) => (
                <div key={i} className="rounded-2xl overflow-hidden shadow-lg hover:opacity-90 transition-opacity">
                  <img src={photo} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gift / Digital Envelope */}
      <section className="py-24 px-6 bg-[#FDF8F5] text-center">
        <div className="max-w-xl mx-auto space-y-10">
          <div className="space-y-2">
            <IconGift className="w-8 h-8 mx-auto text-[#C4A484] fill-current" />
            <h2 className="text-4xl italic">Kado Pernikahan</h2>
            <div className="h-px w-16 bg-[#C4A484] mx-auto" />
            <p className="text-gray-500 font-sans mt-4">Doa restu Anda adalah karunia yang sangat berarti. Namun jika ingin berbagi kasih, Anda bisa melalui:</p>
          </div>

          <div className="space-y-4">
            {data.gifts?.enabled &&
              data.gifts.bankAccounts?.map((bank, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-lg space-y-4">
                  <p className="font-bold text-[#C4A484]">{bank.bankName}</p>
                  <p className="text-2xl font-black">{bank.accountNumber}</p>
                  <p className="text-sm font-sans text-gray-400">a.n {bank.accountHolder}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bank.accountNumber);
                    }}
                    className="text-xs font-sans font-bold underline"
                  >
                    Salin Nomor Rekening
                  </button>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center bg-[#4A403A] text-white">
        <div className="space-y-4">
          <p className="italic text-xl">Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
          <h3 className="text-2xl font-light">
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h3>
          <div className="pt-8 text-[10px] tracking-[0.3em] uppercase opacity-50">Official Invitation by Nika.id</div>
        </div>
      </footer>
    </div>
  );
}
