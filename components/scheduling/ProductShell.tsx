import { cn } from "@/lib/utils";

type ProductShellProps = {
  children: React.ReactNode;
  className?: string;
  surfaceClassName?: string;
};

export default function ProductShell({
  children,
  className,
  surfaceClassName,
}: ProductShellProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        "bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_40%,_#ffffff_75%)]",
        "dark:bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_55%,_#0b1120_100%)]",
        className
      )}
    >
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-140px] top-24 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className={cn("min-w-0 space-y-8", surfaceClassName)}>
          {children}
        </div>
      </div>
    </section>
  );
}
