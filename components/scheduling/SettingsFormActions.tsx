import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SettingsFormActionsProps = {
  isDirty: boolean;
  saving?: boolean;
  onSave: () => void;
  primaryLabel?: string;
  secondaryAction?: React.ReactNode;
  className?: string;
};

export default function SettingsFormActions({
  isDirty,
  saving = false,
  onSave,
  primaryLabel = "Save changes",
  secondaryAction,
  className,
}: SettingsFormActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-lg backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/80",
        className
      )}
    >
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {isDirty ? "Unsaved changes" : "No pending changes"}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {secondaryAction}
        <Button type="button" onClick={onSave} disabled={!isDirty || saving}>
          {saving ? "Saving..." : primaryLabel}
        </Button>
      </div>
    </div>
  );
}
