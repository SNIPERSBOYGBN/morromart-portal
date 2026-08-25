import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import IntValue "mo:caffeineai-oql/IntValue";
import Types "types/common";
import AuthTypes "types/auth";
import PermTypes "types/permissions";
import DeptTypes "types/departments";
import PosTypes "types/positions";
import AppTypes "types/applications";
import AnnTypes "types/announcements";
import SettingsTypes "types/settings";
import AuthApi "mixins/auth-api";
import PermissionsApi "mixins/permissions-api";
import DepartmentsApi "mixins/departments-api";
import PositionsApi "mixins/positions-api";
import ApplicationsApi "mixins/applications-api";
import AnnouncementsApi "mixins/announcements-api";
import SettingsApi "mixins/settings-api";

actor {
  let users : Map.Map<Types.DiscordId, PermTypes.User>;
  let departments : Map.Map<Types.DepartmentId, DeptTypes.Department>;
  let positions : Map.Map<Types.PositionId, PosTypes.Position>;
  let applications : Map.Map<Types.ApplicationId, AppTypes.Application>;
  let announcements : Map.Map<Types.AnnouncementId, AnnTypes.Announcement>;
  let sessions : Map.Map<Types.UserId, AuthTypes.Session>;
  let settings : SettingsTypes.SettingsState;
  let counters : Types.Counters;

  public shared query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  include AuthApi(sessions, settings, users, transform);
  include PermissionsApi(users, sessions);
  include DepartmentsApi(departments, counters, users, sessions);
  include PositionsApi(positions, counters, users, sessions);
  include ApplicationsApi(applications, counters, users, departments, positions, settings, sessions, transform);
  include AnnouncementsApi(announcements, counters, users, sessions);
  include SettingsApi(settings, users, sessions);

  include Expose({
    entities = [
      OQL.Entity.manual<PermTypes.User>("user", func () = users.values(), "User", "id")
        .sample({ id = Principal.fromText("aaaaa-aa"); discordId = ""; username = ""; role = #applicant; departments = [] })
        .payload("id", func u = u.id.toText())
        .payload("discordId", func u = u.discordId)
        .payload("username", func u = u.username)
        .payload("role", func u = switch (u.role) { case (#blacklisted) "blacklisted"; case (#dprtBlacklisted) "dprtBlacklisted"; case (#applicant) "applicant"; case (#dprtReviewer) "dprtReviewer"; case (#reviewer) "reviewer"; case (#dprtLead) "dprtLead"; case (#admin) "admin" })
        .payload("departments", func u = Text.join(u.departments.vals().map(Nat.toText), ","))
        .controllerOnly()
        .build(),
      departments.toEntity("department", "Department", "id")
        .sample({ id = 0; name = ""; description = "" })
        .public_()
        .build(),
      OQL.Entity.manual<PosTypes.Position>("position", func () = positions.values(), "Position", "id")
        .sample({ id = 0; title = ""; description = ""; requirements = []; positionType = #unpaid; departmentId = 0; open = true })
        .payload("id", func p = p.id)
        .payload("title", func p = p.title)
        .payload("description", func p = p.description)
        .payload("requirements", func p = Text.join(p.requirements.values(), ", "))
        .payload("positionType", func p = switch (p.positionType) { case (#unpaid) "unpaid"; case (#paid) "paid"; case (#contract) "contract" })
        .payload("departmentId", func p = p.departmentId)
        .payload("open", func p = p.open)
        .public_()
        .build(),
      OQL.Entity.manual<AppTypes.Application>("application", func () = applications.values(), "Application", "id")
        .sample({ id = 0; positionId = 0; applicantId = Principal.fromText("aaaaa-aa"); applicantDiscordId = ""; responses = []; status = #pendingReview; feedback = null; internalNotes = null; submittedAt = 0 })
        .payload("id", func a = a.id)
        .payload("positionId", func a = a.positionId)
        .payload("applicantId", func a = a.applicantId.toText())
        .payload("applicantDiscordId", func a = a.applicantDiscordId)
        .payload("status", func a = switch (a.status) { case (#pendingReview) "pendingReview"; case (#underReview) "underReview"; case (#accepted) "accepted"; case (#rejected) "rejected" })
        .payload("feedback", func a = switch (a.feedback) { case (?f) f; case null "" })
        .payload("internalNotes", func a = switch (a.internalNotes) { case (?n) n; case null "" })
        .payload("submittedAt", func a = a.submittedAt)
        .controllerOnly()
        .build(),
      OQL.Entity.manual<AnnTypes.Announcement>("announcement", func () = announcements.values(), "Announcement", "id")
        .sample({ id = 0; title = ""; message = ""; announcementType = #info; color = null; icon = null; createdAt = 0; active = true })
        .payload("id", func a = a.id)
        .payload("title", func a = a.title)
        .payload("message", func a = a.message)
        .payload("announcementType", func a = switch (a.announcementType) { case (#info) "info"; case (#warning) "warning"; case (#error) "error"; case (#other) "other" })
        .payload("color", func a = switch (a.color) { case (?c) c; case null "" })
        .payload("icon", func a = switch (a.icon) { case (?i) i; case null "" })
        .payload("createdAt", func a = a.createdAt)
        .payload("active", func a = a.active)
        .public_()
        .build(),
    ];
  });
};
