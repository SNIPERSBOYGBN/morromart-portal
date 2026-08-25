import type { Department } from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from "@/hooks/useQueries";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";

interface DepartmentForm {
  name: string;
  description: string;
}

const EMPTY_FORM: DepartmentForm = { name: "", description: "" };

function DepartmentFormFields({
  form,
  onChange,
}: {
  form: DepartmentForm;
  onChange: (form: DepartmentForm) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="department-name">Name</Label>
        <Input
          id="department-name"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="e.g. Engineering"
          required
          data-ocid="department_name_input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department-description">Description</Label>
        <Textarea
          id="department-description"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="What does this department do?"
          data-ocid="department_description_input"
        />
      </div>
    </div>
  );
}

function DepartmentCard({
  department,
  onEdit,
  onDelete,
}: {
  department: Department;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}) {
  return (
    <Card className="transition-smooth hover:shadow-elevated">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{department.name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                Department
              </Badge>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${department.name}`}
              onClick={() => onEdit(department)}
              data-ocid="edit_button"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${department.name}`}
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(department)}
              data-ocid="delete_button"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {department.description || "No description provided."}
        </p>
      </CardContent>
    </Card>
  );
}

export function DepartmentsPage() {
  const { user } = useAuth();
  const { data: departments = [], isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [createForm, setCreateForm] = useState<DepartmentForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Department | null>(null);
  const [editForm, setEditForm] = useState<DepartmentForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<Department | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createDepartment.mutate(
      {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      },
      {
        onSuccess: () => {
          setCreateForm(EMPTY_FORM);
        },
        onError: (err) => {
          setCreateError(
            err instanceof Error ? err.message : "Failed to create department.",
          );
        },
      },
    );
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setEditForm({
      name: department.name,
      description: department.description,
    });
    setEditError(null);
  };

  const handleEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError(null);
    updateDepartment.mutate(
      {
        id: editing.id,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      },
      {
        onSuccess: () => setEditing(null),
        onError: (err) => {
          setEditError(
            err instanceof Error ? err.message : "Failed to update department.",
          );
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    setDeleteError(null);
    deleteDepartment.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
      onError: (err) => {
        setDeleteError(
          err instanceof Error ? err.message : "Failed to delete department.",
        );
      },
    });
  };

  return (
    <div className="space-y-6" data-ocid="departments_page">
      <div>
        <h2 className="font-display text-2xl font-bold">Departments</h2>
        <p className="text-sm text-muted-foreground">
          Create and manage the departments that positions are assigned to.
          {user ? ` Signed in as ${user.username}.` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Create form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New department</CardTitle>
            <CardDescription>
              Add a department to organise positions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <DepartmentFormFields
                form={createForm}
                onChange={setCreateForm}
              />
              {createError && (
                <p className="text-sm text-destructive" data-ocid="error_state">
                  {createError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  createDepartment.isPending || createForm.name.trim() === ""
                }
                data-ocid="create_department_button"
              >
                {createDepartment.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Create department
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Department list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              All departments
            </h3>
            <Badge variant="secondary">{departments.length} total</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-4" data-ocid="loading_state">
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 py-4">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : departments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <p className="font-semibold">No departments yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first department to start assigning positions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4" data-ocid="department_list">
              {departments.map((department) => (
                <DepartmentCard
                  key={department.id.toString()}
                  department={department}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent data-ocid="edit_dialog">
          <DialogHeader>
            <DialogTitle>Edit department</DialogTitle>
            <DialogDescription>
              Update the department name and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <DepartmentFormFields form={editForm} onChange={setEditForm} />
            {editError && (
              <p className="text-sm text-destructive" data-ocid="error_state">
                {editError}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(null)}
                data-ocid="cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  updateDepartment.isPending || editForm.name.trim() === ""
                }
                data-ocid="save_button"
              >
                {updateDepartment.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent data-ocid="delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete department?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>
              . Positions assigned to it may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive" data-ocid="error_state">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleting(null)}
              data-ocid="cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteDepartment.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="confirm_button"
            >
              {deleteDepartment.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
