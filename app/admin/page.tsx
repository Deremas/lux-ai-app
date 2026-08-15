import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

export default async function AdminIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(
      "/auth/signin?callbackUrl=%2Fadmin%2Fscheduling&error=AdminAccessRequired"
    );
  }

  redirect("/admin/scheduling");
}
