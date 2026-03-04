import { cn } from "@/lib/utils";

// Canonical status types
export type BookingStatus = "pending" | "confirmed" | "completed" | "declined" | "canceled";
export type PaymentStatus = "paid" | "unpaid" | "not_required";
export type PolicyStatus = "free" | "pay_before_confirm";

type BadgeProps = {
    children: React.ReactNode;
    variant?: BookingStatus | PaymentStatus | PolicyStatus | "default" | "secondary" | "destructive" | "outline";
    size?: "sm" | "md";
    className?: string;
};

const statusConfig = {
    // Booking statuses
    pending: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
    },
    confirmed: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
    },
    completed: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
    },
    declined: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
    },
    canceled: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
    },
    // Payment statuses
    paid: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
    },
    unpaid: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-800",
    },
    not_required: {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-800",
    },
    // Policy statuses
    free: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
    },
    pay_before_confirm: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
    },
    // Default variants
    default: {
        bg: "bg-primary-50 dark:bg-primary-900/20",
        text: "text-primary-700 dark:text-primary-300",
        border: "border-primary-200 dark:border-primary-800",
    },
    secondary: {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-800",
    },
    destructive: {
        bg: "bg-red-50 dark:bg-red-900/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
    },
    outline: {
        bg: "bg-transparent dark:bg-transparent",
        text: "text-gray-700 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-800",
    },
};

export default function Badge({
    children,
    variant = "default",
    size = "sm",
    className,
}: BadgeProps) {
    const config = statusConfig[variant] || statusConfig.default;

    return (
        <span
            className={cn(
                // Base styles
                "inline-flex items-center rounded-full border font-semibold shadow-sm backdrop-blur",
                config.bg,
                config.text,
                config.border,
                // Size variants
                size === "sm" && "px-3 py-1 text-xs",
                size === "md" && "px-4 py-2 text-sm",
                className
            )}
        >
            {children}
        </span>
    );
}

// Helper function to get status display text
export function getStatusDisplay(status: BookingStatus | PaymentStatus | PolicyStatus): string {
    const statusMap: Record<string, string> = {
        // Booking statuses
        pending: "Pending",
        confirmed: "Confirmed",
        completed: "Completed",
        declined: "Declined",
        canceled: "Canceled",
        // Payment statuses
        paid: "Paid",
        unpaid: "Unpaid",
        not_required: "Not Required",
        // Policy statuses
        free: "Free",
        pay_before_confirm: "Pay Before Confirm",
    };

    return statusMap[status] || status;
}
