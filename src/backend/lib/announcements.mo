import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/common";
import AnnTypes "../types/announcements";

module {
  public func postAnnouncement(announcements : Map.Map<Types.AnnouncementId, AnnTypes.Announcement>, counters : Types.Counters, title : Text, message : Text, announcementType : AnnTypes.AnnouncementType, color : ?Text, icon : ?Text) : AnnTypes.Announcement {
    let id = counters.nextAnnouncementId;
    counters.nextAnnouncementId += 1;
    let announcement : AnnTypes.Announcement = {
      id;
      title;
      message;
      announcementType;
      color;
      icon;
      createdAt = Time.now();
      active = true;
    };
    announcements.add(id, announcement);
    announcement;
  };

  public func listAnnouncements(announcements : Map.Map<Types.AnnouncementId, AnnTypes.Announcement>) : [AnnTypes.Announcement] {
    announcements.values().toArray();
  };

  public func deactivateAnnouncement(announcements : Map.Map<Types.AnnouncementId, AnnTypes.Announcement>, id : Types.AnnouncementId) : () {
    switch (announcements.get(id)) {
      case (?a) {
        let updated : AnnTypes.Announcement = { a with active = false };
        announcements.add(id, updated);
      };
      case null {};
    };
  };
};
