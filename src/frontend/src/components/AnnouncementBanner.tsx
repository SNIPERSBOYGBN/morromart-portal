import { type Announcement, AnnouncementType, createActor } from "@/backend";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  PartyPopper,
  ShieldAlert,
  Sparkles,
  Star,
} from "lucide-react";

interface TypeStyle {
  icon: LucideIcon;
  className: string;
}

/**
 * Preset icons the admin can pick for "Other" announcements. The chosen icon's
 * name is stored on the announcement and looked up here so the banner renders
 * the admin-selected icon instead of always defaulting to Megaphone.
 */
const PRESET_ICONS: Record<string, LucideIcon> = {
  Megaphone,
  Sparkles,
  Star,
  Party: PartyPopper,
  Message: MessageSquare,
  Shield: ShieldAlert,
};

const TYPE_STYLES: Record<AnnouncementType, TypeStyle> = {
  [AnnouncementType.info]: {
    icon: Info,
    className: "border-info/30 bg-info/10 text-info",
  },
  [AnnouncementType.warning]: {
    icon: AlertTriangle,
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  [AnnouncementType.error]: {
    icon: AlertCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  [AnnouncementType.other]: {
    icon: Megaphone,
    className: "border-border bg-accent/40 text-accent-foreground",
  },
};

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const style = TYPE_STYLES[announcement.announcementType];
  // "Other" announcements carry a custom colour and icon chosen by the admin.
  const customColor = announcement.color;
  const Icon =
    announcement.announcementType === AnnouncementType.other &&
    announcement.icon
      ? (PRESET_ICONS[announcement.icon] ?? style.icon)
      : style.icon;

  return (
    <div
      data-ocid="announcement"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        style.className,
      )}
      style={
        announcement.announcementType === AnnouncementType.other && customColor
          ? {
              backgroundColor: `${customColor}1a`,
              borderColor: `${customColor}55`,
            }
          : undefined
      }
    >
      <Icon
        className="mt-0.5 size-5 shrink-0"
        style={
          announcement.announcementType === AnnouncementType.other &&
          customColor
            ? { color: customColor }
            : undefined
        }
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{announcement.title}</p>
        <p className="text-sm opacity-90">{announcement.message}</p>
      </div>
    </div>
  );
}

/**
 * Renders the site-wide announcement banners at the top of every page.
 * Only active announcements are shown.
 */
export function AnnouncementBanner() {
  const { actor, isFetching } = useActor(createActor);

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAnnouncements();
    },
    enabled: !!actor && !isFetching,
  });

  const active = announcements.filter((a) => a.active);

  if (active.length === 0) return null;

  return (
    <div className="space-y-2" data-ocid="announcement_banner">
      {active.map((a) => (
        <AnnouncementItem key={a.id.toString()} announcement={a} />
      ))}
    </div>
  );
}
