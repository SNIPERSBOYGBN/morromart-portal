import Types "common";

module {
  public type ApplicationStatus = {
    #pendingReview;
    #underReview;
    #accepted;
    #rejected;
  };

  public type BlacklistScope = {
    #department;
    #full;
  };

  public type Application = {
    id : Types.ApplicationId;
    positionId : Types.PositionId;
    applicantId : Types.UserId;
    applicantDiscordId : Types.DiscordId;
    responses : [Text];
    status : ApplicationStatus;
    feedback : ?Text;
    internalNotes : ?Text;
    submittedAt : Types.Timestamp;
  };
};
