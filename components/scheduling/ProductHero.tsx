import { cn } from "@/lib/utils";

type ProductHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  chips?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export default function ProductHero({
  eyebrow,
  title,
  subtitle,
  chips,
  actions,
  className,
}: ProductHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_70px_-45px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-accent-500" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 md:text-base">
              {subtitle}
            </p>
          ) : null}
          {chips ? (
            <div className="flex flex-wrap items-center gap-2">{chips}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
