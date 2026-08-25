import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types/common";
import AuthTypes "../types/auth";
import PermTypes "../types/permissions";
import PermissionsLib "../lib/permissions";

mixin (
  users : Map.Map<Types.DiscordId, PermTypes.User>,
  sessions : Map.Map<Types.UserId, AuthTypes.Session>,
) {
  public query ({ caller }) func getCallerPermission() : async ?PermTypes.User {
    users.get(PermissionsLib.callerDiscordId(sessions, caller));
  };

  public shared ({ caller }) func addStaffMember(discordId : Types.DiscordId, username : Text, role : PermTypes.Role, departments : [Types.DepartmentId]) : async PermTypes.User {
    let callerDiscord = PermissionsLib.callerDiscordId(sessions, caller);
    if (not PermissionsLib.isAdmin(users, callerDiscord)) {
      Runtime.trap("Only admins can add staff");
    };
    // The new member's principal is unknown until they log in; it is populated
    // on Discord login. The user record is keyed by Discord ID.
    let user : PermTypes.User = {
      id = Principal.anonymous();
      discordId;
      username;
      role;
      departments;
    };
    PermissionsLib.addUser(users, user);
    user;
  };

  public query ({ caller }) func listStaff() : async [PermTypes.User] {
    let callerDiscord = PermissionsLib.callerDiscordId(sessions, caller);
    switch (PermissionsLib.roleOf(users, callerDiscord, 0)) {
      case (#dprtLead) {};
      case (#admin) {};
      case (_) { Runtime.trap("Not authorized") };
    };
    PermissionsLib.listUsers(users);
  };

  public shared ({ caller }) func changePermission(userId : Types.UserId, role : PermTypes.Role, departments : [Types.DepartmentId]) : async PermTypes.User {
    let callerDiscord = PermissionsLib.callerDiscordId(sessions, caller);
    let callerUser = users.get(callerDiscord) ?? Runtime.trap("Not authorized");
    switch (callerUser.role) {
      case (#admin) {};
      case (#dprtLead) {
        // A Dprt Lead can only manage Dprt Reviewer permissions within their
        // own department.
        if (role != #dprtReviewer) {
          Runtime.trap("Dprt Lead can only manage Dprt Reviewer permissions");
        };
        let leadDepts = callerUser.departments;
        let withinLead = departments.all(func d = leadDepts.indexOf(d) != null);
        if (not withinLead) {
          Runtime.trap("Can only manage permissions within your own department");
        };
      };
      case (_) { Runtime.trap("Not authorized") };
    };
    let existing = PermissionsLib.findByPrincipal(users, userId) ?? Runtime.trap("User not found");
    let updated : PermTypes.User = {
      existing with role; departments;
    };
    PermissionsLib.updateUser(users, updated);
    updated;
  };
};
