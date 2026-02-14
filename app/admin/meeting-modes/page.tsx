import { redirect } from "next/navigation";

export default function MeetingModesRedirectPage() {
  redirect("/admin/scheduling/meeting-types");
}
