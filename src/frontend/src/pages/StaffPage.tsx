import { type Department, Role, type User, createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LEVEL } from "@/lib/permissions";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, UserPlus, Users } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

const ALL_ROLES: Role[] = [
  Role.blacklisted,
  Role.dprtBlacklisted,
  Role.applicant,
  Role.dprtReviewer,
  Role.reviewer,
  Role.dprtLead,
  Role.admin,
];

const ROLE_LABELS: Record<Role, string> = {
  [Role.blacklisted]: "Blacklisted",
  [Role.dprtBlacklisted]: "Dprt Blacklisted",
  [Role.applicant]: "Applicant",
  [Role.dprtReviewer]: "Dprt Reviewer",
  [Role.reviewer]: "Reviewer",
  [Role.dprtLead]: "Dprt Lead",
  [Role.admin]: "Admin",
};

/** Roles that are scoped to a specific department. */
const DEPT_SCOPED_ROLES = new Set<Role>([
  Role.dprtBlacklisted,
  Role.dprtReviewer,
]);

const ROLE_BADGE_STYLES: Record<Role, string> = {
  [Role.blacklisted]:
    "bg-destructive/15 text-destructive border-destructive/30",
  [Role.dprtBlacklisted]:
    "bg-destructive/10 text-destructive border-destructive/20",
  [Role.applicant]: "bg-secondary text-secondary-foreground border-border",
  [Role.dprtReviewer]: "bg-info/15 text-info border-info/30",
  [Role.reviewer]: "bg-success/15 text-success border-success/30",
  [Role.dprtLead]: "bg-warning/15 text-warning border-warning/30",
  [Role.admin]: "bg-primary/15 text-primary border-primary/30",
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant="outline" className={ROLE_BADGE_STYLES[role]}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

interface StaffRowProps {
  member: User;
  departmentNames: Map<bigint, string>;
  departments: Department[];
  allowedRoles: Role[];
  allowedDepartments: bigint[];
  canEdit: boolean;
  saving: boolean;
  index: number;
  onSave: (userId: Principal, role: Role, departments: bigint[]) => void;
}

function StaffRow({
  member,
  departmentNames,
  departments,
  allowedRoles,
  allowedDepartments,
  canEdit,
  saving,
  index,
  onSave,
}: StaffRowProps) {
  const [role, setRole] = useState<Role>(member.role);
  const [deptId, setDeptId] = useState<string>(
    member.departments[0]?.toString() ?? "",
  );

  const isDeptScoped = DEPT_SCOPED_ROLES.has(role);
  const deptOptions = departments.filter((d) =>
    allowedDepartments.includes(d.id),
  );

  const handleSave = () => {
    onSave(member.id, role, isDeptScoped && deptId ? [BigInt(deptId)] : []);
  };

  return (
    <TableRow data-ocid={`staff_row.${index + 1}`}>
      <TableCell>
        <div className="font-medium">{member.username}</div>
        <div className="text-xs text-muted-foreground">{member.discordId}</div>
      </TableCell>
      <TableCell>
        <RoleBadge role={member.role} />
      </TableCell>
      <TableCell>
        {member.departments.length
          ? member.departments
              .map((id) => departmentNames.get(id) ?? `#${id}`)
              .join(", ")
          : "—"}
      </TableCell>
      <TableCell className="text-right">
        {canEdit ? (
          <div className="flex items-center justify-end gap-2">
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-40" data-ocid="role_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isDeptScoped && (
              <Select value={deptId} onValueChange={setDeptId}>
                <SelectTrigger className="w-44" data-ocid="dept_select">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {deptOptions.map((d) => (
                    <SelectItem key={d.id.toString()} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || (isDeptScoped && !deptId)}
              data-ocid="save_button"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">View only</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function StaffPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const { role: currentRole } = useAuth();
  const isAdmin = currentRole === Role.admin;

  const [discordId, setDiscordId] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>(Role.applicant);
  const [deptId, setDeptId] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [changeError, setChangeError] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (actor ? actor.listStaff() : []),
    enabled: !!actor && !isFetching,
  });

  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (actor ? actor.listDepartments() : []),
    enabled: !!actor && !isFetching,
  });

  // Shares the cache with useAuth's getCallerPermission query; gives us the
  // current user's departments so Dprt Leads can scope their edits.
  const { data: caller } = useQuery({
    queryKey: ["callerPermission"],
    queryFn: async () => (actor ? actor.getCallerPermission() : null),
    enabled: !!actor && !isFetching,
  });

  const addStaffMutation = useMutation({
    mutationFn: async (args: {
      discordId: string;
      username: string;
      role: Role;
      departments: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addStaffMember(
        args.discordId,
        args.username,
        args.role,
        args.departments,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const changePermissionMutation = useMutation({
    mutationFn: async (args: {
      userId: Principal;
      role: Role;
      departments: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.changePermission(args.userId, args.role, args.departments);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const departmentNames = useMemo(() => {
    const map = new Map<bigint, string>();
    for (const d of departments ?? []) map.set(d.id, d.name);
    return map;
  }, [departments]);

  const reviewerStaff = useMemo(
    () =>
      (staff ?? []).filter(
        (u) => ROLE_LEVEL[u.role] >= ROLE_LEVEL[Role.dprtReviewer],
      ),
    [staff],
  );

  const leadDepartments = caller?.departments ?? [];
  const allowedDepartments = isAdmin
    ? (departments ?? []).map((d) => d.id)
    : leadDepartments;
  const allowedRoles = isAdmin ? ALL_ROLES : [Role.dprtReviewer];

  const canEditMember = (member: User) =>
    isAdmin ||
    (member.role === Role.dprtReviewer &&
      member.departments.some((d) => leadDepartments.includes(d)));

  const isDeptScoped = DEPT_SCOPED_ROLES.has(role);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!discordId.trim() || !username.trim()) {
      setFormError("Discord user ID and username are required.");
      return;
    }
    if (isDeptScoped && !deptId) {
      setFormError("Select a department for this role.");
      return;
    }
    addStaffMutation.mutate(
      {
        discordId: discordId.trim(),
        username: username.trim(),
        role,
        departments: isDeptScoped && deptId ? [BigInt(deptId)] : [],
      },
      {
        onSuccess: () => {
          setFormSuccess(`${username.trim()} added to staff.`);
          setDiscordId("");
          setUsername("");
          setRole(Role.applicant);
          setDeptId("");
        },
        onError: (err) => {
          setFormError(
            err instanceof Error ? err.message : "Failed to add staff member.",
          );
        },
      },
    );
  };

  const handleChangePermission = (
    userId: Principal,
    newRole: Role,
    newDepartments: bigint[],
  ) => {
    setChangeError("");
    setSavingUserId(userId.toString());
    changePermissionMutation.mutate(
      { userId, role: newRole, departments: newDepartments },
      {
        onSettled: () => setSavingUserId(null),
        onError: (err) => {
          setChangeError(
            err instanceof Error ? err.message : "Failed to update permission.",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6" data-ocid="staff_page">
      <div>
        <h2 className="font-display text-2xl font-bold">Staff</h2>
        <p className="text-sm text-muted-foreground">
          Manage staff members and their permissions.
        </p>
      </div>

      {isAdmin && (
        <Card data-ocid="add_staff_card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              Add staff member
            </CardTitle>
            <CardDescription>
              Add a person by their Discord user ID and assign a permission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discordId">Discord user ID</Label>
                  <Input
                    id="discordId"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                    placeholder="e.g. 123456789012345678"
                    data-ocid="discord_id_input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jane.doe"
                    data-ocid="username_input"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Permission</Label>
                  <Select
                    value={role}
                    onValueChange={(v) => setRole(v as Role)}
                  >
                    <SelectTrigger className="w-full" data-ocid="role_select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isDeptScoped && (
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={deptId} onValueChange={setDeptId}>
                      <SelectTrigger className="w-full" data-ocid="dept_select">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {(departments ?? []).map((d) => (
                          <SelectItem
                            key={d.id.toString()}
                            value={d.id.toString()}
                          >
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {formError && (
                <p className="text-sm text-destructive" data-ocid="error_state">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="text-sm text-success" data-ocid="success_state">
                  {formSuccess}
                </p>
              )}
              <Button
                type="submit"
                disabled={addStaffMutation.isPending}
                data-ocid="submit_button"
              >
                {addStaffMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add staff member
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card data-ocid="staff_list_card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Staff with reviewer permissions
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Change permissions for staff at Dprt Reviewer level or above."
              : "Change Dprt Reviewer permissions within your department."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffLoading || deptLoading ? (
            <div className="space-y-3" data-ocid="loading_state">
              {["a", "b", "c", "d"].map((k) => (
                <Skeleton key={k} className="h-12 w-full" />
              ))}
            </div>
          ) : reviewerStaff.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-10 text-center"
              data-ocid="empty_state"
            >
              <Users className="size-8 text-muted-foreground" />
              <p className="font-medium">No reviewer staff yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {isAdmin
                  ? "Add staff members with Dprt Reviewer permission or above to manage them here."
                  : "No Dprt Reviewers in your department yet."}
              </p>
            </div>
          ) : (
            <>
              {changeError && (
                <p
                  className="mb-4 text-sm text-destructive"
                  data-ocid="error_state"
                >
                  {changeError}
                </p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead className="text-right">
                      Change permission
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewerStaff.map((member, i) => (
                    <StaffRow
                      key={member.id.toString()}
                      member={member}
                      departmentNames={departmentNames}
                      departments={departments ?? []}
                      allowedRoles={allowedRoles}
                      allowedDepartments={allowedDepartments}
                      canEdit={canEditMember(member)}
                      saving={savingUserId === member.id.toString()}
                      index={i}
                      onSave={handleChangePermission}
                    />
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
