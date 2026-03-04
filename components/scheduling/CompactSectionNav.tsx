"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
    id: string;
    label: string;
    href: string;
    isActive?: boolean;
};

type CompactSectionNavProps = {
    items: NavItem[];
    className?: string;
};

export default function CompactSectionNav({ items, className }: CompactSectionNavProps) {
    const [isMobile, setIsMobile] = useState(false);

    // Simple mobile detection (you could use a more sophisticated approach)
    useState(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    });

    const activeItem = items.find(item => item.isActive);

    if (isMobile) {
        return (
            <div className={cn("w-full sm:hidden", className)}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center justify-between rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-left text-sm font-medium text-gray-900 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-white">
                            <span>{activeItem?.label || "Navigate to..."}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-full min-w-[200px]">
                        {items.map((item) => (
                            <DropdownMenuItem key={item.id} asChild>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "w-full",
                                        item.isActive && "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <div className={cn("hidden sm:block", className)}>
            <div className="flex flex-wrap items-center gap-2">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                            // Base pill styles
                            "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors backdrop-blur",
                            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                            // Default state
                            "border-white/70 bg-white/80 text-gray-700 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300 dark:hover:bg-slate-800",
                            // Active state
                            item.isActive &&
                            "border-primary-200 bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-500 hover:to-indigo-500 dark:border-primary-700 dark:from-primary-500 dark:to-indigo-500"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
