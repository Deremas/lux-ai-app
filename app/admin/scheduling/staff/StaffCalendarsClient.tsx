"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Badge from "@/components/scheduling/Badge";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import type { MRT_ColumnDef } from "material-react-table";

type Props = {
  orgId: string;
};

type StaffCalendar = {
  id: string;
  orgId: string;
  staffUserId: string;
  isActive: boolean;
  workingHoursJson: string | null;
};

type FormState = {
  staffUserId: string;
  isActive: boolean;
  workingHoursJson: string;
};

type OrgMember = {
  id: string;
  orgId: string;
  userId: string;
  role: "admin" | "staff" | "customer";
  createdAt: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  timezone: string | null;
};

const DEFAULT_WORKING_HOURS = JSON.stringify(
  {
    timezone: "Europe/Luxembourg",
    slotStepMin: 60,
    bufferMin: 0,
    week: {
      mon: [{ start: "08:00", end: "17:00" }],
      tue: [{ start: "08:00", end: "17:00" }],
      wed: [{ start: "08:00", end: "17:00" }],
      thu: [{ start: "08:00", end: "17:00" }],
      fri: [{ start: "08:00", end: "17:00" }],
      sat: [],
      sun: [],
    },
  },
  null,
  2
);

function emptyCalendarForm(): FormState {
  return {
    staffUserId: "",
    isActive: true,
    workingHoursJson: DEFAULT_WORKING_HOURS,
  };
}


export default function StaffCalendarsClient({ orgId }: Props) {
  const { status } = useSession();
  const [items, setItems] = useState<StaffCalendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyCalendarForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [orgDefaultsJson, setOrgDefaultsJson] = useState<string | null>(null);
  const [orgDefaultsLoading, setOrgDefaultsLoading] = useState(false);
  const [orgDefaultsError, setOrgDefaultsError] = useState<string | null>(null);


  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/scheduling/admin/staff-calendars?orgId=${orgId}`, {
      cache: "no-store",
    })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setError(data?.error ?? "Failed to load staff calendars");
          return;
        }
        setItems((data?.items ?? []) as StaffCalendar[]);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load staff calendars");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setOrgDefaultsLoading(true);
    setOrgDefaultsError(null);

    fetch(`/api/scheduling/admin/settings?orgId=${orgId}`, {
      cache: "no-store",
    })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setOrgDefaultsError(data?.error ?? "Failed to load org defaults");
          return;
        }
        setOrgDefaultsJson(data?.settings?.workingHoursJson ?? null);
      })
      .catch(() => {
        if (!cancelled) setOrgDefaultsError("Failed to load org defaults");
      })
      .finally(() => {
        if (!cancelled) setOrgDefaultsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orgId) return;
    let cancelled = false;
    setMembersError(null);

    fetch(`/api/scheduling/admin/org-members?orgId=${orgId}`, {
      cache: "no-store",
    })
      .then(async (res) => ({
        ok: res.ok,
        data: await res.json().catch(() => ({})),
      }))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setMembersError(data?.error ?? "Failed to load staff users");
          return;
        }
        setMembers((data?.items ?? []) as OrgMember[]);
      })
      .catch(() => {
        if (!cancelled) setMembersError("Failed to load staff users");
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  function resetCalendarForm() {
    setForm(emptyCalendarForm());
    setEditingId(null);
  }

  function loadCalendarForEdit(item: StaffCalendar) {
    setForm({
      staffUserId: item.staffUserId,
      isActive: item.isActive,
      workingHoursJson: item.workingHoursJson ?? DEFAULT_WORKING_HOURS,
    });
    setEditingId(item.staffUserId);
  }

  async function handleSaveCalendar() {
    if (!orgId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      orgId,
      staffUserId: form.staffUserId.trim(),
      isActive: form.isActive,
      workingHoursJson: form.workingHoursJson.trim(),
    };

    try {
      const res = await fetch(
        editingId
          ? `/api/scheduling/admin/staff-calendars/${editingId}`
          : "/api/scheduling/admin/staff-calendars",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save staff calendar");
        return;
      }

      setSuccess(editingId ? "Staff calendar updated." : "Staff calendar created.");
      resetCalendarForm();
      const refetch = await fetch(
        `/api/scheduling/admin/staff-calendars?orgId=${orgId}`,
        { cache: "no-store" }
      );
      const refetchData = await refetch.json().catch(() => ({}));
      setItems((refetchData?.items ?? []) as StaffCalendar[]);
    } catch {
      setError("Failed to save staff calendar");
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyOrgDefaults() {
    if (!orgId) return;
    if (!orgDefaultsJson) {
      setError("Set org default working hours in Settings first.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        "/api/scheduling/admin/staff-calendars/apply-defaults",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orgId,
            workingHoursJson: orgDefaultsJson,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to apply org defaults");
        return;
      }
      setSuccess("Org defaults applied to all staff calendars.");
      const refetch = await fetch(
        `/api/scheduling/admin/staff-calendars?orgId=${orgId}`,
        { cache: "no-store" }
      );
      const refetchData = await refetch.json().catch(() => ({}));
      setItems((refetchData?.items ?? []) as StaffCalendar[]);
    } catch {
      setError("Failed to apply org defaults");
    } finally {
      setSaving(false);
    }
  }

  const staffMembers = useMemo(
    () => members.filter((m) => ["admin", "staff"].includes(m.role)),
    [members]
  );
  const staffOptions = staffMembers;

  const staffLabel = (member: OrgMember) => {
    const name = member.name?.trim();
    const email = member.email?.trim();
    if (name && email) return `${name} — ${email} (${member.role})`;
    if (email) return `${email} (${member.role})`;
    return `${member.userId} (${member.role})`;
  };

  const staffNameById = useMemo(() => {
    return staffMembers.reduce<Record<string, string>>((acc, member) => {
      acc[member.userId] = staffLabel(member);
      return acc;
    }, {});
  }, [staffMembers]);

  const calendarColumns = useMemo<MRT_ColumnDef<StaffCalendar>[]>(
    () => [
      {
        accessorKey: "staffUserId",
        header: "Staff",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900 dark:text-white">
              {staffNameById[row.original.staffUserId] ?? row.original.staffUserId}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        Cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => loadCalendarForEdit(row.original)}>
            Edit
          </Button>
        ),
      },
    ],
    [staffNameById]
  );

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage staff calendars
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Admin access is required.
          </p>
          <Button className="mt-6" onClick={() => signIn()}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const calendarDisabled =
    !form.staffUserId.trim() || !form.workingHoursJson.trim();

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Staff calendars
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Manage working hours, buffers, and active staff.
          </p>
        </div>

        {loading && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            Loading staff calendars...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <MrtCardTable
            title="Staff calendars"
            subtitle={items.length ? `${items.length} calendars` : "No staff calendars yet."}
            table={{
              columns: calendarColumns,
              data: items,
              enablePagination: false,
              enableSorting: false,
              enableColumnActions: true,
              enableColumnFilters: false,
              enableGlobalFilter: false,
              enableDensityToggle: true,
              enableFullScreenToggle: true,
              enableColumnResizing: false,
              enableHiding: true,
              state: { isLoading: loading },
              renderEmptyRowsFallback: () => (
                <div className="p-4 text-sm text-gray-600">No staff calendars yet.</div>
              ),
            }}
          />

          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? "Edit staff calendar" : "Add staff calendar"}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Staff user
                </label>
                {staffOptions.length > 0 ? (
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={form.staffUserId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        staffUserId: e.target.value,
                      }))
                    }
                    disabled={Boolean(editingId)}
                  >
                    <option value="">Select a staff user</option>
                    {staffOptions.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {staffLabel(member)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={form.staffUserId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        staffUserId: e.target.value,
                      }))
                    }
                    placeholder="UUID"
                    disabled={Boolean(editingId)}
                  />
                )}
                {staffOptions.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Add staff users first to enable the dropdown.
                  </p>
                )}
                {membersError && (
                  <p className="mt-1 text-xs text-red-600">{membersError}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Active
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Working hours JSON
                </label>
                <Textarea
                  className="mt-2 min-h-[220px] font-mono text-xs"
                  value={form.workingHoursJson}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      workingHoursJson: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetCalendarForm}>
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyOrgDefaults}
                  disabled={saving || orgDefaultsLoading || !orgDefaultsJson}
                >
                  Apply org defaults
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveCalendar}
                  disabled={saving || calendarDisabled}
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Applying org defaults replaces every staff calendar with the org
                working hours.
              </p>
              {orgDefaultsError && (
                <p className="text-xs text-red-600">{orgDefaultsError}</p>
              )}
              {!orgDefaultsJson && !orgDefaultsLoading && (
                <p className="text-xs text-gray-500">
                  Set org defaults in Settings to enable one-click apply.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
