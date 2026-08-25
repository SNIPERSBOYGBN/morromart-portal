"use client";

import { type Role, type Session, createActor } from "@/backend";
import {
  completeDiscordLogin,
  loginWithDiscord,
  logout as logoutBackend,
} from "@/lib/auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, createContext, useContext, useEffect } from "react";

interface AuthContextValue {
  /** The current backend session, or null when signed out. */
  user: Session | null;
  /** The caller's role (from getCallerPermission), used for route gating. */
  role: Role | undefined;
  /** True while the session / actor is still loading. */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Starts the Discord OAuth redirect flow. */
  login: () => void;
  isLoggingIn: boolean;
  logout: () => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCurrentUser();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: permission } = useQuery({
    queryKey: ["callerPermission"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerPermission();
    },
    enabled: !!actor && !isFetching,
  });

  // Handle the Discord OAuth callback: Discord redirects back with ?code=...
  // which we exchange for a session, then strip the code from the URL.
  useEffect(() => {
    if (!actor || isFetching) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    completeDiscordLogin(actor, code)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        queryClient.invalidateQueries({ queryKey: ["callerPermission"] });
        // The OAuth callback is handled here; land the user on the portal home
        // instead of leaving them stranded on the blank /auth/callback route.
        window.location.assign("/");
      })
      .catch(() => {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      });
  }, [actor, isFetching, queryClient]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      await loginWithDiscord(actor);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      await logoutBackend(actor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["callerPermission"] });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        role: permission?.role,
        isLoading: userLoading || isFetching,
        isAuthenticated: !!user,
        login: loginMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        logout: logoutMutation.mutate,
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
