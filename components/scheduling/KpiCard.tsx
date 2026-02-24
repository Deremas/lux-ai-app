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
                "rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-primary-500 dark:text-accent-500">
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 dark:bg-slate-800">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
