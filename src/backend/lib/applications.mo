import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/common";
import AppTypes "../types/applications";

module {
  public func submitApplication(applications : Map.Map<Types.ApplicationId, AppTypes.Application>, counters : Types.Counters, positionId : Types.PositionId, applicantId : Types.UserId, applicantDiscordId : Types.DiscordId, responses : [Text]) : AppTypes.Application {
    let id = counters.nextApplicationId;
    counters.nextApplicationId += 1;
    let application : AppTypes.Application = {
      id;
      positionId;
      applicantId;
      applicantDiscordId;
      responses;
      status = #pendingReview;
      feedback = null;
      internalNotes = null;
      submittedAt = Time.now();
    };
    applications.add(id, application);
    application;
  };

  public func listApplications(applications : Map.Map<Types.ApplicationId, AppTypes.Application>) : [AppTypes.Application] {
    applications.values().toArray();
  };

  public func setApplicationStatus(applications : Map.Map<Types.ApplicationId, AppTypes.Application>, id : Types.ApplicationId, status : AppTypes.ApplicationStatus, feedback : ?Text, internalNotes : ?Text) : AppTypes.Application {
    let existing = applications.get(id) ?? Runtime.trap("Application not found");
    let updated : AppTypes.Application = {
      existing with
      status = status;
      feedback = feedback;
      internalNotes = internalNotes;
    };
    applications.add(id, updated);
    updated;
  };
};
