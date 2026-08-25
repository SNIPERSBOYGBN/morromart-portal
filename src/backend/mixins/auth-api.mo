import Map "mo:core/Map";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/common";
import AuthTypes "../types/auth";
import PermTypes "../types/permissions";
import SettingsTypes "../types/settings";
import AuthLib "../lib/auth";
import SettingsLib "../lib/settings";
import PermissionsLib "../lib/permissions";

mixin (
  sessions : Map.Map<Types.UserId, AuthTypes.Session>,
  settings : SettingsTypes.SettingsState,
  users : Map.Map<Types.DiscordId, PermTypes.User>,
  transform : OutCall.Transform,
) {
  public shared ({ caller }) func discordLoginStart() : async Text {
    ignore caller;
    AuthLib.buildDiscordAuthUrl(SettingsLib.toPublic(settings));
  };

  public shared ({ caller }) func discordLoginComplete(code : Text) : async AuthTypes.Session {
    let publicSettings = SettingsLib.toPublic(settings);
    let token = await AuthLib.exchangeCodeForToken(publicSettings, code, transform);
    let discordUser = await AuthLib.fetchDiscordUser(publicSettings, token, transform);
    // Look up the user's stored role by Discord ID; unknown users are Applicants.
    let user : PermTypes.User = switch (users.get(discordUser.id)) {
      case (?u) { { u with id = caller; username = discordUser.username } };
      case null {
        { id = caller; discordId = discordUser.id; username = discordUser.username; role = #applicant; departments = [] };
      };
    };
    users.add(user.discordId, user);
    AuthLib.createSession(sessions, caller, discordUser);
  };

  public query ({ caller }) func getCurrentUser() : async ?AuthTypes.Session {
    sessions.get(caller);
  };

  public shared ({ caller }) func logout() : async () {
    sessions.remove(caller);
  };

  public shared ({ caller }) func sendBotDm(discordId : Types.DiscordId, message : Text) : async () {
    let callerDiscord = PermissionsLib.callerDiscordId(sessions, caller);
    switch (PermissionsLib.roleOf(users, callerDiscord, 0)) {
      case (#admin) {};
      case (#dprtLead) {};
      case (#reviewer) {};
      case (#dprtReviewer) {};
      case (_) { Runtime.trap("Not authorized") };
    };
    await AuthLib.sendBotDm(SettingsLib.toPublic(settings), discordId, message, transform);
  };
};
