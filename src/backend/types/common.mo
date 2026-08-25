import Principal "mo:core/Principal";

module {
  public type UserId = Principal;
  public type DiscordId = Text;
  public type Timestamp = Int;
  public type DepartmentId = Nat;
  public type PositionId = Nat;
  public type ApplicationId = Nat;
  public type AnnouncementId = Nat;

  // Shared mutable counters for auto-incrementing entity ids. Passed by
  // reference to the mixins that allocate ids.
  public type Counters = {
    var nextDepartmentId : Nat;
    var nextPositionId : Nat;
    var nextApplicationId : Nat;
    var nextAnnouncementId : Nat;
  };
};
