import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SatuMoment · Setiap momen layak dirayakan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Bodoni Moda (the brand display face) as TTF for Satori; falls back to the default font if offline. */
async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@500")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

const svgData = async (file: string) =>
  `data:image/svg+xml;base64,${(await readFile(join(process.cwd(), "public/brand", file))).toString("base64")}`;

export default async function OpengraphImage() {
  const [lockup, monogram, font] = await Promise.all([svgData("lockup-primary.svg"), svgData("monogram-gold.svg"), loadDisplayFont()]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FCF8F1", padding: 64, color: "#1F1A14" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={lockup} width={341} height={60} />
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Display", fontSize: 76, lineHeight: 1.1 }}>
            <span>Setiap momen,</span>
            <span>layak dirayakan.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 24, color: "#6B5F50" }}>
            <div style={{ width: 64, height: 1, background: "#8A6424" }} />
            Undangan digital untuk setiap momen
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 328, background: "#F6EEDF", border: "1px solid #E9DDC6" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={monogram} width={260} height={260} />
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Display", data: font, weight: 500, style: "normal" }] : [] },
  );
}
