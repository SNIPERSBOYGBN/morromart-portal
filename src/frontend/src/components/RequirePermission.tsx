import { useAuth } from "@/hooks/use-auth";
import { canAccess } from "@/lib/permissions";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect } from "react";

/**
 * Gates a route by permission level. Redirects unauthenticated users to the
 * login page and insufficiently-permissioned users to the positions page.
 */
export function RequirePermission({
  level,
  children,
}: {
  level: number;
  children: ReactNode;
}) {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (!canAccess(role, level)) {
      navigate({ to: "/" });
    }
  }, [user, role, isLoading, level, navigate]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        data-ocid="loading_state"
      >
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !canAccess(role, level)) return null;

  return <>{children}</>;
}
