import {
  type Application,
  ApplicationStatus,
  BlacklistScope,
  type Department,
  type Position,
  createActor,
} from "@/backend";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Info,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";

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

export function ApplicationReviewPage() {
  const params = useParams({ strict: false });
  const id = BigInt(params.id ?? "");
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [feedback, setFeedback] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [blacklistScope, setBlacklistScope] = useState<BlacklistScope>(
    BlacklistScope.department,
  );
  const [blacklistReason, setBlacklistReason] = useState("");

  const { data: application, isLoading } = useQuery({
    queryKey: ["application", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getApplication(id);
    },
    enabled: !!actor && !isFetching,
  });

  const { data: position } = useQuery({
    queryKey: ["position", application?.positionId.toString()],
    queryFn: async () => {
      if (!actor || !application) return null;
      return actor.getPosition(application.positionId);
    },
    enabled: !!actor && !isFetching && !!application,
  });

  const { data: department } = useQuery({
    queryKey: ["department", position?.departmentId.toString()],
    queryFn: async () => {
      if (!actor || !position) return null;
      return actor.getDepartment(position.departmentId);
    },
    enabled: !!actor && !isFetching && !!position,
  });

  // Move the application from pending review to under review when opened.
  const openMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.openApplicationForReview(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["applicationsForReview"] });
    },
  });

  useEffect(() => {
    if (
      application &&
      application.status === ApplicationStatus.pendingReview &&
      !openMutation.isPending
    ) {
      openMutation.mutate();
    }
  }, [application, openMutation.isPending, openMutation.mutate]);

  const decisionMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !status) throw new Error("Actor not ready");
      return actor.setApplicationStatus(
        id,
        status,
        feedback || null,
        internalNotes || null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["applicationsForReview"] });
    },
  });

  const blacklistMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.blacklistApplicant(id, blacklistScope, blacklistReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["applicationsForReview"] });
    },
  });

  const handleDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    decisionMutation.mutate();
  };

  const handleBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistReason.trim()) return;
    blacklistMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-ocid="loading_state">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!application) {
    return (
      <Card data-ocid="error_state">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-display text-base font-semibold">
            Application not found
          </p>
          <p className="text-sm text-muted-foreground">
            This application may have been removed.
          </p>
          <Button variant="outline" asChild>
            <Link to="/review">Back to review</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const decided =
    application.status === ApplicationStatus.accepted ||
    application.status === ApplicationStatus.rejected;

  return (
    <div className="space-y-6" data-ocid="application_review_page">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild data-ocid="back_button">
            <Link to="/review" aria-label="Back to review list">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h2 className="font-display text-2xl font-bold">
              {position?.title ??
                `Position #${application.positionId.toString()}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {department?.name ?? "Department"} · Submitted{" "}
              {formatDate(application.submittedAt)}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={STATUS_STYLES[application.status]}
          data-ocid="application_status"
        >
          {STATUS_LABELS[application.status]}
        </Badge>
      </div>

      <Alert data-ocid="dm_notice">
        <Info className="size-4" />
        <AlertTitle>Discord notification</AlertTitle>
        <AlertDescription>
          The review result, feedback, and any blacklist reason are sent to the
          applicant directly via Discord DM.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application</CardTitle>
          <CardDescription>
            Applicant {application.applicantDiscordId}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Responses</Label>
            <ol className="space-y-3">
              {application.responses.map((response, index) => (
                <li
                  key={response}
                  className="rounded-lg border border-border bg-muted/40 p-3"
                  data-ocid={`application_response.${index + 1}`}
                >
                  <p className="text-sm">{response}</p>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review decision</CardTitle>
          <CardDescription>
            Set the outcome and leave feedback for the applicant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDecision} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Decision</Label>
              <Select
                value={status || undefined}
                onValueChange={(v) => setStatus(v as ApplicationStatus)}
                disabled={decided}
              >
                <SelectTrigger
                  id="status"
                  className="w-full"
                  data-ocid="decision_select"
                >
                  <SelectValue placeholder="Select a decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ApplicationStatus.accepted}>
                    Accept
                  </SelectItem>
                  <SelectItem value={ApplicationStatus.rejected}>
                    Reject
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback for applicant</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback that will be sent to the applicant via Discord DM"
                disabled={decided}
                data-ocid="feedback_input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalNotes">Internal notes</Label>
              <Textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Private notes for your team (not sent to the applicant)"
                disabled={decided}
                data-ocid="internal_notes_input"
              />
            </div>

            {decided && (
              <p className="text-sm text-muted-foreground">
                This application has already been decided.
              </p>
            )}

            <Button
              type="submit"
              disabled={!status || decisionMutation.isPending || decided}
              data-ocid="submit_decision_button"
            >
              {decisionMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Submit decision
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blacklist applicant</CardTitle>
          <CardDescription>
            Restrict this applicant from applying. A reason is required and is
            sent to them via Discord DM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBlacklist} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blacklistScope">Scope</Label>
              <Select
                value={blacklistScope}
                onValueChange={(v) => setBlacklistScope(v as BlacklistScope)}
              >
                <SelectTrigger
                  id="blacklistScope"
                  className="w-full"
                  data-ocid="blacklist_scope_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BlacklistScope.department}>
                    Department blacklist
                  </SelectItem>
                  <SelectItem value={BlacklistScope.full}>
                    Full blacklist
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blacklistReason">Reason</Label>
              <Textarea
                id="blacklistReason"
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder="Required reason sent to the applicant via Discord DM"
                data-ocid="blacklist_reason_input"
              />
            </div>

            <Button
              type="submit"
              variant="destructive"
              disabled={!blacklistReason.trim() || blacklistMutation.isPending}
              data-ocid="blacklist_button"
            >
              {blacklistMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Ban className="size-4" />
              )}
              Blacklist applicant
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
