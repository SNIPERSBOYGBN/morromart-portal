import {
  type Department,
  type DepartmentId,
  type Position,
  type PositionId,
  PositionType,
  Role,
  createActor,
} from "@/backend";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const POSITION_TYPE_LABEL: Record<PositionType, string> = {
  [PositionType.unpaid]: "Unpaid",
  [PositionType.paid]: "Paid",
  [PositionType.contract]: "Contract",
};

const POSITION_TYPE_VARIANT: Record<
  PositionType,
  "secondary" | "default" | "outline"
> = {
  [PositionType.unpaid]: "secondary",
  [PositionType.paid]: "default",
  [PositionType.contract]: "outline",
};

interface PositionFormState {
  title: string;
  description: string;
  requirements: string[];
  positionType: PositionType;
  departmentId: DepartmentId | null;
  open: boolean;
}

const EMPTY_FORM: PositionFormState = {
  title: "",
  description: "",
  requirements: [""],
  positionType: PositionType.unpaid,
  departmentId: null,
  open: true,
};

export function ApplicationsPage() {
  const { role } = useAuth();
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const isAdmin = role === Role.admin;

  // The caller's permission record carries the departments a Dprt Lead manages.
  const { data: permission } = useQuery({
    queryKey: ["callerPermission"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerPermission();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPositions();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDepartments();
    },
    enabled: !!actor && !isFetching,
  });

  // Departments the current user may manage: Admin manages all, Dprt Lead only
  // their own. The backend enforces this too; we mirror it in the UI.
  const manageableDepartments = useMemo(() => {
    if (!departments) return [];
    if (isAdmin) return departments;
    const owned = new Set(permission?.departments ?? []);
    return departments.filter((d) => owned.has(d.id));
  }, [departments, isAdmin, permission]);

  const manageableIds = useMemo(
    () => new Set(manageableDepartments.map((d) => d.id)),
    [manageableDepartments],
  );

  const visiblePositions = useMemo(() => {
    if (!positions) return [];
    if (isAdmin) return positions;
    return positions.filter((p) => manageableIds.has(p.departmentId));
  }, [positions, isAdmin, manageableIds]);

  const [editingId, setEditingId] = useState<PositionId | null>(null);
  const [form, setForm] = useState<PositionFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const departmentName = (id: DepartmentId) =>
    departments?.find((d) => d.id === id)?.name ?? "Unknown";

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const startEdit = (position: Position) => {
    setEditingId(position.id);
    setForm({
      title: position.title,
      description: position.description,
      requirements:
        position.requirements.length > 0 ? [...position.requirements] : [""],
      positionType: position.positionType,
      departmentId: position.departmentId,
      open: position.open,
    });
    setFormError(null);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["positions"] });
  };

  const createMutation = useMutation({
    mutationFn: async (f: PositionFormState) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createPosition(
        f.title,
        f.description,
        f.requirements.filter((r) => r.trim() !== ""),
        f.positionType,
        f.departmentId!,
      );
    },
    onSuccess: () => {
      invalidate();
      startCreate();
    },
    onError: (err) => setFormError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (f: PositionFormState) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updatePosition(
        editingId!,
        f.title,
        f.description,
        f.requirements.filter((r) => r.trim() !== ""),
        f.positionType,
        f.departmentId!,
      );
    },
    onSuccess: () => {
      invalidate();
      startCreate();
    },
    onError: (err) => setFormError(err.message),
  });

  const toggleOpenMutation = useMutation({
    mutationFn: async ({ id, open }: { id: PositionId; open: boolean }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setPositionOpen(id, open);
    },
    onSuccess: invalidate,
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) {
      setFormError("Please provide a position title.");
      return;
    }
    if (!form.departmentId) {
      setFormError("Please assign the position to a department.");
      return;
    }
    if (editingId !== null) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const setRequirement = (index: number, value: string) => {
    setForm((prev) => {
      const next = [...prev.requirements];
      next[index] = value;
      return { ...prev, requirements: next };
    });
  };

  const addRequirement = () => {
    setForm((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (index: number) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const loading = positionsLoading || departmentsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Applications</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage the position postings applicants apply to.
          </p>
        </div>
        <Button
          onClick={startCreate}
          variant={editingId === null ? "secondary" : "default"}
          data-ocid="new_position_button"
        >
          <Plus className="size-4" />
          New Position
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Position list */}
        <section aria-label="Positions" data-ocid="positions_section">
          {loading ? (
            <div className="space-y-3" data-ocid="loading_state">
              {["a", "b", "c"].map((k) => (
                <Skeleton key={k} className="h-32 w-full" />
              ))}
            </div>
          ) : visiblePositions.length === 0 ? (
            <Card data-ocid="empty_state">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="font-display text-base font-semibold">
                  No positions yet
                </p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Create your first position posting to start receiving
                  applications.
                </p>
                <Button
                  className="mt-2"
                  onClick={startCreate}
                  data-ocid="empty_create_button"
                >
                  <Plus className="size-4" />
                  Create a position
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visiblePositions.map((position, index) => {
                const canManage =
                  isAdmin || manageableIds.has(position.departmentId);
                return (
                  <Card
                    key={position.id.toString()}
                    data-ocid={`position_card.${index}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="truncate">
                            {position.title}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {departmentName(position.departmentId)}
                          </CardDescription>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={
                              POSITION_TYPE_VARIANT[position.positionType]
                            }
                          >
                            {POSITION_TYPE_LABEL[position.positionType]}
                          </Badge>
                          <Badge
                            variant={position.open ? "default" : "secondary"}
                          >
                            {position.open ? "Open" : "Closed"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {position.description}
                      </p>
                      {position.requirements.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5">
                          {position.requirements.map((req) => (
                            <li
                              key={req}
                              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {req}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canManage}
                          onClick={() => startEdit(position)}
                          data-ocid={`edit_button.${index}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canManage || toggleOpenMutation.isPending}
                          onClick={() =>
                            toggleOpenMutation.mutate({
                              id: position.id,
                              open: !position.open,
                            })
                          }
                          data-ocid={`toggle_open_button.${index}`}
                        >
                          {position.open ? "Close" : "Open"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Create / edit form */}
        <section aria-label="Position form" data-ocid="position_form_section">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId === null ? "New Position" : "Edit Position"}
              </CardTitle>
              <CardDescription>
                {editingId === null
                  ? "Create a new position posting for applicants."
                  : "Update the details of this position posting."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="position-title">Title</Label>
                  <Input
                    id="position-title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Frontend Developer"
                    data-ocid="title_input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="position-description">Description</Label>
                  <Textarea
                    id="position-description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the role and responsibilities."
                    data-ocid="description_input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Requirements</Label>
                  <div className="space-y-2">
                    {form.requirements.map((req, index) => (
                      <div key={req} className="flex items-center gap-2">
                        <Input
                          value={req}
                          onChange={(e) =>
                            setRequirement(index, e.target.value)
                          }
                          placeholder={`Requirement ${index + 1}`}
                          data-ocid={`requirement_input.${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove requirement ${index + 1}`}
                          onClick={() => removeRequirement(index)}
                          disabled={form.requirements.length === 1}
                          data-ocid={`remove_requirement_button.${index}`}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRequirement}
                    data-ocid="add_requirement_button"
                  >
                    <Plus className="size-4" />
                    Add requirement
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="position-type">Type</Label>
                    <Select
                      value={form.positionType}
                      onValueChange={(v) =>
                        setForm((prev) => ({
                          ...prev,
                          positionType: v as PositionType,
                        }))
                      }
                    >
                      <SelectTrigger
                        id="position-type"
                        className="w-full"
                        data-ocid="type_select"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PositionType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {POSITION_TYPE_LABEL[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="position-department">Department</Label>
                    <Select
                      value={
                        form.departmentId
                          ? form.departmentId.toString()
                          : undefined
                      }
                      onValueChange={(v) =>
                        setForm((prev) => ({
                          ...prev,
                          departmentId: BigInt(v),
                        }))
                      }
                    >
                      <SelectTrigger
                        id="position-department"
                        className="w-full"
                        data-ocid="department_select"
                      >
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {manageableDepartments.map((dept) => (
                          <SelectItem
                            key={dept.id.toString()}
                            value={dept.id.toString()}
                          >
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2.5">
                  <div>
                    <Label htmlFor="position-open" className="font-medium">
                      Accepting applications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Toggle whether this position is open to applicants.
                    </p>
                  </div>
                  <Switch
                    id="position-open"
                    checked={form.open}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, open: checked }))
                    }
                    data-ocid="open_switch"
                  />
                </div>

                {formError && (
                  <p
                    className="text-sm text-destructive"
                    data-ocid="form_error"
                  >
                    {formError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isSaving || manageableDepartments.length === 0}
                    data-ocid="submit_button"
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : editingId === null ? (
                      <Plus className="size-4" />
                    ) : null}
                    {editingId === null ? "Create position" : "Save changes"}
                  </Button>
                  {editingId !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={startCreate}
                      data-ocid="cancel_button"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
