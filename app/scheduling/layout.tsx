import SchedulingShell from "@/components/scheduling/SchedulingShell";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserOrgContext } from "@/lib/scheduling/org-context";
import { getOrgRole } from "@/lib/scheduling/authz";

export default async function SchedulingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  let canViewAdmin = false;

  if (userId) {
    const orgContext = await getUserOrgContext(userId);
    if (orgContext?.orgId) {
      const role = await getOrgRole({ orgId: orgContext.orgId, userId });
      canViewAdmin = role === "admin";
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <SchedulingShell variant="client" canViewAdmin={canViewAdmin}>
        {children}
      </SchedulingShell>
      <Footer />
    </div>
  );
}
