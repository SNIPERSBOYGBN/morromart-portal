import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Types "../types/common";
import AnnTypes "../types/announcements";
import PermTypes "../types/permissions";
import AuthTypes "../types/auth";
import AnnouncementsLib "../lib/announcements";
import PermissionsLib "../lib/permissions";

mixin (
  announcements : Map.Map<Types.AnnouncementId, AnnTypes.Announcement>,
  counters : Types.Counters,
  users : Map.Map<Types.DiscordId, PermTypes.User>,
  sessions : Map.Map<Types.UserId, AuthTypes.Session>,
) {
  public shared ({ caller }) func postAnnouncement(title : Text, message : Text, announcementType : AnnTypes.AnnouncementType, color : ?Text, icon : ?Text) : async AnnTypes.Announcement {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    AnnouncementsLib.postAnnouncement(announcements, counters, title, message, announcementType, color, icon);
  };

  public query func listAnnouncements() : async [AnnTypes.Announcement] {
    AnnouncementsLib.listAnnouncements(announcements);
  };

  public shared ({ caller }) func deactivateAnnouncement(id : Types.AnnouncementId) : async () {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    AnnouncementsLib.deactivateAnnouncement(announcements, id);
  };
};
