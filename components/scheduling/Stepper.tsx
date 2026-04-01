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
        <div className={cn("flex flex-wrap items-center gap-1.5 md:gap-2", className)}>
            {steps.map((step, index) => (
                <div
                    key={step.id}
                    className={cn(
                        // Base pill styles
                        "inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors backdrop-blur md:px-4 md:py-2",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                        // Default state
                        "border-white/70 bg-white/80 text-gray-700 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-gray-300",
                        // Active state
                        step.isActive &&
                        "border-primary-200 bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:from-primary-500 hover:to-indigo-500 dark:border-primary-700 dark:from-primary-500 dark:to-indigo-500",
                        // Completed state
                        step.isCompleted &&
                        "border-emerald-200 bg-gradient-to-r from-emerald-500 to-lime-500 text-white hover:from-emerald-400 hover:to-lime-400 dark:border-emerald-700 dark:from-emerald-500 dark:to-lime-500"
                    )}
                >
                    <span className="mr-1.5 md:mr-2">{index + 1}</span>
                    {step.label}
                </div>
            ))}
        </div>
    );
}
