import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/common";
import AppTypes "../types/applications";
import PermTypes "../types/permissions";
import PosTypes "../types/positions";
import DeptTypes "../types/departments";
import SettingsTypes "../types/settings";
import AuthTypes "../types/auth";
import ApplicationsLib "../lib/applications";
import SettingsLib "../lib/settings";
import AuthLib "../lib/auth";
import PermissionsLib "../lib/permissions";

mixin (
  applications : Map.Map<Types.ApplicationId, AppTypes.Application>,
  counters : Types.Counters,
  users : Map.Map<Types.DiscordId, PermTypes.User>,
  departments : Map.Map<Types.DepartmentId, DeptTypes.Department>,
  positions : Map.Map<Types.PositionId, PosTypes.Position>,
  settings : SettingsTypes.SettingsState,
  sessions : Map.Map<Types.UserId, AuthTypes.Session>,
  transform : OutCall.Transform,
) {
  // Effective role, auto-promoting a Dprt Reviewer to Reviewer when they are
  // permitted for every department.
  func effectiveRole(caller : Types.UserId) : PermTypes.Role {
    PermissionsLib.roleOf(users, PermissionsLib.callerDiscordId(sessions, caller), departments.size());
  };

  func isReviewer(caller : Types.UserId) : Bool {
    switch (effectiveRole(caller)) {
      case (#dprtReviewer) { true };
      case (#reviewer) { true };
      case (_) { false };
    };
  };

  func isLeadOrAdmin(caller : Types.UserId) : Bool {
    switch (effectiveRole(caller)) {
      case (#dprtLead) { true };
      case (#admin) { true };
      case (_) { false };
    };
  };

  // Whether the caller may review an application for the given position.
  // Dprt Reviewers are scoped to their assigned departments; Reviewers and
  // Admins (and Dprt Reviewers auto-promoted to Reviewer) may review any.
  func canReview(caller : Types.UserId, positionId : Types.PositionId) : Bool {
    switch (effectiveRole(caller)) {
      case (#reviewer) { true };
      case (#admin) { true };
      case (#dprtReviewer) {
        let position = positions.get(positionId) ?? Runtime.trap("Position not found");
        switch (users.get(discordIdOf(caller))) {
          case (?u) { u.departments.indexOf(position.departmentId) != null };
          case null { false };
        };
      };
      case (_) { false };
    };
  };

  func discordIdOf(caller : Types.UserId) : Types.DiscordId {
    PermissionsLib.callerDiscordId(sessions, caller);
  };

  func feedbackText(feedback : ?Text) : Text {
    switch (feedback) {
      case (?f) { " Feedback: " # f };
      case null { "" };
    };
  };

  func scopeText(scope : AppTypes.BlacklistScope) : Text {
    switch (scope) {
      case (#department) { "department" };
      case (#full) { "full" };
    };
  };

  public shared ({ caller }) func submitApplication(positionId : Types.PositionId, responses : [Text]) : async AppTypes.Application {
    let position = positions.get(positionId) ?? Runtime.trap("Position not found");
    switch (users.get(PermissionsLib.callerDiscordId(sessions, caller))) {
      case (?u) {
        switch (u.role) {
          case (#blacklisted) { Runtime.trap("You are blacklisted from submitting applications") };
          case (#dprtBlacklisted) {
            if (u.departments.indexOf(position.departmentId) != null) {
              Runtime.trap("You are blacklisted from this department");
            };
          };
          case (_) {};
        };
      };
      case null {};
    };
    let app = ApplicationsLib.submitApplication(applications, counters, positionId, caller, discordIdOf(caller), responses);
    await AuthLib.sendBotDm(SettingsLib.toPublic(settings), discordIdOf(caller), "Your application to " # position.title # " has been submitted.", transform);
    app;
  };

  public query ({ caller }) func listApplications() : async [AppTypes.Application] {
    assert isLeadOrAdmin(caller);
    ApplicationsLib.listApplications(applications);
  };

  public query ({ caller }) func getApplication(id : Types.ApplicationId) : async ?AppTypes.Application {
    assert isReviewer(caller);
    switch (applications.get(id)) {
      case (?app) {
        if (canReview(caller, app.positionId)) { ?app } else { Runtime.trap("Not authorized to review this application") };
      };
      case null { null };
    };
  };

  public query ({ caller }) func listApplicationsForReview() : async [AppTypes.Application] {
    assert isReviewer(caller);
    let role = effectiveRole(caller);
    if (role == #reviewer or role == #admin) {
      ApplicationsLib.listApplications(applications);
    } else {
      let depts = switch (users.get(discordIdOf(caller))) {
        case (?u) { u.departments };
        case null { [] };
      };
      ApplicationsLib.listApplications(applications).filter(func app = switch (positions.get(app.positionId)) {
        case (?p) { depts.indexOf(p.departmentId) != null };
        case null { false };
      });
    };
  };

  public shared ({ caller }) func openApplicationForReview(id : Types.ApplicationId) : async AppTypes.Application {
    assert isReviewer(caller);
    let existing = applications.get(id) ?? Runtime.trap("Application not found");
    if (not canReview(caller, existing.positionId)) {
      Runtime.trap("Not authorized to review this application");
    };
    let updated : AppTypes.Application = { existing with status = #underReview };
    applications.add(id, updated);
    updated;
  };

  public shared ({ caller }) func setApplicationStatus(id : Types.ApplicationId, status : AppTypes.ApplicationStatus, feedback : ?Text, internalNotes : ?Text) : async AppTypes.Application {
    assert isReviewer(caller);
    let existing = applications.get(id) ?? Runtime.trap("Application not found");
    if (not canReview(caller, existing.positionId)) {
      Runtime.trap("Not authorized to review this application");
    };
    let updated = ApplicationsLib.setApplicationStatus(applications, id, status, feedback, internalNotes);
    switch (status) {
      case (#accepted) {
        await AuthLib.sendBotDm(SettingsLib.toPublic(settings), existing.applicantDiscordId, "Your application has been accepted." # feedbackText(feedback), transform);
      };
      case (#rejected) {
        await AuthLib.sendBotDm(SettingsLib.toPublic(settings), existing.applicantDiscordId, "Your application has been rejected." # feedbackText(feedback), transform);
      };
      case (_) {};
    };
    updated;
  };

  public shared ({ caller }) func blacklistApplicant(applicationId : Types.ApplicationId, scope : AppTypes.BlacklistScope, reason : Text) : async () {
    assert isReviewer(caller);
    let app = applications.get(applicationId) ?? Runtime.trap("Application not found");
    if (not canReview(caller, app.positionId)) {
      Runtime.trap("Not authorized to review this application");
    };
    let position = positions.get(app.positionId) ?? Runtime.trap("Position not found");
    switch (users.get(app.applicantDiscordId)) {
      case (?u) {
        let updated : PermTypes.User = switch (scope) {
          case (#full) { { u with role = #blacklisted } };
          case (#department) {
            let depts = if (u.departments.indexOf(position.departmentId) != null) { u.departments } else { u.departments.concat([position.departmentId]) };
            { u with role = #dprtBlacklisted; departments = depts };
          };
        };
        users.add(app.applicantDiscordId, updated);
      };
      case null {};
    };
    await AuthLib.sendBotDm(SettingsLib.toPublic(settings), app.applicantDiscordId, "You have been blacklisted (" # scopeText(scope) # "). Reason: " # reason, transform);
  };
};
