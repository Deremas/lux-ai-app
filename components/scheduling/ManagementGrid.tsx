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
                        "group rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200",
                        "hover:shadow-md hover:-translate-y-1",
                        "dark:border-slate-700 dark:bg-slate-900",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    )}
                >
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
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-slate-700 transition-colors">
                            {tile.icon}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
