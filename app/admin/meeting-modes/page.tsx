import { redirect } from "next/navigation";

function pickParam(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

export default function MeetingModesRedirectPage({
  searchParams,
}: {
  searchParams?: { orgId?: string | string[] };
}) {
  const orgId = pickParam(searchParams?.orgId);
  const target = orgId
    ? `/admin/scheduling/meeting-types?orgId=${orgId}`
    : "/admin/scheduling/meeting-types";
  redirect(target);
}
