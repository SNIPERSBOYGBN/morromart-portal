import type { Backend, Session } from "@/backend";

/**
 * Starts the Discord OAuth flow. The backend returns the Discord authorize URL
 * (built from the configured client id and redirect URI); the browser is then
 * redirected to Discord, which bounces back to this app with a `?code=` query
 * parameter that is exchanged by `completeDiscordLogin`.
 */
export async function loginWithDiscord(actor: Backend): Promise<void> {
  const url = await actor.discordLoginStart();
  window.location.href = url;
}

/** Exchanges the Discord OAuth `code` for a backend session. */
export async function completeDiscordLogin(
  actor: Backend,
  code: string,
): Promise<Session> {
  return actor.discordLoginComplete(code);
}

/** Ends the current backend session. */
export async function logout(actor: Backend): Promise<void> {
  await actor.logout();
}
