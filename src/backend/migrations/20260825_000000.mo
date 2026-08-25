import Map "mo:core/Map";
import Text "mo:core/Text";

module {
  type UserId = Principal;
  type DiscordId = Text;
  type Timestamp = Int;
  type DepartmentId = Nat;
  type PositionId = Nat;
  type ApplicationId = Nat;
  type AnnouncementId = Nat;

  type Role = {
    #blacklisted;
    #dprtBlacklisted;
    #applicant;
    #dprtReviewer;
    #reviewer;
    #dprtLead;
    #admin;
  };

  type User = {
    id : UserId;
    discordId : DiscordId;
    username : Text;
    role : Role;
    departments : [DepartmentId];
  };

  type Department = {
    id : DepartmentId;
    name : Text;
    description : Text;
  };

  type PositionType = {
    #unpaid;
    #paid;
    #contract;
  };

  type Position = {
    id : PositionId;
    title : Text;
    description : Text;
    requirements : [Text];
    positionType : PositionType;
    departmentId : DepartmentId;
    open : Bool;
  };

  type ApplicationStatus = {
    #pendingReview;
    #underReview;
    #accepted;
    #rejected;
  };

  type Application = {
    id : ApplicationId;
    positionId : PositionId;
    applicantId : UserId;
    applicantDiscordId : DiscordId;
    responses : [Text];
    status : ApplicationStatus;
    feedback : ?Text;
    internalNotes : ?Text;
    submittedAt : Timestamp;
  };

  type AnnouncementType = {
    #info;
    #warning;
    #error;
    #other;
  };

  type Announcement = {
    id : AnnouncementId;
    title : Text;
    message : Text;
    announcementType : AnnouncementType;
    color : ?Text;
    icon : ?Text;
    createdAt : Timestamp;
    active : Bool;
  };

  type Session = {
    userId : UserId;
    discordId : DiscordId;
    username : Text;
    expiresAt : Timestamp;
  };

  type SettingsState = {
    var guildId : Text;
    var guildRequired : Bool;
    var clientId : Text;
    var clientSecret : Text;
    var botToken : Text;
  };

  type Counters = {
    var nextDepartmentId : Nat;
    var nextPositionId : Nat;
    var nextApplicationId : Nat;
    var nextAnnouncementId : Nat;
  };

  type OldActor = {};

  type NewActor = {
    users : Map.Map<DiscordId, User>;
    departments : Map.Map<DepartmentId, Department>;
    positions : Map.Map<PositionId, Position>;
    applications : Map.Map<ApplicationId, Application>;
    announcements : Map.Map<AnnouncementId, Announcement>;
    sessions : Map.Map<UserId, Session>;
    settings : SettingsState;
    counters : Counters;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      users = Map.empty();
      departments = Map.empty();
      positions = Map.empty();
      applications = Map.empty();
      announcements = Map.empty();
      sessions = Map.empty();
      settings = {
        var guildId = "";
        var guildRequired = false;
        var clientId = "";
        var clientSecret = "";
        var botToken = "";
      };
      counters = {
        var nextDepartmentId = 0;
        var nextPositionId = 0;
        var nextApplicationId = 0;
        var nextAnnouncementId = 0;
      };
    };
  };
};
