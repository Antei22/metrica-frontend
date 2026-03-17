import { Button } from "./ui/button";

interface MessageStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function LoadingState({ title = "Загрузка..." }: { title?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
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
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">{description}</p>
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
    <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-red-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-red-700">{description}</p>
      {actionLabel && onAction ? (
        <Button
          className="mt-5 rounded-full bg-red-600 text-white hover:bg-red-700"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
