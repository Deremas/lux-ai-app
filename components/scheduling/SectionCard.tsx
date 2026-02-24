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
        "rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900",
        highlight &&
          "bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700",
        className
      )}
    >
      {children}
    </div>
  );
}
