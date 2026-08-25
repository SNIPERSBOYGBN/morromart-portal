import OutCall "mo:caffeineai-http-outcalls/outcall";
import Json "mo:json/lib";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Types "../types/common";
import AuthTypes "../types/auth";
import SettingsTypes "../types/settings";

module {
  // OAuth redirect URI registered with the Discord application. The frontend
  // handles the callback at this path and forwards the code to
  // discordLoginComplete.
  public let redirectUri : Text = "http://localhost:5173/auth/callback";

  // Builds the Discord OAuth authorize URL. Scope requests identity plus guild
  // membership so the guild-required check can be enforced.
  public func buildDiscordAuthUrl(settings : SettingsTypes.Settings) : Text {
    "https://discord.com/oauth2/authorize?client_id=" # settings.clientId
      # "&redirect_uri=" # redirectUri
      # "&response_type=code&scope=identify%20guilds"
      # "&state=morromart";
  };

  // Exchanges the OAuth authorization code for an access token via Discord's
  // token endpoint (form-encoded POST).
  public func exchangeCodeForToken(settings : SettingsTypes.Settings, code : Text, transform : OutCall.Transform) : async Text {
    let body = "client_id=" # settings.clientId
      # "&client_secret=" # settings.clientSecret
      # "&grant_type=authorization_code"
      # "&code=" # code
      # "&redirect_uri=" # redirectUri;
    let responseText = await OutCall.httpPostRequest(
      "https://discord.com/api/oauth2/token",
      [{ name = "Content-Type"; value = "application/x-www-form-urlencoded" }],
      body,
      transform,
    );
    let json = switch (Json.parse(responseText)) {
      case (#ok(j)) { j };
      case (#err(e)) { Runtime.trap("Failed to parse Discord token response: " # Json.errToText(e)) };
    };
    switch (Json.getAsText(json, "access_token")) {
      case (#ok(t)) { t };
      case (#err(_)) { Runtime.trap("No access_token in Discord token response") };
    };
  };

  // Fetches the authenticated user's Discord profile. When the guild-required
  // setting is on, verifies the user is a member of the configured guild and
  // traps otherwise.
  public func fetchDiscordUser(settings : SettingsTypes.Settings, accessToken : Text, transform : OutCall.Transform) : async AuthTypes.DiscordUser {
    let authHeader = [{ name = "Authorization"; value = "Bearer " # accessToken }];
    let userText = await OutCall.httpGetRequest("https://discord.com/api/users/@me", authHeader, transform);
    let userJson = switch (Json.parse(userText)) {
      case (#ok(j)) { j };
      case (#err(e)) { Runtime.trap("Failed to parse Discord user response: " # Json.errToText(e)) };
    };
    let id = switch (Json.getAsText(userJson, "id")) {
      case (#ok(v)) { v };
      case (#err(_)) { Runtime.trap("No id in Discord user response") };
    };
    let username = switch (Json.getAsText(userJson, "username")) {
      case (#ok(v)) { v };
      case (#err(_)) { Runtime.trap("No username in Discord user response") };
    };
    let avatar = switch (Json.getAsText(userJson, "avatar")) {
      case (#ok(v)) { ?v };
      case (#err(_)) { null };
    };
    if (settings.guildRequired) {
      let guildsText = await OutCall.httpGetRequest("https://discord.com/api/users/@me/guilds", authHeader, transform);
      let guildsJson = switch (Json.parse(guildsText)) {
        case (#ok(j)) { j };
        case (#err(e)) { Runtime.trap("Failed to parse Discord guilds response: " # Json.errToText(e)) };
      };
      let guilds = switch (Json.getAsArray(guildsJson, "")) {
        case (#ok(a)) { a };
        case (#err(_)) { Runtime.trap("No guilds array in Discord guilds response") };
      };
      let inGuild = guilds.any(func g = switch (Json.getAsText(g, "id")) {
        case (#ok(gid)) { gid == settings.guildId };
        case (#err(_)) { false };
      });
      if (not inGuild) {
        Runtime.trap("You must be a member of the required Discord guild to log in");
      };
    };
    { id; username; avatar };
  };

  // Creates and stores a session for the given user, returning it.
  public func createSession(sessions : Map.Map<Types.UserId, AuthTypes.Session>, userId : Types.UserId, discordUser : AuthTypes.DiscordUser) : AuthTypes.Session {
    let session : AuthTypes.Session = {
      userId;
      discordId = discordUser.id;
      username = discordUser.username;
      expiresAt = Time.now() + 7 * 24 * 60 * 60 * 1_000_000_000;
    };
    sessions.add(userId, session);
    session;
  };

  // Sends a DM to the given Discord user via the bot: creates a DM channel,
  // then posts the message to it.
  public func sendBotDm(settings : SettingsTypes.Settings, discordId : Types.DiscordId, message : Text, transform : OutCall.Transform) : async () {
    let authHeader = [{ name = "Authorization"; value = "Bot " # settings.botToken }];
    let channelBody = "{\"recipient_id\":\"" # discordId # "\"}";
    let channelText = await OutCall.httpPostRequest(
      "https://discord.com/api/users/@me/channels",
      authHeader.concat([{ name = "Content-Type"; value = "application/json" }]),
      channelBody,
      transform,
    );
    let channelJson = switch (Json.parse(channelText)) {
      case (#ok(j)) { j };
      case (#err(e)) { Runtime.trap("Failed to parse DM channel response: " # Json.errToText(e)) };
    };
    let channelId = switch (Json.getAsText(channelJson, "id")) {
      case (#ok(v)) { v };
      case (#err(_)) { Runtime.trap("No channel id in DM channel response") };
    };
    let messageBody = "{\"content\":\"" # message # "\"}";
    ignore await OutCall.httpPostRequest(
      "https://discord.com/api/channels/" # channelId # "/messages",
      authHeader.concat([{ name = "Content-Type"; value = "application/json" }]),
      messageBody,
      transform,
    );
  };
};
