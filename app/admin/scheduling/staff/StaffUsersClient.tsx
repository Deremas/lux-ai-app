"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import SearchablePhoneInput from "@/components/PhoneInputField";
import Badge from "@/components/scheduling/Badge";
import MrtCardTable from "@/components/scheduling/MrtCardTable";
import type { MRT_ColumnDef } from "material-react-table";

type Props = {
  orgId: string;
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
  role: "admin" | "staff";
  password: string;
};

const ROLE_OPTIONS: Array<{ value: StaffUserForm["role"]; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
];

const SELECT_CLASS_NAME =
  "mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

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

function formatJoinedDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString();
}

export default function StaffUsersClient({ orgId }: Props) {
  const { status } = useSession();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionSuccess, setMemberActionSuccess] = useState<string | null>(
    null
  );
  const [staffForm, setStaffForm] = useState<StaffUserForm>(emptyStaffForm());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrgMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const modalOpen = editorOpen || Boolean(deleteTarget);
  const isEditing = Boolean(editingUserId);

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
      supportedValuesOf?: (key: string) => string[];
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
    if (!modalOpen) return;
    const html = document.documentElement;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (status !== "authenticated" || !orgId) return;
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
    } catch {
      setMembersError("Failed to load staff users");
    } finally {
      setMembersLoading(false);
    }
  }

  function resetStaffForm(options?: { clearFeedback?: boolean }) {
    const clearFeedback = options?.clearFeedback ?? true;
    setEditingUserId(null);
    setStaffForm(emptyStaffForm());
    if (clearFeedback) {
      setMemberActionError(null);
      setMemberActionSuccess(null);
    }
  }

  function loadMemberForEdit(member: OrgMember) {
    setEditingUserId(member.userId);
    setStaffForm({
      name: member.name ?? "",
      email: member.email ?? "",
      phone: member.phone ?? "",
      timezone: member.timezone ?? "Europe/Luxembourg",
      role: member.role === "admin" ? "admin" : "staff",
      password: "",
    });
  }

  function openCreateEditor() {
    resetStaffForm();
    setEditorOpen(true);
  }

  function openEditEditor(member: OrgMember) {
    setMemberActionError(null);
    setMemberActionSuccess(null);
    loadMemberForEdit(member);
    setEditorOpen(true);
  }

  function handleEditorOpenChange(open: boolean) {
    setEditorOpen(open);
    if (!open) {
      resetStaffForm();
    }
  }

  function openDeleteDialog(member: OrgMember) {
    setMemberActionError(null);
    setMemberActionSuccess(null);
    setDeleteTarget(member);
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
  }

  async function handleCreateStaffUser() {
    if (!orgId) return;
    setMemberActionError(null);
    setMemberActionSuccess(null);

    const email = staffForm.email.trim().toLowerCase();
    const password = staffForm.password.trim();
    if (!email) {
      setMemberActionError("Email is required.");
      return;
    }
    if (!password || password.length < 8) {
      setMemberActionError("Temporary password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scheduling/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId,
          email,
          name: staffForm.name.trim(),
          phone: staffForm.phone.trim(),
          timezone: staffForm.timezone.trim(),
          role: staffForm.role,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberActionError(data?.error ?? "Failed to add staff user");
        return;
      }
      setMemberActionSuccess("Staff user created.");
      resetStaffForm({ clearFeedback: false });
      setEditorOpen(false);
      await refreshMembers();
    } catch {
      setMemberActionError("Failed to add staff user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStaffUser() {
    if (!orgId || !editingUserId) return;
    setMemberActionError(null);
    setMemberActionSuccess(null);

    const email = staffForm.email.trim().toLowerCase();
    if (!email) {
      setMemberActionError("Email is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/scheduling/admin/users/${editingUserId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orgId,
          name: staffForm.name.trim(),
          email,
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
      resetStaffForm({ clearFeedback: false });
      setEditorOpen(false);
      await refreshMembers();
    } catch {
      setMemberActionError("Failed to update staff user");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!orgId || !deleteTarget) return;
    setSubmitting(true);
    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      const res = await fetch(
        `/api/scheduling/admin/users/${deleteTarget.userId}?orgId=${orgId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMemberActionError(data?.error ?? "Failed to delete staff user");
        return;
      }
      setMemberActionSuccess("Staff user deleted.");
      if (editingUserId === deleteTarget.userId) {
        resetStaffForm({ clearFeedback: false });
        setEditorOpen(false);
      }
      setDeleteTarget(null);
      await refreshMembers();
    } catch {
      setMemberActionError("Failed to delete staff user");
    } finally {
      setSubmitting(false);
    }
  }

  const staffMembers = useMemo(
    () => members.filter((member) => member.role === "admin" || member.role === "staff"),
    [members]
  );

  const memberColumns = useMemo<MRT_ColumnDef<OrgMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Member",
        size: 280,
        Cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-semibold text-gray-900 dark:text-white">
              {row.original.name || "Unnamed user"}
            </div>
            <div className="truncate text-xs text-gray-500">
              {row.original.email || "No email"}
            </div>
            <div className="truncate text-xs text-gray-500">
              {row.original.phone || "No phone"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        size: 120,
        Cell: ({ row }) => (
          <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "timezone",
        header: "Timezone",
        size: 180,
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.original.timezone || "UTC"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        size: 120,
        Cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {formatJoinedDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 260,
        enableSorting: false,
        enableColumnFilter: false,
              enableColumnActions: true,
        Cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/scheduling/staff/${row.original.userId}`}>
                View
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditEditor(row.original)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openDeleteDialog(row.original)}
              disabled={submitting}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [submitting]
  );

  if (status !== "authenticated") {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sign in to manage staff users
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

  return (
    <div className="space-y-8">
      <div className="space-y-8">
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
            Scheduling Admin
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Staff users
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Add, edit, or remove staff who can manage scheduling.
          </p>
        </div>

        {membersError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {membersError}
          </div>
        )}

        {!modalOpen && memberActionError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {memberActionError}
          </div>
        )}

        {!modalOpen && memberActionSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {memberActionSuccess}
          </div>
        )}

        <div className="mt-8">
          <MrtCardTable
            title="Staff users"
            subtitle={
              staffMembers.length
                ? `${staffMembers.length} staff accounts`
                : "No staff users yet."
            }
            headerRight={
              <Button size="sm" onClick={openCreateEditor}>
                New staff user
              </Button>
            }
            table={{
              columns: memberColumns,
              data: staffMembers,
              enablePagination: true,
              enableSorting: true,
              enableColumnActions: true,
              enableColumnFilters: true,
              enableGlobalFilter: true,
              enableTopToolbar: true,
              enableDensityToggle: true,
              enableFullScreenToggle: true,
              enableColumnResizing: false,
              enableHiding: true,
              initialState: {
                pagination: { pageIndex: 0, pageSize: 10 },
                showGlobalFilter: true,
              },
              muiSearchTextFieldProps: {
                placeholder: "Search name, email, phone...",
              },
              state: { isLoading: membersLoading },
              renderEmptyRowsFallback: () => (
                <div className="p-4 text-sm text-gray-600">No staff users yet.</div>
              ),
            }}
          />
        </div>

        <Dialog open={editorOpen} onOpenChange={handleEditorOpenChange}>
          <DialogContent className="w-[min(760px,94vw)] max-w-2xl top-[calc(var(--site-header-height)+1rem)] max-h-[calc(100dvh-var(--site-header-height)-2rem)] translate-y-0 overflow-y-auto overscroll-contain rounded-2xl border border-white/70 bg-white/95 p-0 shadow-2xl backdrop-blur data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4 dark:border-slate-700/60 dark:bg-slate-900/90">
            <DialogHeader className="sticky top-0 z-10 space-y-2 border-b border-white/70 bg-white/95 px-6 pb-4 pt-5 pr-14 text-left backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/95">
              <DialogTitle>
                {isEditing ? "Edit staff user" : "Add staff user"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the staff profile, role, and scheduling timezone."
                  : "Create a new staff account without pushing the form under the page layout."}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-6 pt-4">
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Full name
                  </label>
                  <Input
                    value={staffForm.name}
                    onChange={(event) =>
                      setStaffForm((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
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
                    onChange={(event) =>
                      setStaffForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@company.com"
                    disabled={isEditing}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Phone
                  </label>
                  <SearchablePhoneInput
                    value={staffForm.phone}
                    onChange={(value) =>
                      setStaffForm((previous) => ({
                        ...previous,
                        phone: value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Timezone
                    </label>
                    <select
                      className={SELECT_CLASS_NAME}
                      value={staffForm.timezone}
                      onChange={(event) =>
                        setStaffForm((previous) => ({
                          ...previous,
                          timezone: event.target.value,
                        }))
                      }
                    >
                      {timezones.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Role
                    </label>
                    <select
                      className={SELECT_CLASS_NAME}
                      value={staffForm.role}
                      onChange={(event) =>
                        setStaffForm((previous) => ({
                          ...previous,
                          role: event.target.value as StaffUserForm["role"],
                        }))
                      }
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!isEditing && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Temporary password
                    </label>
                    <Input
                      type="password"
                      value={staffForm.password}
                      onChange={(event) =>
                        setStaffForm((previous) => ({
                          ...previous,
                          password: event.target.value,
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

                <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-2 border-t border-white/70 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/95">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEditorOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={isEditing ? handleUpdateStaffUser : handleCreateStaffUser}
                    disabled={submitting}
                  >
                    {submitting
                      ? isEditing
                        ? "Saving..."
                        : "Creating..."
                      : isEditing
                        ? "Save changes"
                        : "Add staff user"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open && !submitting) {
              closeDeleteDialog();
            }
          }}
        >
          <AlertDialogContent className="w-[min(560px,92vw)] max-w-lg top-[calc(var(--site-header-height)+1rem)] max-h-[calc(100dvh-var(--site-header-height)-2rem)] translate-y-0 overflow-y-auto overscroll-contain rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur data-[state=closed]:slide-out-to-top-4 data-[state=open]:slide-in-from-top-4 dark:border-slate-700/60 dark:bg-slate-900/90">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete staff user</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the user from the organization. Continue only if that
                staff account should no longer access scheduling.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {memberActionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {memberActionError}
              </div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              <p className="font-semibold">
                {deleteTarget?.name || deleteTarget?.email || "Unnamed user"}
              </p>
              {deleteTarget?.email && <p className="mt-1">{deleteTarget.email}</p>}
              {deleteTarget?.phone && <p className="mt-1">{deleteTarget.phone}</p>}
              <p className="mt-1">
                Role: {deleteTarget?.role || "staff"}
                {deleteTarget?.timezone ? `, timezone: ${deleteTarget.timezone}` : ""}
              </p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirmed}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
