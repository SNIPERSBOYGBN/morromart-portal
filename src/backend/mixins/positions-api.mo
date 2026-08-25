import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types/common";
import PosTypes "../types/positions";
import PermTypes "../types/permissions";
import AuthTypes "../types/auth";
import PositionsLib "../lib/positions";
import PermissionsLib "../lib/permissions";

mixin (
  positions : Map.Map<Types.PositionId, PosTypes.Position>,
  counters : Types.Counters,
  users : Map.Map<Types.DiscordId, PermTypes.User>,
  sessions : Map.Map<Types.UserId, AuthTypes.Session>,
) {
  // Dprt Lead can manage positions for their own department; Admin for any.
  func canManage(caller : Types.UserId, departmentId : Types.DepartmentId) : Bool {
    switch (users.get(PermissionsLib.callerDiscordId(sessions, caller))) {
      case (?u) {
        switch (u.role) {
          case (#admin) { true };
          case (#dprtLead) { u.departments.indexOf(departmentId) != null };
          case (_) { false };
        };
      };
      case null { false };
    };
  };

  public shared ({ caller }) func createPosition(title : Text, description : Text, requirements : [Text], positionType : PosTypes.PositionType, departmentId : Types.DepartmentId) : async PosTypes.Position {
    assert canManage(caller, departmentId);
    PositionsLib.createPosition(positions, counters, title, description, requirements, positionType, departmentId);
  };

  public query func listPositions() : async [PosTypes.Position] {
    PositionsLib.listPositions(positions);
  };

  public query func getPosition(id : Types.PositionId) : async ?PosTypes.Position {
    positions.get(id);
  };

  public shared ({ caller }) func updatePosition(id : Types.PositionId, title : Text, description : Text, requirements : [Text], positionType : PosTypes.PositionType, departmentId : Types.DepartmentId) : async PosTypes.Position {
    assert canManage(caller, departmentId);
    PositionsLib.updatePosition(positions, id, title, description, requirements, positionType, departmentId);
  };

  public shared ({ caller }) func setPositionOpen(id : Types.PositionId, open : Bool) : async PosTypes.Position {
    let position = positions.get(id) ?? Runtime.trap("Position not found");
    assert canManage(caller, position.departmentId);
    PositionsLib.setPositionOpen(positions, id, open);
  };
};
