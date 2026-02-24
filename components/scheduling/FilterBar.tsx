import { cn } from "@/lib/utils";

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
};

export default function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}
