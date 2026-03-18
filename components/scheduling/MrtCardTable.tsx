import * as React from "react";
import {
  MaterialReactTable,
  type MRT_RowData,
  type MRT_TableOptions,
} from "material-react-table";

import SectionCard from "@/components/scheduling/SectionCard";
import { cn } from "@/lib/utils";

type MrtCardTableProps<T extends MRT_RowData> = {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  className?: string;
  table: MRT_TableOptions<T>;
};

function mergeResolvedMuiProps(base: any, override: any) {
  const baseProps = base ?? {};
  const overrideProps = override ?? {};
  const mergedClassName = cn(baseProps.className, overrideProps.className);
  const mergedSx =
    baseProps.sx && overrideProps.sx
      ? [baseProps.sx, overrideProps.sx]
      : overrideProps.sx ?? baseProps.sx;

  return {
    ...baseProps,
    ...overrideProps,
    ...(mergedClassName ? { className: mergedClassName } : {}),
    ...(mergedSx ? { sx: mergedSx } : {}),
  };
}

function mergeMuiProps(base: any, override: any) {
  if (!base && !override) return undefined;
  if (typeof base !== "function" && typeof override !== "function") {
    return mergeResolvedMuiProps(base, override);
  }

  return (...args: any[]) =>
    mergeResolvedMuiProps(
      typeof base === "function" ? base(...args) : base,
      typeof override === "function" ? override(...args) : override
    );
}

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
          ? "rgba(148,163,184,0.08)"
          : "rgba(2,132,199,0.06)",
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

  const tablePaperProps = mergeMuiProps(
    {
      elevation: 0,
      sx: (theme: any) => ({
        backgroundColor: "transparent",
        boxShadow: "none",
        borderRadius: 0,
        color: theme.palette.text.primary,
      }),
    },
    table.muiTablePaperProps
  );

  const tableContainerProps = mergeMuiProps(
    {
      sx: (theme: any) => ({
        borderRadius: 0,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "auto",
      }),
    },
    table.muiTableContainerProps
  );

  const tableHeadCellProps = mergeMuiProps(
    {
      sx: (theme: any) => ({
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(15,23,42,0.72)"
            : "rgba(248,250,252,0.94)",
        color: theme.palette.text.secondary,
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
    },
    table.muiTableHeadCellProps
  );

  const tableBodyCellProps = mergeMuiProps(
    {
      sx: (theme: any) => ({
        fontSize: "0.875rem",
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
    },
    table.muiTableBodyCellProps
  );

  const topToolbarProps = mergeMuiProps(
    {
      sx: (theme: any) => ({
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(15,23,42,0.28)"
            : "rgba(248,250,252,0.88)",
        borderBottom: `1px solid ${theme.palette.divider}`,
        minHeight: "3.5rem",
      }),
    },
    table.muiTopToolbarProps
  );

  const bottomToolbarProps = mergeMuiProps(
    {
      sx: (theme: any) => ({
        backgroundColor: "transparent",
        borderTop: `1px solid ${theme.palette.divider}`,
      }),
    },
    table.muiBottomToolbarProps
  );

  const searchTextFieldProps = mergeMuiProps(
    {
      placeholder: "Search table...",
      size: "small",
      variant: "outlined",
      sx: {
        minWidth: { xs: "100%", sm: 260 },
      },
    },
    table.muiSearchTextFieldProps
  );

  return (
    <SectionCard className={cn("p-0", className)}>
      {(title || subtitle || headerRight) && (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/70 bg-white/70 px-6 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60">
          <div className="min-w-0">
            {title ? (
              <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      )}

      <div className="p-4 sm:p-6">
        <MaterialReactTable
          {...table}
          enableTopToolbar={table.enableTopToolbar ?? true}
          enableColumnActions={table.enableColumnActions ?? true}
          enableGlobalFilter={table.enableGlobalFilter ?? false}
          enableDensityToggle={table.enableDensityToggle ?? true}
          enableFullScreenToggle={table.enableFullScreenToggle ?? true}
          enableHiding={table.enableHiding ?? true}
          enableColumnOrdering={table.enableColumnOrdering ?? true}
          enableStickyHeader={table.enableStickyHeader ?? true}
          positionToolbarAlertBanner={
            table.positionToolbarAlertBanner ?? "bottom"
          }
          muiTablePaperProps={tablePaperProps}
          muiTableContainerProps={tableContainerProps}
          muiTableHeadCellProps={tableHeadCellProps}
          muiTableBodyRowProps={mergeRowProps}
          muiTableBodyCellProps={tableBodyCellProps}
          muiTopToolbarProps={topToolbarProps}
          muiBottomToolbarProps={bottomToolbarProps}
          muiSearchTextFieldProps={searchTextFieldProps}
        />
      </div>
    </SectionCard>
  );
}
