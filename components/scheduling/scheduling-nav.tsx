import {
  BarChart3,
  Bell,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  LayoutDashboard,
  Shield,
  Users,
  User,
  Settings,
  XCircle,
} from "lucide-react";

export type SchedulingNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

export type SchedulingNavSection = {
  label?: string;
  items: SchedulingNavItem[];
};

export const ADMIN_SCHEDULING_NAV: SchedulingNavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin/scheduling",
        icon: LayoutDashboard,
      },
      {
        label: "Analytics",
        href: "/admin/scheduling/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Scheduling",
    items: [
      {
        label: "Bookings",
        href: "/admin/scheduling/bookings",
        icon: ClipboardList,
      },
      {
        label: "Calendar",
        href: "/admin/scheduling/calendar",
        icon: CalendarDays,
      },
      {
        label: "Meeting Types",
        href: "/admin/scheduling/meeting-types",
        icon: Clock,
      },
      {
        label: "Blocked Time",
        href: "/admin/scheduling/blocked",
        icon: XCircle,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Staff",
        href: "/admin/scheduling/staff",
        icon: Users,
      },
      {
        label: "Customers",
        href: "/admin/scheduling/customers",
        icon: User,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Notifications",
        href: "/admin/scheduling/notifications",
        icon: Bell,
      },
      {
        label: "Audit Log",
        href: "/admin/scheduling/audit",
        icon: Shield,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        label: "Settings",
        href: "/admin/scheduling/settings",
        icon: Settings,
      },
      {
        label: "Working Hours",
        href: "/admin/scheduling/settings#working-hours",
        icon: Clock,
      },
    ],
  },
];

export const CLIENT_SCHEDULING_NAV: SchedulingNavSection[] = [
  {
    label: "Scheduling",
    items: [
      {
        label: "Book a session",
        href: "/scheduling",
        icon: Calendar,
      },
      {
        label: "Calendar",
        href: "/scheduling/calendar",
        icon: CalendarDays,
      },
    ],
  },
  {
    label: "Your Bookings",
    items: [
      {
        label: "My Bookings",
        href: "/scheduling/my",
        icon: ClipboardList,
      },
      {
        label: "Profile",
        href: "/scheduling/profile",
        icon: User,
      },
    ],
  },
];
