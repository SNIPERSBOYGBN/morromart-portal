module {
  // Shared (immutable) settings view returned to the frontend.
  public type Settings = {
    guildId : Text;
    guildRequired : Bool;
    clientId : Text;
    clientSecret : Text;
    botToken : Text;
  };

  // Mutable internal state, mutated in place by the settings mixin.
  public type SettingsState = {
    var guildId : Text;
    var guildRequired : Bool;
    var clientId : Text;
    var clientSecret : Text;
    var botToken : Text;
  };
};
