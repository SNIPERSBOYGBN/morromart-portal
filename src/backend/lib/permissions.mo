import Map "mo:core/Map";
import Types "../types/common";
import AuthTypes "../types/auth";
import PermTypes "../types/permissions";

module {
  // Returns the effective role, auto-promoting a Dprt Reviewer to Reviewer when
  // they are permitted for all departments.
  public func getEffectiveRole(user : PermTypes.User, departmentCount : Nat) : PermTypes.Role {
    switch (user.role) {
      case (#dprtReviewer) {
        if (departmentCount > 0 and user.departments.size() >= departmentCount) { #reviewer } else { #dprtReviewer };
      };
      case (r) { r };
    };
  };

  // Resolves the caller's Discord ID from their session. Falls back to the
  // principal's text form when no session exists (e.g. unauthenticated calls),
  // which never matches a stored Discord ID.
  public func callerDiscordId(sessions : Map.Map<Types.UserId, AuthTypes.Session>, caller : Types.UserId) : Types.DiscordId {
    switch (sessions.get(caller)) {
      case (?s) { s.discordId };
      case null { caller.toText() };
    };
  };

  // Looks up a user's effective role by Discord ID; unknown users are Applicants.
  public func roleOf(users : Map.Map<Types.DiscordId, PermTypes.User>, discordId : Types.DiscordId, departmentCount : Nat) : PermTypes.Role {
    switch (users.get(discordId)) {
      case (?u) { getEffectiveRole(u, departmentCount) };
      case null { #applicant };
    };
  };

  public func isAdmin(users : Map.Map<Types.DiscordId, PermTypes.User>, discordId : Types.DiscordId) : Bool {
    switch (users.get(discordId)) {
      case (?u) { u.role == #admin };
      case null { false };
    };
  };

  // Finds a user by their principal id. Used by changePermission, which the
  // frontend keys by the user's principal (the id is set on Discord login).
  public func findByPrincipal(users : Map.Map<Types.DiscordId, PermTypes.User>, principal : Types.UserId) : ?PermTypes.User {
    users.values().find(func u = u.id.equal(principal));
  };

  public func addUser(users : Map.Map<Types.DiscordId, PermTypes.User>, user : PermTypes.User) : () {
    users.add(user.discordId, user);
  };

  public func updateUser(users : Map.Map<Types.DiscordId, PermTypes.User>, user : PermTypes.User) : () {
    users.add(user.discordId, user);
  };

  public func listUsers(users : Map.Map<Types.DiscordId, PermTypes.User>) : [PermTypes.User] {
    users.values().toArray();
  };
};
