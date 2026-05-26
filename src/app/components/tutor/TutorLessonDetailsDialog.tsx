import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { resolveApiUrl } from "../../api/client";
import { formatDate, formatDateTime } from "../../lib/format";
import type { Lesson } from "../../types/domain";
import { LessonFilesCard } from "../LessonFilesCard";
import { StarValue } from "../StarValue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface TutorLessonDetailsDialogProps {
  isDeleting: boolean;
  lesson: Lesson | null;
  onDelete: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function DetailLine({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <p>
      <span className="font-semibold text-slate-900">{label}:</span>{" "}
      <span>{children}</span>
    </p>
  );
}

export function TutorLessonDetailsDialog({
  isDeleting,
  lesson,
  onDelete,
  onEdit,
  onOpenChange,
  open,
}: TutorLessonDetailsDialogProps) {
  if (!lesson) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="pr-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle>{lesson.topic || "Занятие без названия"}</DialogTitle>
              <DialogDescription className="mt-2">
                {formatDateTime(lesson.date, lesson.time)}
                {lesson.studentName ? ` • ${lesson.studentName}` : ""}
              </DialogDescription>
            </div>
            <Button onClick={() => onEdit(lesson)} size="sm" variant="outline">
              <Pencil className="size-4" />
              Изменить
            </Button>
          </div>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Основная информация</p>
            <div className="mt-3 space-y-2">
              <DetailLine label="Ученик">{lesson.studentName || "Не указан"}</DetailLine>
              <DetailLine label="Дата и время">
                {formatDateTime(lesson.date, lesson.time)}
              </DetailLine>
              <DetailLine label="Дедлайн ДЗ">
                {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
              </DetailLine>
              <DetailLine label="Предмет">{lesson.subject || "Не указан"}</DetailLine>
              <DetailLine label="Класс/группа">
                {lesson.classInfo || "Не указано"}
              </DetailLine>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Что доступно по занятию</p>
            <div className="mt-3 space-y-2">
              <DetailLine label="Материалов">{lesson.materials.length}</DetailLine>
              <DetailLine label="Материалов домашнего задания">
                {lesson.homeworkTaskFiles.length}
              </DetailLine>
              <DetailLine label="Оценка за ДЗ">
                {lesson.homeworkGrade ? `${lesson.homeworkGrade} из 5` : "не выставлена"}
              </DetailLine>
              <DetailLine label="Ссылка на звонок">
                {lesson.meetLink ? "добавлена" : "не добавлена"}
              </DetailLine>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {lesson.meetLink ? (
                <Button asChild size="sm" variant="outline">
                  <a href={lesson.meetLink} rel="noreferrer" target="_blank">
                    <ExternalLink className="size-4" />
                    Подключиться к звоноку
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <LessonFilesCard files={lesson.materials} title="Материалы занятия" />
          <LessonFilesCard
            files={lesson.homeworkTaskFiles}
            title="Материалы домашнего задания"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className="font-semibold text-slate-900">Домашнее задание</p>
            <StarValue value={lesson.homeworkGrade} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-900">Решение ученика</p>
              {lesson.submission?.fileUrl ? (
                <Button asChild className="mt-3" variant="outline">
                  <a
                    href={resolveApiUrl(lesson.submission.fileUrl)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Открыть файл
                  </a>
                </Button>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Файл еще не отправлен.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-900">Проверенный файл</p>
              {lesson.checkedFile?.url ? (
                <Button asChild className="mt-3" variant="outline">
                  <a
                    href={resolveApiUrl(lesson.checkedFile.url)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Открыть файл с правками
                  </a>
                </Button>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Проверенный файл не прикреплен.</p>
              )}
            </div>
          </div>

          {lesson.submission?.comment ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Комментарий репетитора</p>
              <p className="mt-2">{lesson.submission.comment}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="text-red-600 hover:text-red-700" type="button" variant="ghost">
                <Trash2 className="size-4" />
                Удалить занятие
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить занятие?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Занятие, прикрепленные материалы и ссылка на звонок исчезнут из расписания.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={isDeleting}
                  onClick={() => onDelete(lesson)}
                >
                  {isDeleting ? "Удаляем..." : "Удалить"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
