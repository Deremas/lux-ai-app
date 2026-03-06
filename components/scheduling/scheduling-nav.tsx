import {
  BarChart3,
  Bell,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  CreditCard,
  LayoutDashboard,
  Mail,
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
  match?: "exact" | "prefix";
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
        label: "General",
        href: "/admin/scheduling/settings",
        icon: Settings,
        match: "exact",
      },
      {
        label: "Booking policies",
        href: "/admin/scheduling/settings/booking",
        icon: ClipboardList,
      },
      {
        label: "Payments",
        href: "/admin/scheduling/settings/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    label: "Integrations",
    items: [
      {
        label: "Overview",
        href: "/admin/scheduling/integrations",
        icon: Settings,
        match: "exact",
      },
      {
        label: "Stripe",
        href: "/admin/scheduling/integrations/stripe",
        icon: CreditCard,
      },
      {
        label: "WhatsApp",
        href: "/admin/scheduling/integrations/whatsapp",
        icon: Bell,
      },
      {
        label: "Calendar",
        href: "/admin/scheduling/integrations/calendar",
        icon: CalendarDays,
      },
      {
        label: "Email",
        href: "/admin/scheduling/integrations/email",
        icon: Mail,
      },
    ],
  },
  {
    label: "Notifications",
    items: [
      {
        label: "Settings",
        href: "/admin/scheduling/notifications",
        icon: Bell,
        match: "exact",
      },
      {
        label: "Templates",
        href: "/admin/scheduling/notifications/templates",
        icon: Mail,
      },
      {
        label: "Logs",
        href: "/admin/scheduling/notifications/logs",
        icon: Bell,
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
