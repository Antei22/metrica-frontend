import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { formatDate, formatDateTime } from "../../lib/format";
import type { Lesson } from "../../types/domain";
import { LessonFilesCard } from "../LessonFilesCard";
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
        <DialogHeader>
          <DialogTitle>{lesson.topic || "Занятие без названия"}</DialogTitle>
          <DialogDescription>
            {formatDateTime(lesson.date, lesson.time)}
            {lesson.studentName ? ` • ${lesson.studentName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Основная информация</p>
            <div className="mt-3 space-y-2">
              <p>Ученик: {lesson.studentName || "Не указан"}</p>
              <p>Дата и время: {formatDateTime(lesson.date, lesson.time)}</p>
              <p>
                Дедлайн ДЗ: {lesson.homeworkDeadline ? formatDate(lesson.homeworkDeadline) : "не задан"}
              </p>
              <p>Предмет: {lesson.subject || "Не указан"}</p>
              <p>Класс/группа: {lesson.classInfo || "Не указано"}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Что доступно по занятию</p>
            <div className="mt-3 space-y-2">
              <p>Материалов: {lesson.materials.length}</p>
              <p>Файлов домашнего задания: {lesson.homeworkTaskFiles.length}</p>
              <p>
                Ссылка на созвон: {lesson.meetLink ? "добавлена" : "не добавлена"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {lesson.meetLink ? (
                <Button asChild variant="outline">
                  <a href={lesson.meetLink} rel="noreferrer" target="_blank">
                    <ExternalLink className="size-4" />
                    Открыть созвон
                  </a>
                </Button>
              ) : null}
              <Button onClick={() => onEdit(lesson)} variant="outline">
                <Pencil className="size-4" />
                Изменить занятие
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <LessonFilesCard files={lesson.materials} title="Материалы занятия" />
          <LessonFilesCard files={lesson.homeworkTaskFiles} title="Файлы домашнего задания" />
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
                  Это действие нельзя отменить. Занятие, прикрепленные материалы и ссылка на созвон исчезнут из расписания.
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
