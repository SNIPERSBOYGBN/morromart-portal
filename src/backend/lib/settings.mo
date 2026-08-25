import SettingsTypes "../types/settings";

module {
  public func toPublic(settings : SettingsTypes.SettingsState) : SettingsTypes.Settings {
    {
      guildId = settings.guildId;
      guildRequired = settings.guildRequired;
      clientId = settings.clientId;
      clientSecret = settings.clientSecret;
      botToken = settings.botToken;
    };
  };

  public func update(settings : SettingsTypes.SettingsState, newSettings : SettingsTypes.Settings) : () {
    settings.guildId := newSettings.guildId;
    settings.guildRequired := newSettings.guildRequired;
    settings.clientId := newSettings.clientId;
    settings.clientSecret := newSettings.clientSecret;
    settings.botToken := newSettings.botToken;
  };
};
