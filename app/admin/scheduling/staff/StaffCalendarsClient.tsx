"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SearchablePhoneInput from "@/components/PhoneInputField";
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

type StaffUserForm = {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  role: OrgMember["role"];
  password: string;
};

const ROLE_OPTIONS: OrgMember["role"][] = ["admin", "staff", "customer"];

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

function emptyStaffForm(): StaffUserForm {
  return {
    name: "",
    email: "",
    phone: "",
    timezone: "Europe/Luxembourg",
    role: "staff",
    password: "",
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
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [orgDefaultsJson, setOrgDefaultsJson] = useState<string | null>(null);
  const [orgDefaultsLoading, setOrgDefaultsLoading] = useState(false);
  const [orgDefaultsError, setOrgDefaultsError] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionSuccess, setMemberActionSuccess] = useState<string | null>(
    null
  );
  const [staffForm, setStaffForm] = useState<StaffUserForm>(emptyStaffForm());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);


  const timezones = useMemo<string[]>(() => {
    const fallback = [
      "UTC",
      "Europe/Luxembourg",
      "Europe/Paris",
      "Africa/Addis_Ababa",
      "America/New_York",
      "Asia/Dubai",
      "Asia/Singapore",
    ];
    const anyIntl = Intl as unknown as {
      supportedValuesOf?: (k: string) => string[];
    };
    if (typeof anyIntl?.supportedValuesOf === "function") {
      try {
        const list = anyIntl.supportedValuesOf("timeZone");
        return list.length ? list : fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }, []);

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
    setMembersLoading(true);
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
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId, status]);

  async function refreshMembers() {
    if (!orgId) return;
    setMembersLoading(true);
    setMembersError(null);
    try {
      const res = await fetch(`/api/scheduling/admin/org-members?orgId=${orgId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMembersError(data?.error ?? "Failed to load staff users");
        return;
      }
      setMembers((data?.items ?? []) as OrgMember[]);
    } finally {
      setMembersLoading(false);
    }
  }

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

  function loadMemberForEdit(member: OrgMember) {
    setEditingUserId(member.userId);
    setStaffForm({
      name: member.name ?? "",
      email: member.email ?? "",
      phone: member.phone ?? "",
      timezone: member.timezone ?? "Europe/Luxembourg",
      role: member.role,
      password: "",
    });
  }

  function resetStaffForm() {
    setEditingUserId(null);
    setStaffForm(emptyStaffForm());
  }

  async function handleCreateStaffUser() {
    if (!orgId) return;
    setMemberActionError(null);
    setMemberActionSuccess(null);

    if (!staffForm.email.trim()) {
      setMemberActionError("Email is required.");
      return;
    }
    if (!staffForm.password.trim()) {
      setMemberActionError("Temporary password is required.");
      return;
    }

    try {
      const res = await fetch("/api/scheduling/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId,
          email: staffForm.email.trim(),
          name: staffForm.name.trim(),
          phone: staffForm.phone.trim(),
          timezone: staffForm.timezone.trim(),
          role: staffForm.role,
          password: staffForm.password.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberActionError(data?.error ?? "Failed to add staff user");
        return;
      }
      setMemberActionSuccess("Staff user created.");
      resetStaffForm();
      await refreshMembers();
    } catch {
      setMemberActionError("Failed to add staff user");
    }
  }

  async function handleUpdateStaffUser() {
    if (!orgId || !editingUserId) return;
    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      const res = await fetch(`/api/scheduling/admin/users/${editingUserId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId,
          name: staffForm.name.trim(),
          email: staffForm.email.trim(),
          phone: staffForm.phone.trim(),
          timezone: staffForm.timezone.trim(),
          role: staffForm.role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberActionError(data?.error ?? "Failed to update staff user");
        return;
      }
      setMemberActionSuccess("Staff user updated.");
      resetStaffForm();
      await refreshMembers();
    } catch {
      setMemberActionError("Failed to update staff user");
    }
  }

  async function handleDeleteMember(userId: string) {
    if (!orgId) return;
    if (!confirm("Delete this user and remove them from the org?")) return;
    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      const res = await fetch(
        `/api/scheduling/admin/users/${userId}?orgId=${orgId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberActionError(data?.error ?? "Failed to delete staff user");
        return;
      }
      setMemberActionSuccess("Staff user deleted.");
      await refreshMembers();
    } catch {
      setMemberActionError("Failed to delete staff user");
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

  const memberColumns = useMemo<MRT_ColumnDef<OrgMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900 dark:text-white">
              {row.original.name || "Unnamed user"}
            </div>
            <div className="truncate text-xs text-gray-500">
              {row.original.email || "—"}
            </div>
            {row.original.phone && (
              <div className="text-xs text-gray-500">{row.original.phone}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        Cell: ({ row }) => (
          <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/scheduling/staff/${row.original.userId}`}>
                View
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => loadMemberForEdit(row.original)}>
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDeleteMember(row.original.userId)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [members]
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
              enableColumnActions: false,
              enableColumnFilters: false,
              enableGlobalFilter: false,
              enableDensityToggle: false,
              enableFullScreenToggle: false,
              enableColumnResizing: false,
              enableHiding: false,
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
                    Add staff or admin users below to enable the dropdown.
                  </p>
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

        <div
          id="staff-users"
          className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Staff users
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Profiles & roles
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Add, edit, or remove staff who can manage scheduling.
              </p>
            </div>

            {membersError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {membersError}
              </div>
            )}

            <MrtCardTable
              title="Staff users"
              subtitle={
                staffMembers.length
                  ? `${staffMembers.length} users`
                  : "No staff users yet."
              }
              table={{
                columns: memberColumns,
                data: staffMembers,
                enablePagination: false,
                enableSorting: false,
                enableColumnActions: false,
                enableColumnFilters: false,
                enableGlobalFilter: false,
                enableDensityToggle: false,
                enableFullScreenToggle: false,
                enableColumnResizing: false,
                enableHiding: false,
                state: { isLoading: membersLoading },
                renderEmptyRowsFallback: () => (
                  <div className="p-4 text-sm text-gray-600">No staff users yet.</div>
                ),
              }}
            />
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingUserId ? "Edit staff user" : "Add staff user"}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Full name
                </label>
                <Input
                  value={staffForm.name}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Email
                </label>
                <Input
                  value={staffForm.email}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="name@company.com"
                  disabled={Boolean(editingUserId)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Phone
                </label>
                <SearchablePhoneInput
                  value={staffForm.phone}
                  onChange={(value) =>
                    setStaffForm((prev) => ({ ...prev, phone: value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Timezone
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={staffForm.timezone}
                  onChange={(e) =>
                    setStaffForm((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Role
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={staffForm.role}
                  onChange={(e) =>
                    setStaffForm((prev) => ({
                      ...prev,
                      role: e.target.value as OrgMember["role"],
                    }))
                  }
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {!editingUserId && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Temporary password
                  </label>
                  <Input
                    type="password"
                    value={staffForm.password}
                    onChange={(e) =>
                      setStaffForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Min 8 characters"
                  />
                </div>
              )}

              {memberActionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {memberActionError}
                </div>
              )}
              {memberActionSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {memberActionSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                {editingUserId ? (
                  <>
                    <Button type="button" variant="outline" onClick={resetStaffForm}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleUpdateStaffUser}>
                      Save changes
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={handleCreateStaffUser}>
                    Add staff user
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
