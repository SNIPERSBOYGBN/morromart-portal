import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/common";
import PermTypes "../types/permissions";
import AuthTypes "../types/auth";
import SettingsTypes "../types/settings";
import SettingsLib "../lib/settings";
import PermissionsLib "../lib/permissions";

mixin (
  settings : SettingsTypes.SettingsState,
  users : Map.Map<Types.DiscordId, PermTypes.User>,
  sessions : Map.Map<Types.UserId, AuthTypes.Session>,
) {
  public query ({ caller }) func getSettings() : async SettingsTypes.Settings {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    SettingsLib.toPublic(settings);
  };

  public shared ({ caller }) func updateSettings(newSettings : SettingsTypes.Settings) : async () {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    SettingsLib.update(settings, newSettings);
  };

  public shared ({ caller }) func setGuildRequired(required : Bool) : async () {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    settings.guildRequired := required;
  };

  public shared ({ caller }) func setGuildId(guildId : Text) : async () {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    settings.guildId := guildId;
  };
};
