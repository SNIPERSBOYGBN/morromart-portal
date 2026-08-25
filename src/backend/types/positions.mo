import Types "common";

module {
  public type PositionType = {
    #unpaid;
    #paid;
    #contract;
  };

  public type Position = {
    id : Types.PositionId;
    title : Text;
    description : Text;
    requirements : [Text];
    positionType : PositionType;
    departmentId : Types.DepartmentId;
    open : Bool;
  };
};
