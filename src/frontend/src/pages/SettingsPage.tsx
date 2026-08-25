import {
  type Announcement,
  AnnouncementType,
  type Settings,
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
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  PartyPopper,
  ShieldAlert,
  Sparkles,
  Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TYPE_LABEL: Record<AnnouncementType, string> = {
  [AnnouncementType.info]: "Info",
  [AnnouncementType.warning]: "Warning",
  [AnnouncementType.error]: "Error",
  [AnnouncementType.other]: "Other",
};

const TYPE_ICON: Record<AnnouncementType, LucideIcon> = {
  [AnnouncementType.info]: Info,
  [AnnouncementType.warning]: AlertTriangle,
  [AnnouncementType.error]: AlertCircle,
  [AnnouncementType.other]: Megaphone,
};

const TYPE_BADGE: Record<AnnouncementType, string> = {
  [AnnouncementType.info]: "border-info/30 bg-info/10 text-info",
  [AnnouncementType.warning]: "border-warning/40 bg-warning/10 text-warning",
  [AnnouncementType.error]:
    "border-destructive/30 bg-destructive/10 text-destructive",
  [AnnouncementType.other]: "border-border bg-accent/40 text-accent-foreground",
};

/** Preset hex colours the admin can pick for "Other" announcements. */
const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

/** Preset icons the admin can pick for "Other" announcements. */
const PRESET_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Megaphone", icon: Megaphone },
  { name: "Sparkles", icon: Sparkles },
  { name: "Star", icon: Star },
  { name: "Party", icon: PartyPopper },
  { name: "Message", icon: MessageSquare },
  { name: "Shield", icon: ShieldAlert },
];

function SettingsSkeleton() {
  return (
    <div className="space-y-6" data-ocid="loading_state">
      <Skeleton className="h-8 w-1/2" />
      <Card className="gap-4">
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function AnnouncementTypeBadge({
  type,
  color,
}: {
  type: AnnouncementType;
  color?: string;
}) {
  const Icon = TYPE_ICON[type];
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        type === AnnouncementType.other ? "" : TYPE_BADGE[type],
      )}
      style={
        type === AnnouncementType.other && color
          ? {
              backgroundColor: `${color}1a`,
              borderColor: `${color}55`,
              color,
            }
          : undefined
      }
      data-ocid="announcement_type_badge"
    >
      <Icon className="size-3" />
      {TYPE_LABEL[type]}
    </Badge>
  );
}

export function SettingsPage() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  // Announcement form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>(AnnouncementType.info);
  const [customColor, setCustomColor] = useState(PRESET_COLORS[0]);
  const [customIcon, setCustomIcon] = useState(PRESET_ICONS[0].name);

  // Discord settings state
  const [guildId, setGuildId] = useState("");

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSettings();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: announcements = [], isLoading: announcementsLoading } =
    useQuery({
      queryKey: ["announcements"],
      queryFn: async () => {
        if (!actor) return [];
        return actor.listAnnouncements();
      },
      enabled: !!actor && !isFetching,
    });

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const color = type === AnnouncementType.other ? customColor : null;
      const icon = type === AnnouncementType.other ? customIcon : null;
      return actor.postAnnouncement(title, message, type, color, icon);
    },
    onSuccess: () => {
      toast.success("Announcement posted", {
        description: "Your announcement is now live at the top of every page.",
      });
      setTitle("");
      setMessage("");
      setType(AnnouncementType.info);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: () => {
      toast.error("Could not post announcement", {
        description: "Something went wrong. Please try again.",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deactivateAnnouncement(id);
    },
    onSuccess: () => {
      toast.success("Announcement deactivated");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: () => {
      toast.error("Could not deactivate announcement");
    },
  });

  const guildIdMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setGuildId(value);
    },
    onSuccess: () => {
      toast.success("Guild ID updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      toast.error("Could not update guild ID");
    },
  });

  const guildRequiredMutation = useMutation({
    mutationFn: async (required: boolean) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.setGuildRequired(required);
    },
    onSuccess: () => {
      toast.success("Guild requirement updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => {
      toast.error("Could not update guild requirement");
    },
  });

  const isLoading = settingsLoading || announcementsLoading;

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const canPost = title.trim().length > 0 && message.trim().length > 0;
  const selectedIcon =
    PRESET_ICONS.find((i) => i.name === customIcon) ?? PRESET_ICONS[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Settings</h2>
        <p className="mt-1 text-muted-foreground">
          Manage site-wide announcements and Discord login configuration.
        </p>
        {user && (
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{user.username}</span>{" "}
            · <span className="capitalize">{role}</span>
          </p>
        )}
      </div>

      {/* Announcements */}
      <Card className="gap-4" data-ocid="announcements_section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Megaphone className="size-4 text-primary" />
            Announcements
          </CardTitle>
          <CardDescription>
            Post a site-wide banner shown at the top of every page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canPost) postMutation.mutate();
            }}
            data-ocid="announcement_form"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Server maintenance tonight"
                  data-ocid="announcement_title_input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-type">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as AnnouncementType)}
                >
                  <SelectTrigger
                    id="announcement-type"
                    className="w-full"
                    data-ocid="announcement_type_select"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABEL) as AnnouncementType[]).map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {type === AnnouncementType.other && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
                <div className="space-y-2">
                  <Label>Custom colour</Label>
                  <div
                    className="flex flex-wrap gap-2"
                    data-ocid="custom_color_picker"
                  >
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Select colour ${color}`}
                        onClick={() => setCustomColor(color)}
                        className={cn(
                          "size-8 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          customColor === color
                            ? "border-foreground"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                        data-ocid="custom_color_swatch"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom icon</Label>
                  <div
                    className="flex flex-wrap gap-2"
                    data-ocid="custom_icon_picker"
                  >
                    {PRESET_ICONS.map(({ name, icon: Icon }) => (
                      <button
                        key={name}
                        type="button"
                        aria-label={`Select icon ${name}`}
                        onClick={() => setCustomIcon(name)}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          customIcon === name
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-accent",
                        )}
                        data-ocid="custom_icon_option"
                      >
                        <Icon className="size-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Preview:</span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${customColor}1a`,
                      borderColor: `${customColor}55`,
                      color: customColor,
                    }}
                  >
                    <selectedIcon.icon className="size-3" />
                    {TYPE_LABEL[AnnouncementType.other]}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the announcement message…"
                data-ocid="announcement_message_input"
              />
            </div>

            <Button
              type="submit"
              disabled={!canPost || postMutation.isPending}
              data-ocid="post_announcement_button"
            >
              {postMutation.isPending ? "Posting…" : "Post announcement"}
            </Button>
          </form>

          <div className="border-t border-border pt-5">
            <h3 className="mb-3 font-display text-sm font-semibold">
              Existing announcements
            </h3>
            {announcements.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center"
                data-ocid="empty_state"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bell className="size-5" />
                </div>
                <p className="text-sm font-medium">No announcements yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Post your first announcement above to show a banner across the
                  portal.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" data-ocid="announcements_list">
                {announcements.map((a, index) => (
                  <li
                    key={a.id.toString()}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
                    data-ocid={`announcement.item.${index + 1}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <AnnouncementTypeBadge
                          type={a.announcementType}
                          color={a.color}
                        />
                        {a.active ? (
                          <Badge
                            variant="secondary"
                            className="gap-1"
                            data-ocid="announcement_status_badge"
                          >
                            <CheckCircle2 className="size-3 text-success" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            data-ocid="announcement_status_badge"
                          >
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 font-medium">{a.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {a.message}
                      </p>
                    </div>
                    {a.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateMutation.mutate(a.id)}
                        disabled={deactivateMutation.isPending}
                        data-ocid="deactivate_announcement_button"
                      >
                        Deactivate
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discord settings */}
      <Card className="gap-4" data-ocid="discord_settings_section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <MessageSquare className="size-4 text-primary" />
            Discord settings
          </CardTitle>
          <CardDescription>
            Configure how users authenticate with Discord.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guild-id">Guild ID</Label>
              <div className="flex gap-2">
                <Input
                  id="guild-id"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  placeholder={settings?.guildId || "Enter guild ID"}
                  data-ocid="guild_id_input"
                />
                <Button
                  variant="outline"
                  onClick={() => guildIdMutation.mutate(guildId)}
                  disabled={
                    guildIdMutation.isPending || guildId.trim().length === 0
                  }
                  data-ocid="save_guild_id_button"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current value: {settings?.guildId || "Not set"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guild-required">Require guild membership</Label>
              <div className="flex h-9 items-center justify-between rounded-md border border-border px-3">
                <span className="text-sm text-muted-foreground">
                  Users must be in the guild to log in
                </span>
                <Switch
                  id="guild-required"
                  checked={settings?.guildRequired ?? false}
                  onCheckedChange={(checked) =>
                    guildRequiredMutation.mutate(checked)
                  }
                  disabled={guildRequiredMutation.isPending}
                  data-ocid="guild_required_switch"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {settings?.guildRequired
                  ? "Membership is currently required."
                  : "Anyone with a Discord account can log in."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Client ID</Label>
              <p className="truncate font-mono text-sm">
                {settings?.clientId || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Client secret
              </Label>
              <p className="truncate font-mono text-sm">
                {settings?.clientSecret
                  ? "•".repeat(Math.min(settings.clientSecret.length, 12))
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bot token</Label>
              <p className="truncate font-mono text-sm">
                {settings?.botToken
                  ? "•".repeat(Math.min(settings.botToken.length, 12))
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
