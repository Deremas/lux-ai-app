import { cn } from "@/lib/utils";

type KpiCardProps = {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
};

export default function KpiCard({
    label,
    value,
    icon,
    trend,
    className,
}: KpiCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_26px_60px_-45px_rgba(0,0,0,0.6)]",
                className
            )}
        >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-accent-500" />
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                        {label}
                    </p>
                    <p className="mt-3 text-3xl font-bold text-primary-600 dark:text-accent-500">
                        {value}
                    </p>
                    {trend && (
                        <div className="mt-2 flex items-center gap-1">
                            <span
                                className={cn(
                                    "text-sm font-medium",
                                    trend.isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {trend.isPositive ? "+" : "-"}{trend.value}%
                            </span>
                            <span className="text-xs text-gray-500">vs last period</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-700 dark:bg-slate-800 dark:text-slate-200">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
