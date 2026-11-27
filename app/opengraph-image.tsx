import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SatuMoment · Undangan pernikahan digital dengan Desain AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Google Font as TTF for Satori; falls back to the default font if offline. */
async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

const svgData = async (file: string) =>
  `data:image/svg+xml;base64,${(await readFile(join(process.cwd(), "public/brand", file))).toString("base64")}`;

const GOLD = "#8A6424";
const INK = "#1F1A14";
const MUTED = "#6B5F50";

/**
 * Everything that matters sits in the centre 630×630: WhatsApp and many chat apps crop link previews
 * to a square from the middle, so a left/right layout loses the logo there. The wide frame and the
 * side ornaments only add atmosphere on platforms that show the full 1200×630 card.
 */
export default async function OpengraphImage() {
  const [symbol, display, sans] = await Promise.all([
    svgData("symbol-gold.svg"),
    loadFont("Bodoni+Moda", 500),
    loadFont("Plus+Jakarta+Sans", 600),
  ]);

  const sideOrnament = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: 1, height: 120, background: GOLD, opacity: 0.35 }} />
      <div style={{ width: 9, height: 9, border: `1px solid ${GOLD}`, transform: "rotate(45deg)", opacity: 0.6 }} />
      <div style={{ width: 1, height: 120, background: GOLD, opacity: 0.35 }} />
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FCF8F1", padding: 28 }}>
        {/* Stationery-style double frame */}
        <div style={{ flex: 1, display: "flex", border: "1px solid #D9C7A4", padding: 8 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: "1px solid #E9DDC6",
              background: "#FFFDF9",
              padding: "0 96px",
            }}
          >
            {sideOrnament}

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 540 }}>
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img src={symbol} width={84} height={84} />
              <div
                style={{
                  marginTop: 22,
                  fontFamily: "Sans",
                  fontSize: 17,
                  letterSpacing: 7,
                  color: GOLD,
                  textTransform: "uppercase",
                }}
              >
                SatuMoment
              </div>
              <div
                style={{
                  marginTop: 30,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  fontFamily: "Display",
                  fontSize: 64,
                  lineHeight: 1.08,
                  color: INK,
                }}
              >
                <span>Setiap momen,</span>
                <span>layak dirayakan.</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 30 }}>
                <div style={{ width: 44, height: 1, background: GOLD, opacity: 0.6 }} />
                <div style={{ width: 6, height: 6, background: GOLD, transform: "rotate(45deg)" }} />
                <div style={{ width: 44, height: 1, background: GOLD, opacity: 0.6 }} />
              </div>
              <div style={{ marginTop: 22, fontFamily: "Sans", fontSize: 22, color: MUTED }}>
                Undangan pernikahan digital
              </div>
            </div>

            {sideOrnament}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(display ? [{ name: "Display", data: display, weight: 500 as const, style: "normal" as const }] : []),
        ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const, style: "normal" as const }] : []),
      ],
    },
  );
}
