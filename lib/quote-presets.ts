/**
 * Ready-made opening quotes for the invitation, grouped by tradition so every couple finds one that fits.
 * The couple can still write their own text and source.
 */
export interface QuotePreset {
  id: string;
  group: "Islam" | "Kristen / Katolik" | "Umum";
  label: string;
  text: string;
  source: string;
}

export const QUOTE_PRESETS: readonly QuotePreset[] = [
  {
    id: "ar-rum-21",
    group: "Islam",
    label: "QS. Ar-Rum: 21",
    text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
    source: "QS. Ar-Rum: 21",
  },
  {
    id: "adz-dzariyat-49",
    group: "Islam",
    label: "QS. Adz-Dzariyat: 49",
    text: "Dan segala sesuatu Kami ciptakan berpasang-pasangan agar kamu mengingat (kebesaran Allah).",
    source: "QS. Adz-Dzariyat: 49",
  },
  {
    id: "kejadian-2-24",
    group: "Kristen / Katolik",
    label: "Kejadian 2:24",
    text: "Sebab itu seorang laki-laki akan meninggalkan ayahnya dan ibunya dan bersatu dengan isterinya, sehingga keduanya menjadi satu daging.",
    source: "Kejadian 2:24",
  },
  {
    id: "matius-19-6",
    group: "Kristen / Katolik",
    label: "Matius 19:6",
    text: "Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.",
    source: "Matius 19:6",
  },
  {
    id: "umum-perjalanan",
    group: "Umum",
    label: "Dua cerita menjadi satu",
    text: "Dua cerita yang berbeda kini menjadi satu perjalanan. Dengan penuh syukur, kami ingin merayakan awal yang baru bersama orang-orang tersayang.",
    source: "",
  },
  {
    id: "umum-rumah",
    group: "Umum",
    label: "Menemukan rumah",
    text: "Pada akhirnya, kami menemukan rumah bukan pada sebuah tempat, melainkan pada satu sama lain.",
    source: "",
  },
] as const;
