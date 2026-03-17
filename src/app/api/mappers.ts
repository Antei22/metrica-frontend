import type {
  CurrentUser,
  HomeworkReview,
  HomeworkStatus,
  HomeworkSubmission,
  Lesson,
  LessonMaterial,
  StudentSubmissionStatus,
  SubmissionStatus,
  TutorStudent,
} from "../types/domain";

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as ApiRecord;
  }

  return null;
}

function pick(record: ApiRecord, ...keys: string[]) {
  for (const key of keys) {
    if (key in record && record[key] !== undefined) {
      return record[key];
    }
  }

  return undefined;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return false;
}

function normalizeFullName(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function getFilenameFromPath(path: string | null) {
  if (!path) {
    return null;
  }

  const normalizedPath = path.replace(/\\/g, "/");
  const parts = normalizedPath.split("/");
  return parts[parts.length - 1] || null;
}

function normalizeStudentSubmissionStatus(value: unknown): StudentSubmissionStatus {
  if (value === "pending" || value === "checked" || value === "none") {
    return value;
  }

  if (value === "submitted") {
    return "pending";
  }

  return "none";
}

function normalizeSubmissionStatus(value: unknown): SubmissionStatus {
  return value === "checked" ? "checked" : "submitted";
}

function normalizeHomeworkStatus(
  explicitStatus: unknown,
  submission: HomeworkSubmission | null,
): HomeworkStatus {
  if (
    explicitStatus === "not_submitted" ||
    explicitStatus === "not_sent" ||
    explicitStatus === "none"
  ) {
    return "not_sent";
  }

  if (
    explicitStatus === "checked" ||
    explicitStatus === "done" ||
    explicitStatus === "completed"
  ) {
    return "checked";
  }

  if (
    explicitStatus === "sent" ||
    explicitStatus === "submitted" ||
    explicitStatus === "pending"
  ) {
    return "sent";
  }

  if (submission?.status === "checked") {
    return "checked";
  }

  if (submission?.status === "submitted") {
    return "sent";
  }

  return "not_sent";
}

function isLessonMaterial(value: LessonMaterial | null): value is LessonMaterial {
  return value !== null;
}

export function mapCurrentUser(payload: unknown): CurrentUser {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid user payload");
  }

  const firstName = asString(pick(record, "first_name", "firstName")) || "";
  const lastName = asString(pick(record, "last_name", "lastName"));
  const role = pick(record, "role");

  if (role !== "student" && role !== "tutor") {
    throw new Error("Invalid user role");
  }

  return {
    id: asNumber(pick(record, "id")) || 0,
    email: asString(pick(record, "email")) || "",
    firstName,
    lastName,
    fullName: normalizeFullName(firstName, lastName),
    role,
  };
}

export function mapTutorStudent(payload: unknown): TutorStudent {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid student payload");
  }

  return {
    id: asNumber(pick(record, "id")) || 0,
    studentId: asNumber(pick(record, "student_id", "studentId")) || 0,
    fullName:
      asString(pick(record, "full_name", "fullName", "student_name", "student")) ||
      "Student",
    subject: asString(pick(record, "subject")),
    classInfo: asString(pick(record, "class_info", "classInfo", "student_inf")),
    lastSubmissionId:
      asNumber(pick(record, "last_submission_id", "lastSubmissionId")) || null,
    lastSubmissionStatus: normalizeStudentSubmissionStatus(
      pick(record, "last_submission_status", "lastSubmissionStatus"),
    ),
  };
}

function mapLessonMaterial(
  payload: unknown,
  fallbackKind: LessonMaterial["kind"],
): LessonMaterial | null {
  const record = asRecord(payload);

  if (!record) {
    return null;
  }

  const materialId = pick(
    record,
    "id",
    "file_id",
    "fileId",
    "path",
    "url",
    "file_url",
    "fileUrl",
    "filename",
    "name",
  );
  const url =
    asString(pick(record, "url", "path", "file_url", "fileUrl", "download_url")) ||
    "";

  return {
    id: materialId != null ? String(materialId) : `${fallbackKind}-${Math.random()}`,
    fileId: asNumber(pick(record, "file_id", "fileId", "id")),
    name:
      asString(pick(record, "filename", "name", "title", "file_name", "fileName")) ||
      getFilenameFromPath(url) ||
      "File",
    url,
    kind:
      (asString(pick(record, "kind")) as LessonMaterial["kind"] | null) ||
      fallbackKind,
    mimeType: asString(pick(record, "type", "mime_type", "mimeType")),
  };
}

function mapHomeworkSubmission(payload: unknown): HomeworkSubmission | null {
  const record = asRecord(payload);

  if (!record) {
    return null;
  }

  const submissionFile = asRecord(
    pick(record, "submission_file", "submissionFile", "file"),
  );
  const fileUrl =
    asString(pick(record, "file_url", "fileUrl", "url", "path")) ||
    (submissionFile
      ? asString(pick(submissionFile, "file_url", "fileUrl", "url", "path"))
      : null);
  const fileName =
    asString(pick(record, "file_name", "fileName", "filename", "name")) ||
    (submissionFile
      ? asString(
          pick(submissionFile, "file_name", "fileName", "filename", "name"),
        )
      : null) ||
    getFilenameFromPath(fileUrl);
  const comment = asString(pick(record, "comment", "submission_comment"));
  const rawStatus = pick(record, "status", "homework_status", "submission_status");
  const hasSubmission =
    submissionFile !== null ||
    fileUrl !== null ||
    fileName !== null ||
    comment !== null ||
    rawStatus === "submitted" ||
    rawStatus === "pending" ||
    rawStatus === "checked" ||
    rawStatus === "sent";

  if (!hasSubmission) {
    return null;
  }

  return {
    id: asNumber(pick(record, "id", "submission_id")) || 0,
    status: normalizeSubmissionStatus(rawStatus),
    comment,
    fileUrl,
    fileName,
    submittedAt: asString(
      pick(record, "submitted_at", "submittedAt", "created_at", "createdAt"),
    ),
  };
}

export function mapLesson(payload: unknown): Lesson {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid lesson payload");
  }

  const materialsSource = pick(record, "materials", "material_files", "lesson_materials");
  const homeworkFilesSource = pick(
    record,
    "homework_task_files",
    "homework_files",
    "homeworkMaterials",
  );
  const submission =
    mapHomeworkSubmission(
      pick(record, "submission", "homework_submission", "last_submission"),
    ) ||
    mapHomeworkSubmission({
      submission_file: pick(record, "submission_file", "submissionFile"),
      submission_comment: pick(record, "submission_comment", "submissionComment"),
      homework_status: pick(
        record,
        "homework_status",
        "homeworkStatus",
        "submission_status",
      ),
    });

  return {
    id: asNumber(pick(record, "id")) || 0,
    tutorStudentId:
      asNumber(pick(record, "tutor_student_id", "tutorStudentId")) || 0,
    date: asString(pick(record, "date", "lesson_date", "lessonDate")),
    time: asString(pick(record, "time", "lesson_time", "lessonTime")),
    topic: asString(pick(record, "topic", "lesson_topic", "lessonTopic")),
    meetLink: asString(pick(record, "meet_link", "meetLink", "meeting_link")),
    homeworkDone: asBoolean(pick(record, "homework_done", "homeworkDone")),
    homeworkDeadline: asString(
      pick(record, "homework_deadline", "homeworkDeadline"),
    ),
    homeworkStatus: normalizeHomeworkStatus(
      pick(record, "homework_status", "homeworkStatus", "submission_status"),
      submission,
    ),
    studentName: asString(
      pick(record, "student_name", "studentName", "student", "full_name"),
    ),
    tutorName: asString(pick(record, "tutor_name", "tutorName", "tutor")),
    subject: asString(pick(record, "subject")),
    classInfo: asString(pick(record, "class_info", "classInfo", "student_inf")),
    materials: Array.isArray(materialsSource)
      ? materialsSource
          .map((file) => mapLessonMaterial(file, "material"))
          .filter(isLessonMaterial)
      : [],
    homeworkTaskFiles: Array.isArray(homeworkFilesSource)
      ? homeworkFilesSource
          .map((file) => mapLessonMaterial(file, "homework_task"))
          .filter(isLessonMaterial)
      : [],
    submission,
  };
}

export function mapHomeworkReview(payload: unknown): HomeworkReview {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid submission payload");
  }

  const fileUrl = asString(pick(record, "file_url", "fileUrl", "url", "path"));

  return {
    id: asNumber(pick(record, "id")) || 0,
    student: asString(pick(record, "student", "student_name")) || "Student",
    lessonDate: asString(pick(record, "lesson_date", "lessonDate", "date")),
    lessonTopic: asString(
      pick(record, "lesson_topic", "lessonTopic", "topic"),
    ),
    fileUrl,
    fileName:
      asString(pick(record, "file_name", "fileName", "filename", "name")) ||
      getFilenameFromPath(fileUrl),
    status: normalizeSubmissionStatus(pick(record, "status")),
    comment: asString(pick(record, "comment")),
  };
}
