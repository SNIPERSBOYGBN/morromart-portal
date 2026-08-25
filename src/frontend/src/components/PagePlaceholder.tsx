import { Construction } from "lucide-react";

/**
 * Temporary shell rendered for routes whose page bodies are built by the
 * dedicated page tasks. Replaced as each page task lands.
 */
export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6" data-ocid="page">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-16 text-center"
        data-ocid="empty_state"
      >
        <Construction className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          This section is being set up.
        </p>
      </div>
    </div>
  );
}
