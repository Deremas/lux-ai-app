import Link from "next/link";
import { Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import Badge, { BookingStatus } from "@/components/scheduling/Badge";

type MeetingTypeCardProps = {
    id: string;
    title: string;
    description: string;
    duration: string;
    price?: string;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
};

export default function MeetingTypeCard({
    id,
    title,
    description,
    duration,
    price,
    isActive = false,
    onClick,
    className,
}: MeetingTypeCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                // Base card styling
                "w-full rounded-2xl border bg-white p-6 text-left shadow-md transition-all duration-200",
                "hover:shadow-lg hover:-translate-y-1",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                "dark:border-slate-700 dark:bg-slate-900",
                // Active state
                isActive &&
                "ring-4 ring-primary-200 bg-primary-50 dark:bg-primary-900/20 dark:ring-primary-800",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                        {title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {description}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>{duration}</span>
                        </div>
                        {price && (
                            <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                                <DollarSign className="h-4 w-4" />
                                <span>{price}</span>
                            </div>
                        )}
                    </div>
                </div>
                {isActive && (
                    <Badge variant="default" className="shrink-0">
                        Selected
                    </Badge>
                )}
            </div>
        </button>
    );
}
