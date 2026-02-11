import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getOrgRole } from "@/lib/scheduling/authz";

export async function requireAdminOrStaffForOrg(
  orgId: string,
  returnTo: string
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    const callbackUrl = encodeURIComponent(returnTo);
    redirect(`/auth/signin?callbackUrl=${callbackUrl}&error=AdminAccessRequired`);
  }

  const role = await getOrgRole({ orgId, userId });
  if (!role || !["admin", "staff"].includes(role)) {
    redirect("/auth/denied?reason=admin");
  }
}
