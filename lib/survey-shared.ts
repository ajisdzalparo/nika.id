/** Survey options shared by the dialog (browser) and the API (server). */
export const SURVEY_SOURCES = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Google",
  "Teman / keluarga",
  "Wedding organizer / vendor",
  "Pameran / expo",
  "Lainnya",
] as const;

/** After "Nanti saja", the survey comes back once the user has moved through this many pages. */
export const SURVEY_ACTIONS_BETWEEN_ASKS = 8;
