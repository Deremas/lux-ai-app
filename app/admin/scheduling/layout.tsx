import SchedulingShell from "@/components/scheduling/SchedulingShell";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AdminSchedulingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <SchedulingShell variant="admin">{children}</SchedulingShell>
      <Footer />
    </div>
  );
}
