import { cn } from "@/lib/utils";

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
};

export default function SectionCard({
  children,
  className,
  highlight = false,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-white/70 bg-white/85 p-6 text-card-foreground shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur",
        "dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_26px_60px_-45px_rgba(0,0,0,0.6)]",
        highlight &&
          "bg-gradient-to-br from-white via-blue-50/60 to-white dark:from-slate-900/80 dark:to-slate-900/60",
        className
      )}
    >
      {children}
    </div>
  );
}
