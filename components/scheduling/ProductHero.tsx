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
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", className)}>
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
        {chips ? <div className="flex flex-wrap items-center gap-2">{chips}</div> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
