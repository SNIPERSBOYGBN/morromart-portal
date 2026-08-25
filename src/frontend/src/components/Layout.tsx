import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  canViewApplications,
  canViewDepartments,
  canViewReview,
  canViewSettings,
  canViewStaff,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  visible: boolean;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, role, logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    {
      label: "Positions",
      to: "/",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: "Applications",
      to: "/applications",
      icon: ClipboardList,
      visible: canViewApplications(role),
    },
    {
      label: "Departments",
      to: "/departments",
      icon: Building2,
      visible: canViewDepartments(role),
    },
    {
      label: "Staff",
      to: "/staff",
      icon: Users,
      visible: canViewStaff(role),
    },
    {
      label: "Review",
      to: "/review",
      icon: ShieldCheck,
      visible: canViewReview(role),
    },
    {
      label: "Settings",
      to: "/settings",
      icon: Settings,
      visible: canViewSettings(role),
    },
  ];

  const visibleNav = navItems.filter((item) => item.visible);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold leading-tight">
              Morrmart
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Applications Portal
            </p>
          </div>
        </div>

        <nav
          className="flex-1 space-y-1 overflow-y-auto p-3"
          data-ocid="sidebar_nav"
        >
          {visibleNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
              data-ocid="nav_link"
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {user?.username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user?.username ?? "Guest"}
              </p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {role ?? "Signed out"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoggingOut}
            data-ocid="logout_button"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-subtle">
          <div>
            <h1 className="font-display text-lg font-bold">
              Morrmart Applications Portal
            </h1>
            <p className="text-xs text-muted-foreground">
              Recruitment command center
            </p>
          </div>
        </header>

        <main className="flex-1 bg-background p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <AnnouncementBanner />
            {children}
          </div>
        </main>

        <footer className="border-t border-border bg-card px-6 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
          .
        </footer>
      </div>
    </div>
  );
}
