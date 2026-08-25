import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Types "../types/common";
import DeptTypes "../types/departments";

module {
  public func createDepartment(departments : Map.Map<Types.DepartmentId, DeptTypes.Department>, counters : Types.Counters, name : Text, description : Text) : DeptTypes.Department {
    let id = counters.nextDepartmentId;
    counters.nextDepartmentId += 1;
    let department : DeptTypes.Department = { id; name; description };
    departments.add(id, department);
    department;
  };

  public func listDepartments(departments : Map.Map<Types.DepartmentId, DeptTypes.Department>) : [DeptTypes.Department] {
    departments.values().toArray();
  };

  public func updateDepartment(departments : Map.Map<Types.DepartmentId, DeptTypes.Department>, id : Types.DepartmentId, name : Text, description : Text) : DeptTypes.Department {
    ignore departments.get(id) ?? Runtime.trap("Department not found");
    let updated : DeptTypes.Department = { id; name; description };
    departments.add(id, updated);
    updated;
  };

  public func deleteDepartment(departments : Map.Map<Types.DepartmentId, DeptTypes.Department>, id : Types.DepartmentId) : () {
    departments.remove(id);
  };
};
