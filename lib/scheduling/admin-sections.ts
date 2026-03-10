export type AdminSectionNavItem = {
  label: string;
  href: string;
};

export const ADMIN_SECTION_NAV: AdminSectionNavItem[] = [
  { label: "Bookings", href: "/admin/scheduling/bookings" },
  { label: "Booking approvals", href: "/admin/scheduling/approvals" },
  { label: "Calendar", href: "/admin/scheduling/calendar" },
  { label: "Analytics", href: "/admin/scheduling/analytics" },
  { label: "Settings", href: "/admin/scheduling/settings" },
  { label: "Meeting types", href: "/admin/scheduling/meeting-types" },
  { label: "Staff", href: "/admin/scheduling/staff" },
  { label: "Customers", href: "/admin/scheduling/customers" },
  { label: "Blocked time", href: "/admin/scheduling/blocked" },
  { label: "Notifications", href: "/admin/scheduling/notifications" },
  { label: "Audit log", href: "/admin/scheduling/audit" },
];
