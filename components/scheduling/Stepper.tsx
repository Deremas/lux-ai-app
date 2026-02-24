"use client";

import { cn } from "@/lib/utils";

type StepperProps = {
    steps: Array<{
        id: string;
        label: string;
        isCompleted?: boolean;
        isActive?: boolean;
    }>;
    className?: string;
};

export default function Stepper({ steps, className }: StepperProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {steps.map((step, index) => (
                <div
                    key={step.id}
                    className={cn(
                        // Base pill styles
                        "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                        // Default state
                        "border-gray-200 bg-white text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-300",
                        // Active state
                        step.isActive &&
                        "border-primary-200 bg-primary-500 text-white hover:bg-primary-600 dark:border-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700",
                        // Completed state
                        step.isCompleted &&
                        "border-green-200 bg-green-500 text-white hover:bg-green-600 dark:border-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    )}
                >
                    <span className="mr-2">{index + 1}</span>
                    {step.label}
                </div>
            ))}
        </div>
    );
}
