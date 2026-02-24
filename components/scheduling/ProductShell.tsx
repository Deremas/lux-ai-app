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
    <div
      className={cn(
        "w-full bg-[radial-gradient(circle_at_top,_#e0f2fe_0%,_#f8fafc_35%,_#ffffff_70%)] dark:bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_55%,_#0b1120_100%)]",
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <div
          className={cn(
            "rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900 md:p-10",
            surfaceClassName
          )}
        >
          {children}
        </div>
        <div className="mt-12" />
      </div>
    </div>
  );
}
