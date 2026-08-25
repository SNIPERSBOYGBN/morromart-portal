import Types "common";

module {
  public type AnnouncementType = {
    #info;
    #warning;
    #error;
    #other;
  };

  public type Announcement = {
    id : Types.AnnouncementId;
    title : Text;
    message : Text;
    announcementType : AnnouncementType;
    // colour + icon only used for #other (custom) announcements
    color : ?Text;
    icon : ?Text;
    createdAt : Types.Timestamp;
    active : Bool;
  };
};
