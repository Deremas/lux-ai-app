import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  description?: string;
  activeCount?: number;
  onReset?: () => void;
  resetLabel?: string;
};

type FilterFieldProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
};

export function FilterField({
  label,
  children,
  className,
  hint,
}: FilterFieldProps) {
  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      {hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export default function FilterBar({
  children,
  className,
  contentClassName,
  title,
  description,
  activeCount,
  onReset,
  resetLabel = "Reset",
}: FilterBarProps) {
  const showHeader =
    Boolean(title) ||
    Boolean(description) ||
    typeof activeCount === "number" ||
    Boolean(onReset);

  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_22px_55px_-40px_rgba(15,23,42,0.42)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/68",
        className
      )}
    >
      {showHeader ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 pb-4 dark:border-slate-700/60">
          <div className="min-w-0">
            {title ? (
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                {title}
              </p>
            ) : null}
            {description ? (
              <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
          {(typeof activeCount === "number" || onReset) && (
            <div className="flex items-center gap-3">
              {typeof activeCount === "number" ? (
                <span className="rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-300">
                  {activeCount} active
                </span>
              ) : null}
              {onReset ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  disabled={typeof activeCount === "number" && activeCount === 0}
                >
                  {resetLabel}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
