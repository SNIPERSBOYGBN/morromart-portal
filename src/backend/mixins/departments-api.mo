import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Types "../types/common";
import DeptTypes "../types/departments";
import PermTypes "../types/permissions";
import AuthTypes "../types/auth";
import DepartmentsLib "../lib/departments";
import PermissionsLib "../lib/permissions";

mixin (
  departments : Map.Map<Types.DepartmentId, DeptTypes.Department>,
  counters : Types.Counters,
  users : Map.Map<Types.DiscordId, PermTypes.User>,
  sessions : Map.Map<Types.UserId, AuthTypes.Session>,
) {
  public shared ({ caller }) func createDepartment(name : Text, description : Text) : async DeptTypes.Department {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    DepartmentsLib.createDepartment(departments, counters, name, description);
  };

  public query func listDepartments() : async [DeptTypes.Department] {
    DepartmentsLib.listDepartments(departments);
  };

  public query func getDepartment(id : Types.DepartmentId) : async ?DeptTypes.Department {
    departments.get(id);
  };

  public shared ({ caller }) func updateDepartment(id : Types.DepartmentId, name : Text, description : Text) : async DeptTypes.Department {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    DepartmentsLib.updateDepartment(departments, id, name, description);
  };

  public shared ({ caller }) func deleteDepartment(id : Types.DepartmentId) : async () {
    assert PermissionsLib.isAdmin(users, PermissionsLib.callerDiscordId(sessions, caller));
    DepartmentsLib.deleteDepartment(departments, id);
  };
};
