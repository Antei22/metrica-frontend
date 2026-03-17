import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { addTutorStudent, listTutorStudents } from "../api/students";
import { AppLayout } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingState } from "../components/DataState";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getErrorMessage } from "../lib/errors";
import type { TutorStudent } from "../types/domain";

function getStatusBadge(status: TutorStudent["lastSubmissionStatus"]) {
  if (status === "checked") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "pending") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getStatusLabel(status: TutorStudent["lastSubmissionStatus"]) {
  if (status === "checked") {
    return "Проверено";
  }

  if (status === "pending") {
    return "На проверке";
  }

  return "Нет отправок";
}

export function TutorStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return students;
    }

    return students.filter((student) =>
      [student.fullName, student.subject, student.classInfo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery, students]);

  async function loadStudents() {
    setLoading(true);
    setError(null);

    try {
      setStudents(await listTutorStudents());
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Не удалось загрузить список учеников."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  async function handleAddStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const createdStudent = await addTutorStudent(studentEmail);
      setStudents((currentStudents) => [createdStudent, ...currentStudents]);
      setStudentEmail("");
      setIsDialogOpen(false);
      toast.success("Ученик добавлен");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Не удалось добавить ученика."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout
      title="Мои ученики"
      description="Добавляйте учеников по email и отслеживайте статус их последней отправленной домашней работы."
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
              Добавить ученика
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить ученика</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleAddStudent}>
              <div className="space-y-2">
                <Label htmlFor="student-email">Email ученика</Label>
                <Input
                  id="student-email"
                  placeholder="student@example.com"
                  type="email"
                  value={studentEmail}
                  onChange={(event) => setStudentEmail(event.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  className="bg-slate-900 text-white hover:bg-slate-800"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Добавляем..." : "Добавить"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? <LoadingState title="Загружаем учеников..." /> : null}

      {!loading && error ? (
        <ErrorState
          title="Не удалось загрузить учеников"
          description={error}
          actionLabel="Повторить"
          onAction={() => void loadStudents()}
        />
      ) : null}

      {!loading && !error ? (
        <>
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Всего учеников</p>
                  <p className="text-3xl font-semibold text-slate-900">{students.length}</p>
                </div>
                <div className="w-full sm:max-w-xs">
                  <Input
                    placeholder="Поиск по имени, предмету или классу"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {students.length === 0 ? (
            <EmptyState
              title="Пока нет учеников"
              description="Добавьте первого ученика по email, чтобы создавать для него занятия и принимать домашние задания."
              actionLabel="Добавить ученика"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : null}

          {students.length > 0 && filteredStudents.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте другой запрос или очистите поиск."
            />
          ) : null}

          {filteredStudents.length > 0 ? (
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className="rounded-3xl border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  <CardHeader className="gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>{student.fullName}</CardTitle>
                        <p className="mt-2 text-sm text-slate-500">
                          {student.subject || "Предмет не указан"}
                          {student.classInfo ? ` • ${student.classInfo}` : ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(student.lastSubmissionStatus)}`}
                      >
                        {getStatusLabel(student.lastSubmissionStatus)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Связь с учеником: #{student.id}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => navigate("/tutor/dashboard")}
                      >
                        Создать занятие
                      </Button>
                      {student.lastSubmissionStatus === "pending" ? (
                        <Button
                          className="bg-slate-900 text-white hover:bg-slate-800"
                          onClick={() => navigate("/tutor/homework")}
                        >
                          Проверить ДЗ
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}
