import { type Department, type DepartmentId, createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Lists all departments. */
export function useDepartments() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDepartments();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Creates a new department. */
export function useCreateDepartment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createDepartment(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

/** Updates an existing department. */
export function useUpdateDepartment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
    }: {
      id: DepartmentId;
      name: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateDepartment(id, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

/** Deletes an existing department. */
export function useDeleteDepartment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: DepartmentId) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteDepartment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export type { Department };
