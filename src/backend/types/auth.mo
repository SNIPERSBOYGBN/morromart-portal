import Types "common";

module {
  public type DiscordUser = {
    id : Types.DiscordId;
    username : Text;
    avatar : ?Text;
  };

  public type Session = {
    userId : Types.UserId;
    discordId : Types.DiscordId;
    username : Text;
    expiresAt : Types.Timestamp;
  };
};
