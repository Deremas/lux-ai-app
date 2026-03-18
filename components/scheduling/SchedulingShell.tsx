"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ADMIN_SCHEDULING_NAV,
  CLIENT_SCHEDULING_NAV,
} from "@/components/scheduling/scheduling-nav";

type SchedulingShellProps = {
  variant: "admin" | "client";
  children: React.ReactNode;
  canViewAdmin?: boolean;
};

const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_DESKTOP = 1024;

function MobileMenuBar() {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-expanded={isOpen}
      className="flex h-12 w-full items-center gap-2 border-b border-white/70 bg-white/85 px-3 text-left shadow-sm backdrop-blur transition hover:bg-white/95 active:bg-white/90 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:bg-slate-900/90"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 shadow-sm ring-1 ring-slate-200/70 dark:text-slate-200 dark:ring-slate-700/60">
        <PanelLeft className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {isOpen ? "Close menu" : "Menu"}
      </span>
      <ChevronRight className="ml-auto h-4 w-4 text-slate-400 dark:text-slate-500" />
    </button>
  );
}

function SidebarToggleButton() {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

export default function SchedulingShell({
  variant,
  children,
  canViewAdmin = false,
}: SchedulingShellProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(true);
  const modeRef = React.useRef<"desktop" | "mid" | "mobile">("desktop");
  const sections =
    variant === "admin" ? ADMIN_SCHEDULING_NAV : CLIENT_SCHEDULING_NAV;

  const profileName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    "Guest";
  const profileFirstName = profileName.split(" ")[0] || profileName;
  const profileInitials = profileName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const profileHref = "/scheduling/profile";
  const settingsHref =
    variant === "admin" ? "/admin/scheduling/settings" : null;

  React.useEffect(() => {
    const getMode = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINT_MOBILE) return "mobile";
      if (width < BREAKPOINT_DESKTOP) return "mid";
      return "desktop";
    };

    const applyMode = () => {
      const next = getMode();
      if (next === modeRef.current) return;
      modeRef.current = next;
      if (next === "desktop") setOpen(true);
      if (next === "mid") setOpen(false);
    };

    applyMode();
    window.addEventListener("resize", applyMode);
    return () => window.removeEventListener("resize", applyMode);
  }, []);

  const isActive = React.useCallback(
    (item: { href: string; match?: "exact" | "prefix" }) => {
      const { href, match } = item;
      if (match === "exact") {
        return pathname === href;
      }
      if (href === "/scheduling" || href === "/admin/scheduling") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const handleSidebarWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    [],
  );

  const handleSidebarTouchMove = React.useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      event.stopPropagation();
    },
    [],
  );

  function ScrollLock() {
    const { openMobile } = useSidebar();

    React.useEffect(() => {
      if (!openMobile) {
        document.body.removeAttribute("data-sidebar-open");
        return;
      }
      const prev = document.body.style.overflow;
      const html = document.documentElement;
      const prevHtml = html.style.overflow;
      document.body.style.overflow = "hidden";
      html.style.overflow = "hidden";
      document.body.setAttribute("data-sidebar-open", "true");
      return () => {
        document.body.style.overflow = prev;
        html.style.overflow = prevHtml;
        document.body.removeAttribute("data-sidebar-open");
      };
    }, [openMobile]);

    return null;
  }

  const hideShell = status !== "authenticated";

  if (hideShell) {
    return (
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      defaultOpen
      className="scheduling-shell flex-1 min-h-0 min-w-0 overflow-x-hidden bg-transparent"
    >
      <ScrollLock />
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur top-[var(--site-header-height)] h-[calc(100svh-var(--site-header-height))] overscroll-y-contain md:!sticky md:!top-[var(--site-header-height)] md:!bottom-auto md:!inset-auto md:!h-[calc(100svh-var(--site-header-height))] shadow-[0_22px_60px_-45px_rgba(15,23,42,0.4)]"
      >
        <SidebarHeader className="gap-3 border-b border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
            <div className="flex items-center justify-between gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-2">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border border-sidebar-border bg-white/80 text-primary-700 shadow-sm backdrop-blur dark:bg-slate-900/70 dark:text-slate-200",
                    "group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                  )}
                >
                  <Calendar className="h-4 w-4" />
                </span>
                <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold text-sidebar-foreground">
                    Scheduling
                  </span>
                  <span className="text-xs text-sidebar-foreground/70">
                    {variant === "admin" ? "Admin" : "Client"}
                  </span>
                </div>
              </div>
            <SidebarToggleButton />
          </div>
        </SidebarHeader>
        <SidebarContent
          className="touch-pan-y overscroll-y-contain scrollbar-gutter-stable"
          onWheel={handleSidebarWheel}
          onWheelCapture={handleSidebarWheel}
          onTouchMove={handleSidebarTouchMove}
          onTouchMoveCapture={handleSidebarTouchMove}
        >
          {sections.map((section) => (
            <SidebarGroup key={section.label ?? "section"}>
              {section.label ? (
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              ) : null}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item)}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarSeparator />
      <SidebarFooter className="gap-3 p-3">
        {variant === "admin" && (
          <Link
            href="/scheduling"
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar/70 px-3 py-2 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent",
              "group-data-[collapsible=icon]:px-2",
            )}
          >
            <User className="h-4 w-4 text-sidebar-foreground/70" />
            <span className="group-data-[collapsible=icon]:hidden">
              View as user
            </span>
          </Link>
        )}
        {variant === "client" && canViewAdmin && (
          <Link
            href="/admin/scheduling"
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar/70 px-3 py-2 text-sm font-semibold text-sidebar-foreground transition hover:bg-sidebar-accent",
              "group-data-[collapsible=icon]:px-2",
            )}
          >
            <Shield className="h-4 w-4 text-sidebar-foreground/70" />
            <span className="group-data-[collapsible=icon]:hidden">
              View as admin
            </span>
          </Link>
        )}
        <div className="flex items-center justify-between text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          <Link href="/contact" className="hover:text-sidebar-foreground">
            Contact / audit
          </Link>
          <Link href="/" className="hover:text-sidebar-foreground">
            Back to main site
          </Link>
        </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar/70 p-2 text-left transition hover:bg-sidebar-accent",
                  "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2",
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {profileInitials}
                </div>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <div className="truncate text-sm font-semibold text-sidebar-foreground">
                    {profileFirstName}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align="start"
              sideOffset={8}
              className="w-56 rounded-xl border border-sidebar-border bg-popover p-2 text-popover-foreground shadow-lg"
            >
              {session?.user ? (
                <>
                  <DropdownMenuItem asChild className="gap-2 rounded-lg px-3 py-2 text-sm font-medium">
                    <Link href={profileHref}>
                      <User className="h-4 w-4 text-sidebar-foreground/70" />
                      My profile
                    </Link>
                  </DropdownMenuItem>
                  {settingsHref && (
                    <>
                      <DropdownMenuItem asChild className="gap-2 rounded-lg px-3 py-2 text-sm font-medium">
                        <Link href={settingsHref}>
                          <Settings className="h-4 w-4 text-sidebar-foreground/70" />
                          Scheduling settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    className="gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 focus:text-red-600"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild className="gap-2 rounded-lg px-3 py-2 text-sm font-medium">
                  <Link href="/auth/signin">
                    <User className="h-4 w-4 text-sidebar-foreground/70" />
                    Sign in
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 w-0 flex-1 bg-transparent">
        <div className="fixed left-0 right-0 top-[var(--site-header-height)] z-40 lg:hidden">
          <MobileMenuBar />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden pb-12 pt-14 lg:pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
