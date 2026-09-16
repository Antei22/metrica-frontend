import { Button } from "./ui/button";

interface MessageStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LoadingState({ title = "Загрузка..." }: { title?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted-foreground shadow-soft">
      {title}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: MessageStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-quiet/40 bg-white p-10 text-center shadow-soft">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5 rounded-full" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
}: MessageStateProps) {
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger-soft p-10 text-center shadow-soft">
      <h2 className="text-lg font-semibold text-danger">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-danger">{description}</p>
      {actionLabel && onAction ? (
        <Button
          className="mt-5 rounded-full"
          variant="destructive"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
