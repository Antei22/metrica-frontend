import { resolveApiUrl } from "../api/client";
import type { LessonMaterial } from "../types/domain";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function getFileKindLabel(kind: LessonMaterial["kind"]) {
  if (kind === "homework_task") {
    return "Файл к домашнему заданию";
  }

  if (kind === "submission") {
    return "Отправленная работа";
  }

  return "Материал";
}

interface LessonFilesCardProps {
  files: LessonMaterial[];
  title: string;
  emptyMessage?: string;
}

export function LessonFilesCard({
  files,
  title,
  emptyMessage = "Пока нет прикрепленных файлов.",
}: LessonFilesCardProps) {
  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="mt-1 text-sm text-slate-500">{getFileKindLabel(file.kind)}</p>
              </div>
              {file.url ? (
                <Button asChild variant="outline">
                  <a href={resolveApiUrl(file.url)} rel="noreferrer" target="_blank">
                    Открыть
                  </a>
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
