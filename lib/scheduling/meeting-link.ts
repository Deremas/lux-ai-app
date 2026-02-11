import "server-only";

export type MeetingMode = "google_meet" | "zoom" | "phone" | "in_person";

export function getMeetingLink(params: {
  appointmentId: string;
  mode: string | null | undefined;
  overrideLink?: string | null;
}) {
  const mode = params.mode as MeetingMode | "";
  if (!mode) return null;
  if (params.overrideLink) return params.overrideLink;
  if (mode === "phone" || mode === "in_person") return null;

  if (mode === "google_meet") {
    // Google Meet requires Calendar API integration; return null until configured.
    return null;
  }

  if (mode === "zoom") {
    return process.env.ZOOM_JOIN_URL ?? null;
  }

  return null;
}
