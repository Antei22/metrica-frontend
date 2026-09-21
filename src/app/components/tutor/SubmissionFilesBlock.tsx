import { formatDate, formatDateClock } from "../../lib/format";
import { isSubmittedAfterHomeworkDeadline } from "../../lib/homework";
import type { LessonMaterial } from "../../types/domain";
import { FileLinkButton } from "../FileLinkButton";

export function SubmissionFilesBlock({
  homeworkDeadline,
  homeworkDeadlineMissed,
  files,
  submittedAt,
  title,
}: {
  homeworkDeadline?: string | null;
  homeworkDeadlineMissed?: boolean;
  files: LessonMaterial[];
  submittedAt?: string | null;
  title: string;
}) {
  if (files.length === 0) {
    return null;
  }

  const submittedTime = formatDateClock(submittedAt);
  const submittedLate = isSubmittedAfterHomeworkDeadline(
    homeworkDeadline,
    submittedAt,
    homeworkDeadlineMissed,
  );

  return (
    <div className="space-y-2">
      {homeworkDeadline !== undefined ? (
        <p className="text-sm text-muted-foreground">
          Дедлайн ДЗ: {homeworkDeadline ? formatDate(homeworkDeadline) : "не задан"}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{title}:</p>
        {submittedTime ? (
          <p className={submittedLate ? "font-medium text-danger-foreground" : undefined}>
            Отправлено в {submittedTime}
          </p>
        ) : null}
      </div>
      <div className="flex max-w-full flex-col items-start gap-2">
        {files.map((file) => (
          <FileLinkButton file={file} fallback="Открыть файл" key={file.id} />
        ))}
      </div>
    </div>
  );
}
