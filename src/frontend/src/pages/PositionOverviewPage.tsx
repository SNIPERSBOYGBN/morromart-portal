import { type Position, PositionType, Role, createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  ListChecks,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL: Record<PositionType, string> = {
  [PositionType.paid]: "Paid",
  [PositionType.unpaid]: "Unpaid",
  [PositionType.contract]: "Contract",
};

function OverviewSkeleton() {
  return (
    <div className="space-y-6" data-ocid="loading_state">
      <Skeleton className="h-8 w-1/2" />
      <Card className="gap-4">
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PositionOverviewPage() {
  const { id } = useParams({ from: "/app/positions/$id" });
  const positionId = BigInt(id);
  const { actor, isFetching } = useActor(createActor);
  const { role, isLoading: authLoading } = useAuth();

  const { data: position, isLoading: positionLoading } = useQuery({
    queryKey: ["position", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPosition(positionId);
    },
    enabled: !!actor && !isFetching,
  });

  const { data: department } = useQuery({
    queryKey: ["department", position?.departmentId?.toString()],
    queryFn: async () => {
      if (!actor || !position) return null;
      return actor.getDepartment(position.departmentId);
    },
    enabled: !!actor && !isFetching && !!position,
  });

  // Shares the cache with useAuth's getCallerPermission query; carries the
  // departments a dprtBlacklisted user is barred from applying to.
  const { data: caller } = useQuery({
    queryKey: ["callerPermission"],
    queryFn: async () => (actor ? actor.getCallerPermission() : null),
    enabled: !!actor && !isFetching,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.submitApplication(positionId, []);
    },
    onSuccess: () => {
      toast.success("Application submitted", {
        description:
          "Your application was received. A confirmation has been sent to your Discord DMs.",
      });
    },
    onError: () => {
      toast.error("Could not submit application", {
        description: "Something went wrong while submitting. Please try again.",
      });
    },
  });

  const isLoading = positionLoading || authLoading;

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (!position) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center"
        data-ocid="error_state"
      >
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileText className="size-6" />
        </div>
        <h3 className="font-display text-lg font-semibold">
          Position not found
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This position may have been removed or the link is incorrect.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to positions
          </Link>
        </Button>
      </div>
    );
  }

  // Globally blacklisted users cannot apply anywhere. Department-blacklisted
  // users are only barred from positions in the departments they are
  // blacklisted for (the backend scopes this by department).
  const canApply =
    role !== Role.blacklisted &&
    !(
      role === Role.dprtBlacklisted &&
      caller?.departments.includes(position.departmentId)
    );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Back to positions
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" data-ocid="position_type_badge">
              {TYPE_LABEL[position.positionType]}
            </Badge>
            <Badge
              variant={position.open ? "default" : "outline"}
              data-ocid="position_status_badge"
            >
              {position.open ? "Open" : "Closed"}
            </Badge>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold">
            {position.title}
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-4" />
            <span>{department?.name ?? "General"}</span>
          </div>
        </div>

        {position.open && canApply && (
          <Button
            size="lg"
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            data-ocid="apply_button"
          >
            {applyMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {applyMutation.isPending ? "Submitting…" : "Apply"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="gap-4 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <FileText className="size-4 text-primary" />
              Job Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {position.description}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <CircleDollarSign className="size-4 text-primary" />
                Position Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm capitalize text-foreground/90">
                {TYPE_LABEL[position.positionType]}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <ListChecks className="size-4 text-primary" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {position.requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No specific requirements listed.
                </p>
              ) : (
                <ul className="space-y-2">
                  {position.requirements.map((req, index) => (
                    <li
                      key={req}
                      className="flex items-start gap-2 text-sm text-foreground/90"
                      data-ocid={`requirement.${index + 1}`}
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
