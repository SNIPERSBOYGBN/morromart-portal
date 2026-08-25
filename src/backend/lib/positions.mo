import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Types "../types/common";
import PosTypes "../types/positions";

module {
  public func createPosition(positions : Map.Map<Types.PositionId, PosTypes.Position>, counters : Types.Counters, title : Text, description : Text, requirements : [Text], positionType : PosTypes.PositionType, departmentId : Types.DepartmentId) : PosTypes.Position {
    let id = counters.nextPositionId;
    counters.nextPositionId += 1;
    let position : PosTypes.Position = {
      id;
      title;
      description;
      requirements;
      positionType;
      departmentId;
      open = true;
    };
    positions.add(id, position);
    position;
  };

  public func listPositions(positions : Map.Map<Types.PositionId, PosTypes.Position>) : [PosTypes.Position] {
    positions.values().toArray();
  };

  public func updatePosition(positions : Map.Map<Types.PositionId, PosTypes.Position>, id : Types.PositionId, title : Text, description : Text, requirements : [Text], positionType : PosTypes.PositionType, departmentId : Types.DepartmentId) : PosTypes.Position {
    let existing = positions.get(id) ?? Runtime.trap("Position not found");
    let updated : PosTypes.Position = {
      id;
      title;
      description;
      requirements;
      positionType;
      departmentId;
      open = existing.open;
    };
    positions.add(id, updated);
    updated;
  };

  public func setPositionOpen(positions : Map.Map<Types.PositionId, PosTypes.Position>, id : Types.PositionId, open : Bool) : PosTypes.Position {
    let existing = positions.get(id) ?? Runtime.trap("Position not found");
    let updated : PosTypes.Position = { existing with open = open };
    positions.add(id, updated);
    updated;
  };
};
