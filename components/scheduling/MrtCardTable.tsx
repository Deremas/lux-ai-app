import * as React from "react";
import SectionCard from "@/components/scheduling/SectionCard";
import { cn } from "@/lib/utils";
import {
  MaterialReactTable,
  type MRT_RowData,
  type MRT_TableOptions,
} from "material-react-table";

type MrtCardTableProps<T extends MRT_RowData> = {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  className?: string;
  table: MRT_TableOptions<T>;
};

export default function MrtCardTable<T extends MRT_RowData>({
  title,
  subtitle,
  headerRight,
  className,
  table,
}: MrtCardTableProps<T>) {
  const baseRowSx = (theme: any) => ({
    "&:hover > td": {
      backgroundColor:
        theme.palette.mode === "dark"
          ? "rgba(148,163,184,0.08)" // subtle
          : "rgba(2,132,199,0.06)", // subtle sky tint
    },
  });

  const mergeRowProps: MRT_TableOptions<T>["muiTableBodyRowProps"] = (args) => {
    const resolvedProps =
      typeof table.muiTableBodyRowProps === "function"
        ? table.muiTableBodyRowProps(args)
        : table.muiTableBodyRowProps;
    const userProps = resolvedProps ?? {};
    const userSx = (userProps as { sx?: unknown })?.sx;
    const mergedSx = userSx ? [baseRowSx, userSx] : baseRowSx;
    return { ...userProps, sx: mergedSx };
  };

  return (
    <SectionCard className={cn("p-0", className)}>
      {(title || subtitle || headerRight) && (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/70 bg-white/70 px-6 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      )}

      <div className="p-4 sm:p-6">
        <MaterialReactTable
          {...table}
          enableTopToolbar={table.enableTopToolbar ?? false}
          enableColumnActions={table.enableColumnActions ?? false}
          enableGlobalFilter={table.enableGlobalFilter ?? false}
          enableDensityToggle={table.enableDensityToggle ?? false}
          enableFullScreenToggle={table.enableFullScreenToggle ?? false}
          // Keep wrapper styling subtle and theme-friendly:
          muiTablePaperProps={{
            elevation: 0,
            sx: (theme) => ({
              backgroundColor: "transparent",
              boxShadow: "none",
              borderRadius: 0,
              color: theme.palette.text.primary,
            }),
          }}
          muiTableContainerProps={{
            sx: (theme) => ({
              borderRadius: 0,
              border: `1px solid ${theme.palette.divider}`,
              overflow: "auto",
            }),
          }}
          muiTableHeadCellProps={{
            sx: (theme) => ({
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(15,23,42,0.65)" // slate-900-ish
                  : "rgba(255,255,255,0.9)", // airy white
              color: theme.palette.text.secondary,
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }),
          }}
          muiTableBodyRowProps={mergeRowProps}
          muiTableBodyCellProps={{
            sx: (theme) => ({
              fontSize: "0.875rem",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }),
          }}
          muiTopToolbarProps={{
            sx: (theme) => ({
              backgroundColor: "transparent",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }),
          }}
          muiBottomToolbarProps={{
            sx: (theme) => ({
              backgroundColor: "transparent",
              borderTop: `1px solid ${theme.palette.divider}`,
            }),
          }}
        />
      </div>
    </SectionCard>
  );
}


