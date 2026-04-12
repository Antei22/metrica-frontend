import { X } from "lucide-react";
import { resolveApiUrl } from "../../api/client";
import { FIELD_LIMITS } from "../../lib/formValidation";
import type { LessonMaterial, TutorStudent } from "../../types/domain";
import { DateInputWithCalendar } from "./DateInputWithCalendar";
import { TimeInput } from "./TimeInput";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export interface LessonFormValues {
  tutorStudentId: string;
  date: string;
  time: string;
  topic: string;
  meetLink: string;
  homeworkDeadline: string;
}

export const initialLessonFormValues: LessonFormValues = {
  tutorStudentId: "",
  date: "",
  time: "",
  topic: "",
  meetLink: "",
  homeworkDeadline: "",
};

interface TutorLessonFormDialogProps {
  description?: string;
  existingHomeworkFiles?: LessonMaterial[];
  existingMaterials?: LessonMaterial[];
  form: LessonFormValues;
  formError?: string | null;
  homeworkFiles: File[];
  isSubmitting: boolean;
  materialFiles: File[];
  onAddHomeworkFiles: (files: File[]) => void;
  onAddMaterialFiles: (files: File[]) => void;
  onFormChange: <K extends keyof LessonFormValues>(
    key: K,
    value: LessonFormValues[K],
  ) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveHomeworkFile: (index: number) => void;
  onRemoveMaterialFile: (index: number) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  open: boolean;
  students: TutorStudent[];
  submitLabel: string;
  submittingLabel: string;
  title: string;
}

function getPendingFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function PendingFiles({
  files,
  onRemove,
  title,
}: {
  files: File[];
  onRemove: (index: number) => void;
  title: string;
}) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={getPendingFileKey(file)}
            className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              className="shrink-0"
              onClick={() => onRemove(index)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExistingFiles({
  files,
  title,
}: {
  files: LessonMaterial[];
  title: string;
}) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500">Уже прикреплено к занятию</p>
            </div>
            {file.url ? (
              <Button asChild size="sm" type="button" variant="outline">
                <a href={resolveApiUrl(file.url)} rel="noreferrer" target="_blank">
                  Открыть
                </a>
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TutorLessonFormDialog({
  description,
  existingHomeworkFiles = [],
  existingMaterials = [],
  form,
  formError,
  homeworkFiles,
  isSubmitting,
  materialFiles,
  onAddHomeworkFiles,
  onAddMaterialFiles,
  onFormChange,
  onOpenChange,
  onRemoveHomeworkFile,
  onRemoveMaterialFile,
  onSubmit,
  open,
  students,
  submitLabel,
  submittingLabel,
  title,
}: TutorLessonFormDialogProps) {
  function handleMaterialFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length > 0) {
      onAddMaterialFiles(nextFiles);
    }

    event.target.value = "";
  }

  function handleHomeworkFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length > 0) {
      onAddHomeworkFiles(nextFiles);
    }

    event.target.value = "";
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form className="space-y-5" onSubmit={onSubmit}>
          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="lesson-student">Ученик</Label>
            <select
              id="lesson-student"
              className="border-input bg-input-background flex h-10 w-full rounded-md border px-3 text-sm outline-none"
              onChange={(event) => onFormChange("tutorStudentId", event.target.value)}
              value={form.tutorStudentId}
            >
              <option value="">Выберите ученика</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lesson-date">Дата</Label>
              <DateInputWithCalendar
                id="lesson-date"
                onChange={(value) => onFormChange("date", value)}
                required
                value={form.date}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-time">Время</Label>
              <TimeInput
                id="lesson-time"
                onChange={(value) => onFormChange("time", value)}
                required
                value={form.time}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="lesson-topic">Тема занятия</Label>
              <span className="text-xs text-slate-400">
                {form.topic.trim().length}/{FIELD_LIMITS.lessonTopic}
              </span>
            </div>
            <Input
              id="lesson-topic"
              maxLength={FIELD_LIMITS.lessonTopic}
              onChange={(event) => onFormChange("topic", event.target.value)}
              placeholder="Например, дроби и проценты"
              required
              value={form.topic}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-link">Ссылка на созвон</Label>
            <Input
              id="lesson-link"
              maxLength={FIELD_LIMITS.meetLink}
              onChange={(event) => onFormChange("meetLink", event.target.value)}
              placeholder="https://..."
              type="url"
              value={form.meetLink}
            />
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 p-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-materials">Материалы занятия</Label>
              <Input id="lesson-materials" multiple onChange={handleMaterialFilesChange} type="file" />
              <p className="text-xs text-slate-500">
                Можно добавлять файлы в несколько подходов: новые файлы будут дополнять текущий список.
              </p>
            </div>

            <ExistingFiles files={existingMaterials} title="Уже прикрепленные материалы" />
            <PendingFiles
              files={materialFiles}
              onRemove={onRemoveMaterialFile}
              title="Новые материалы для загрузки"
            />
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 p-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-homework-files">Файлы домашнего задания</Label>
              <Input
                id="lesson-homework-files"
                multiple
                onChange={handleHomeworkFilesChange}
                type="file"
              />
            </div>

            <ExistingFiles files={existingHomeworkFiles} title="Уже прикрепленные файлы ДЗ" />
            <PendingFiles
              files={homeworkFiles}
              onRemove={onRemoveHomeworkFile}
              title="Новые файлы ДЗ для загрузки"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-deadline">Дедлайн домашнего задания</Label>
            <DateInputWithCalendar
              id="lesson-deadline"
              onChange={(value) => onFormChange("homeworkDeadline", value)}
              value={form.homeworkDeadline}
            />
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Отмена
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" disabled={isSubmitting} type="submit">
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
