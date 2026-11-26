// Public base URL of the app (no trailing slash). Used for metadataBase, robots, sitemap and JSON-LD.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "https://satumoment.com"
).replace(/\/+$/, "");

export const SITE_NAME = "SatuMoment";

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
