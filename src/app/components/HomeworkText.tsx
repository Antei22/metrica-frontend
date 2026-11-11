/** Render plain text, linking only HTTP(S) URLs. React escapes all user content. */
export function HomeworkText({ text }: { text?: string | null }) {
  if (!text?.trim()) return null;
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/gi);
  return (
    <div className="space-y-2 rounded-2xl border border-border p-4">
      <p className="text-sm font-medium text-foreground">Задание и ссылки</p>
      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
        {parts.map((part, index) => {
          if (!/^https?:\/\//i.test(part)) return part;
          const url = part.replace(/[.,!?;:)}\]]+$/, "");
          return (
            <span key={index}>
              <a
                className="text-primary underline"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {url}
              </a>
              {part.slice(url.length)}
            </span>
          );
        })}
      </p>
    </div>
  );
}
