import {
  type Department,
  type Position,
  PositionType,
  createActor,
} from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Building2 } from "lucide-react";

const TYPE_LABEL: Record<PositionType, string> = {
  [PositionType.paid]: "Paid",
  [PositionType.unpaid]: "Unpaid",
  [PositionType.contract]: "Contract",
};

function PositionsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-ocid="loading_state"
    >
      {["a", "b", "c", "d", "e", "f"].map((k) => (
        <Card key={k} className="gap-4">
          <CardHeader className="gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PositionsPage() {
  const { actor, isFetching } = useActor(createActor);

  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPositions();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDepartments();
    },
    enabled: !!actor && !isFetching,
  });

  const departmentById = new Map<bigint, Department>(
    departments.map((d) => [d.id, d]),
  );

  const openPositions = positions.filter((p) => p.open);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Open Positions</h2>
        <p className="mt-1 text-muted-foreground">
          Browse currently open positions and submit your application.
        </p>
      </div>

      {positionsLoading ? (
        <PositionsSkeleton />
      ) : openPositions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center"
          data-ocid="empty_state"
        >
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Briefcase className="size-6" />
          </div>
          <h3 className="font-display text-lg font-semibold">
            No open positions right now
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            There are no positions currently accepting applications. Check back
            soon for new opportunities.
          </p>
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-ocid="positions_list"
        >
          {openPositions.map((position, index) => {
            const department = departmentById.get(position.departmentId);
            return (
              <Link
                key={position.id.toString()}
                to="/positions/$id"
                params={{ id: position.id.toString() }}
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-ocid={`position.card.${index + 1}`}
              >
                <Card className="h-full gap-4 transition-all group-hover:border-primary/40 group-hover:shadow-elevated">
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-base leading-snug">
                        {position.title}
                      </CardTitle>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="size-3.5" />
                      <span className="truncate">
                        {department?.name ?? "General"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {position.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        data-ocid="position_type_badge"
                      >
                        {TYPE_LABEL[position.positionType]}
                      </Badge>
                      <Badge
                        variant={position.open ? "default" : "outline"}
                        data-ocid="position_status_badge"
                      >
                        {position.open ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
