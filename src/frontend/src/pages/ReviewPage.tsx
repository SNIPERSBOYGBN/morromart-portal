import {
  type Application,
  ApplicationStatus,
  type Department,
  type Position,
  createActor,
} from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, Inbox } from "lucide-react";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  [ApplicationStatus.pendingReview]:
    "bg-warning/15 text-warning border-warning/30",
  [ApplicationStatus.underReview]: "bg-info/15 text-info border-info/30",
  [ApplicationStatus.accepted]: "bg-success/15 text-success border-success/30",
  [ApplicationStatus.rejected]:
    "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.pendingReview]: "Pending review",
  [ApplicationStatus.underReview]: "Under review",
  [ApplicationStatus.accepted]: "Accepted",
  [ApplicationStatus.rejected]: "Rejected",
};

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ReviewRow({
  application,
  position,
  applicantName,
}: {
  application: Application;
  position?: Position;
  applicantName: string;
}) {
  return (
    <Link
      to="/review/$id"
      params={{ id: application.id.toString() }}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
      data-ocid="review_item"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ClipboardList className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold">
          {position?.title ?? `Position #${application.positionId.toString()}`}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {applicantName} · Submitted {formatDate(application.submittedAt)}
        </p>
      </div>
      <Badge
        variant="outline"
        className={STATUS_STYLES[application.status]}
        data-ocid="review_status"
      >
        {STATUS_LABELS[application.status]}
      </Badge>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

export function ReviewPage() {
  const { actor, isFetching } = useActor(createActor);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applicationsForReview"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApplicationsForReview();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPositions();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listStaff();
    },
    enabled: !!actor && !isFetching,
  });

  const positionById = new Map<bigint, Position>(
    positions.map((p) => [p.id, p]),
  );
  const applicantNameById = new Map<string, string>(
    staff.map((u) => [u.id.toString(), u.username]),
  );

  const resolveApplicant = (application: Application): string => {
    const known = applicantNameById.get(application.applicantId.toString());
    return known ?? application.applicantDiscordId;
  };

  return (
    <div className="space-y-6" data-ocid="review_page">
      <div>
        <h2 className="font-display text-2xl font-bold">Review</h2>
        <p className="text-sm text-muted-foreground">
          Applications queued for your review. Open one to begin reviewing.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="loading_state">
          {["a", "b", "c", "d"].map((k) => (
            <Skeleton key={k} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card data-ocid="empty_state">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </div>
            <div>
              <p className="font-display text-base font-semibold">
                No applications to review
              </p>
              <p className="text-sm text-muted-foreground">
                New applications will appear here once applicants submit them.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications for review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.map((application) => (
              <ReviewRow
                key={application.id.toString()}
                application={application}
                position={positionById.get(application.positionId)}
                applicantName={resolveApplicant(application)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" asChild data-ocid="review_refresh_button">
          <Link to="/review">Refresh list</Link>
        </Button>
      </div>
    </div>
  );
}
