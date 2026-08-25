import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { FaDiscord } from "react-icons/fa";

export function LoginPage() {
  const { user, isLoading, login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  // Already signed in — send to the portal.
  useEffect(() => {
    if (!isLoading && user) {
      navigate({ to: "/" });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elevated">
            <FaDiscord className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Morrmart Applications Portal
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in with your Discord account to browse positions and manage
            applications.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-elevated">
          <Button
            className="w-full"
            size="lg"
            onClick={() => login()}
            disabled={isLoading || isLoggingIn}
            data-ocid="discord_login_button"
          >
            {isLoggingIn ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FaDiscord className="size-4" />
            )}
            {isLoggingIn ? "Redirecting to Discord…" : "Continue with Discord"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By continuing you agree to use your Discord identity to access this
            portal.
          </p>
        </div>
      </div>
    </div>
  );
}
