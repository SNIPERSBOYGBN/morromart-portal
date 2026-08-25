import Types "common";

module {
  public type Role = {
    #blacklisted;
    #dprtBlacklisted;
    #applicant;
    #dprtReviewer;
    #reviewer;
    #dprtLead;
    #admin;
  };

  public type User = {
    id : Types.UserId;
    discordId : Types.DiscordId;
    username : Text;
    role : Role;
    // Departments this user holds department-scoped permissions for
    // (Dprt Reviewer / Dprt Lead / Dprt Blacklisted).
    departments : [Types.DepartmentId];
  };
};
