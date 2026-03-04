import Link from "next/link";
import { cn } from "@/lib/utils";

type ManagementTile = {
    id: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    href: string;
    badge?: {
        text: string;
        variant: "default" | "secondary" | "destructive" | "outline";
    };
};

type ManagementGridProps = {
    tiles: ManagementTile[];
    className?: string;
};

export default function ManagementGrid({ tiles, className }: ManagementGridProps) {
    return (
        <div
            className={cn(
                // Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
                "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
                className
            )}
        >
            {tiles.map((tile) => (
                <Link
                    key={tile.id}
                    href={tile.href}
                    className={cn(
                        // Tile base styling
                        "group relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] transition-all duration-200 backdrop-blur",
                        "hover:-translate-y-1 hover:shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]",
                        "dark:border-slate-700/60 dark:bg-slate-900/70",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    )}
                >
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500/70 via-blue-500/70 to-accent-500/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                                    {tile.title}
                                </h3>
                                {tile.badge && (
                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-1 text-xs font-semibold",
                                            tile.badge.variant === "default" && "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300",
                                            tile.badge.variant === "secondary" && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                                            tile.badge.variant === "destructive" && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                                            tile.badge.variant === "outline" && "border border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300"
                                        )}
                                    >
                                        {tile.badge.text}
                                    </span>
                                )}
                            </div>
                            {tile.description && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {tile.description}
                                </p>
                            )}
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-700 dark:bg-slate-800 dark:text-slate-200 group-hover:bg-primary-500/15 transition-colors">
                            {tile.icon}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
