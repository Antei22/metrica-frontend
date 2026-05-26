import type {
  BonusTask,
  CurrentUser,
  Gamification,
  HomeworkReview,
  HomeworkStatus,
  HomeworkSubmission,
  Lesson,
  LessonMaterial,
  ParentChild,
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

function mapLessonMaterials(
  value: unknown,
  fallbackKind: LessonMaterial["kind"],
) {
  return Array.isArray(value)
    ? value.map((file) => mapLessonMaterial(file, fallbackKind)).filter(isLessonMaterial)
    : [];
}

export function mapCurrentUser(payload: unknown): CurrentUser {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid user payload");
  }

  const firstName = asString(pick(record, "first_name", "firstName")) || "";
  const lastName = asString(pick(record, "last_name", "lastName"));
  const role = pick(record, "role");

  if (role !== "student" && role !== "tutor" && role !== "parent") {
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
    email: asString(pick(record, "email", "student_email", "studentEmail")) || "",
    firstName: asString(pick(record, "first_name", "firstName")) || "",
    lastName: asString(pick(record, "last_name", "lastName")),
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
    starRewardsEnabled: asBoolean(
      pick(record, "star_rewards_enabled", "starRewardsEnabled"),
    ),
    parentContactEnabled: asBoolean(
      pick(record, "parent_contact_enabled", "parentContactEnabled"),
    ),
    starGoal: asNumber(pick(record, "star_goal", "starGoal")),
    starRewardTitle: asString(
      pick(record, "star_reward_title", "starRewardTitle"),
    ),
    earnedStars: asNumber(pick(record, "earned_stars", "earnedStars")) || 0,
  };
}

export function mapParentChild(payload: unknown): ParentChild {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid child payload");
  }

  return {
    id: asNumber(pick(record, "id")) || 0,
    studentId: asNumber(pick(record, "student_id", "studentId")) || 0,
    fullName:
      asString(pick(record, "full_name", "fullName", "student_name", "student")) ||
      "Ученик",
    createdAt: asString(pick(record, "created_at", "createdAt")),
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
  const submissionFiles = mapLessonMaterials(
    pick(record, "submission_files", "submissionFiles", "files"),
    "submission",
  );
  const normalizedSubmissionFiles =
    submissionFiles.length > 0
      ? submissionFiles
      : fileUrl
        ? [
            {
              id: `submission-${asNumber(pick(record, "id", "submission_id")) || 0}`,
              fileId: null,
              name: fileName || getFilenameFromPath(fileUrl) || "Домашнее задание",
              url: fileUrl,
              kind: "submission" as const,
              mimeType: null,
            },
          ]
        : [];
  const checkedFiles = mapLessonMaterials(
    pick(record, "checked_files", "checkedFiles", "reviewed_files", "reviewedFiles"),
    "submission",
  );
  const checkedFileUrl = asString(
    pick(
      record,
      "checked_file_url",
      "checkedFileUrl",
      "reviewed_file_url",
      "reviewedFileUrl",
    ),
  );
  const checkedFileName = asString(
    pick(
      record,
      "checked_file_name",
      "checkedFileName",
      "reviewed_file_name",
      "reviewedFileName",
    ),
  );
  const normalizedCheckedFiles =
    checkedFiles.length > 0
      ? checkedFiles
      : checkedFileUrl
        ? [
            {
              id: `checked-${asNumber(pick(record, "id", "submission_id")) || 0}`,
              fileId: null,
              name:
                checkedFileName ||
                getFilenameFromPath(checkedFileUrl) ||
                "Проверенное ДЗ",
              url: checkedFileUrl,
              kind: "submission" as const,
              mimeType: null,
            },
          ]
        : [];
  const comment = asString(pick(record, "comment", "submission_comment"));
  const studentComment = asString(pick(record, "student_comment", "studentComment"));
  const rawStatus = pick(record, "status", "homework_status", "submission_status");
  const hasSubmission =
    submissionFile !== null ||
    fileUrl !== null ||
    fileName !== null ||
    normalizedSubmissionFiles.length > 0 ||
    normalizedCheckedFiles.length > 0 ||
    comment !== null ||
    studentComment !== null ||
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
    studentComment,
    fileUrl,
    fileName,
    files: normalizedSubmissionFiles,
    checkedFileUrl,
    checkedFileName,
    checkedFiles: normalizedCheckedFiles,
    grade: asNumber(pick(record, "grade", "homework_grade", "homeworkGrade")),
    starsAwarded:
      asNumber(
        pick(record, "stars_awarded", "starsAwarded", "homework_stars", "homeworkStars"),
      ) || 0,
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
  const parentMessageFilesSource = pick(
    record,
    "parent_message_files",
    "parentMessageFiles",
  );
  const submission =
    mapHomeworkSubmission(
      pick(record, "submission", "homework_submission", "last_submission"),
    ) ||
    mapHomeworkSubmission({
      submission_file: pick(record, "submission_file", "submissionFile"),
      submission_files: pick(record, "submission_files", "submissionFiles"),
      file_url: asRecord(pick(record, "submission_file", "submissionFile"))
        ? pick(
            asRecord(pick(record, "submission_file", "submissionFile")) || {},
            "file_url",
            "fileUrl",
            "url",
            "path",
          )
        : undefined,
      submission_comment: pick(record, "submission_comment", "submissionComment"),
      student_comment: pick(record, "student_comment", "studentComment"),
      submitted_at: pick(record, "submitted_at", "submittedAt"),
      checked_files: pick(record, "checked_files", "checkedFiles"),
      checked_file_url:
        asString(pick(record, "checked_file_url", "checkedFileUrl")) ||
        (asRecord(pick(record, "checked_file", "checkedFile"))
          ? asString(
              pick(
                asRecord(pick(record, "checked_file", "checkedFile")) || {},
                "file_url",
                "fileUrl",
                "url",
                "path",
              ),
            )
          : null),
      checked_file_name:
        asString(pick(record, "checked_file_name", "checkedFileName")) ||
        (asRecord(pick(record, "checked_file", "checkedFile"))
          ? asString(
              pick(
                asRecord(pick(record, "checked_file", "checkedFile")) || {},
                "filename",
                "name",
                "file_name",
                "fileName",
              ),
            )
          : null),
      grade: pick(record, "homework_grade", "homeworkGrade", "grade"),
      stars_awarded: pick(record, "homework_stars", "homeworkStars", "stars_awarded"),
      homework_status: pick(
        record,
        "homework_status",
        "homeworkStatus",
        "submission_status",
      ),
    });
  const lessonId = asNumber(pick(record, "id")) || 0;

  return {
    id: lessonId,
    tutorStudentId:
      asNumber(pick(record, "tutor_student_id", "tutorStudentId")) || 0,
    starRewardsEnabled: asBoolean(
      pick(record, "star_rewards_enabled", "starRewardsEnabled"),
    ),
    date: asString(pick(record, "date", "lesson_date", "lessonDate")),
    time: asString(pick(record, "time", "lesson_time", "lessonTime")),
    topic: asString(pick(record, "topic", "lesson_topic", "lessonTopic")),
    meetLink: asString(pick(record, "meet_link", "meetLink", "meeting_link")),
    homeworkDone: asBoolean(pick(record, "homework_done", "homeworkDone")),
    homeworkDeadline: asString(
      pick(record, "homework_deadline", "homeworkDeadline"),
    ),
    homeworkDeadlineMissed: asBoolean(
      pick(record, "homework_deadline_missed", "homeworkDeadlineMissed"),
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
    parentMessageFiles: Array.isArray(parentMessageFilesSource)
      ? parentMessageFilesSource
          .map((file) => mapLessonMaterial(file, "parent_message"))
          .filter(isLessonMaterial)
      : [],
    parentComment: asString(pick(record, "parent_comment", "parentComment")),
    submission,
    checkedFile:
      mapLessonMaterial(pick(record, "checked_file", "checkedFile"), "submission") ||
      submission?.checkedFiles[0] ||
      (submission?.checkedFileUrl
        ? {
            id: `checked-${lessonId}`,
            fileId: null,
            name:
              submission.checkedFileName ||
              getFilenameFromPath(submission.checkedFileUrl) ||
              "Проверенное ДЗ",
            url: submission.checkedFileUrl,
            kind: "submission",
            mimeType: null,
          }
        : null),
    homeworkGrade:
      asNumber(pick(record, "homework_grade", "homeworkGrade", "grade")) ||
      submission?.grade ||
      null,
    homeworkStars:
      asNumber(pick(record, "homework_stars", "homeworkStars", "stars_awarded")) ||
      submission?.starsAwarded ||
      0,
  };
}

export function mapHomeworkReview(payload: unknown): HomeworkReview {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid submission payload");
  }

  const fileUrl = asString(pick(record, "file_url", "fileUrl", "url", "path"));
  const fileName =
    asString(pick(record, "file_name", "fileName", "filename", "name")) ||
    getFilenameFromPath(fileUrl);
  const files = mapLessonMaterials(
    pick(record, "submission_files", "submissionFiles", "files"),
    "submission",
  );
  const normalizedFiles =
    files.length > 0
      ? files
      : fileUrl
        ? [
            {
              id: `submission-${asNumber(pick(record, "id")) || 0}`,
              fileId: null,
              name: fileName || getFilenameFromPath(fileUrl) || "Решение ученика",
              url: fileUrl,
              kind: "submission" as const,
              mimeType: null,
            },
          ]
        : [];
  const checkedFileUrl = asString(
    pick(record, "checked_file_url", "checkedFileUrl", "reviewed_file_url"),
  );
  const checkedFileName =
    asString(
      pick(
        record,
        "checked_file_name",
        "checkedFileName",
        "reviewed_file_name",
      ),
    ) || getFilenameFromPath(checkedFileUrl);
  const checkedFiles = mapLessonMaterials(
    pick(record, "checked_files", "checkedFiles", "reviewed_files"),
    "submission",
  );
  const normalizedCheckedFiles =
    checkedFiles.length > 0
      ? checkedFiles
      : checkedFileUrl
        ? [
            {
              id: `checked-${asNumber(pick(record, "id")) || 0}`,
              fileId: null,
              name: checkedFileName || getFilenameFromPath(checkedFileUrl) || "Проверенный файл",
              url: checkedFileUrl,
              kind: "submission" as const,
              mimeType: null,
            },
          ]
        : [];

  return {
    id: asNumber(pick(record, "id")) || 0,
    student: asString(pick(record, "student", "student_name")) || "Student",
    starRewardsEnabled: asBoolean(
      pick(record, "star_rewards_enabled", "starRewardsEnabled"),
    ),
    lessonDate: asString(pick(record, "lesson_date", "lessonDate", "date")),
    lessonTopic: asString(
      pick(record, "lesson_topic", "lessonTopic", "topic"),
    ),
    fileUrl,
    fileName,
    files: normalizedFiles,
    checkedFileUrl,
    checkedFileName,
    checkedFiles: normalizedCheckedFiles,
    status: normalizeSubmissionStatus(pick(record, "status")),
    comment: asString(pick(record, "comment")),
    studentComment: asString(pick(record, "student_comment", "studentComment")),
    submittedAt: asString(
      pick(record, "submitted_at", "submittedAt", "created_at", "createdAt"),
    ),
    homeworkDeadline: asString(
      pick(record, "homework_deadline", "homeworkDeadline"),
    ),
    homeworkDeadlineMissed: asBoolean(
      pick(record, "homework_deadline_missed", "homeworkDeadlineMissed"),
    ),
    grade: asNumber(pick(record, "grade", "homework_grade", "homeworkGrade")),
    starsAwarded:
      asNumber(pick(record, "stars_awarded", "starsAwarded", "homework_stars")) || 0,
  };
}

export function mapBonusTask(payload: unknown): BonusTask {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid bonus task payload");
  }

  return {
    id: asNumber(pick(record, "id")) || 0,
    tutorStudentId:
      asNumber(pick(record, "tutor_student_id", "tutorStudentId")) || 0,
    title: asString(pick(record, "title")) || "Бонусное задание",
    description: asString(pick(record, "description")),
    stars: asNumber(pick(record, "stars")) || 0,
    rewardTitle: asString(pick(record, "reward_title", "rewardTitle")),
    dueDate: asString(pick(record, "due_date", "dueDate")),
    isCompleted: asBoolean(pick(record, "is_completed", "isCompleted")),
    createdAt: asString(pick(record, "created_at", "createdAt")),
    completedAt: asString(pick(record, "completed_at", "completedAt")),
  };
}

export function mapGamification(payload: unknown): Gamification {
  const record = asRecord(payload);

  if (!record) {
    throw new Error("Invalid gamification payload");
  }

  const tasks = pick(record, "bonus_tasks", "bonusTasks");

  return {
    tutorStudentId:
      asNumber(pick(record, "tutor_student_id", "tutorStudentId")) || 0,
    studentId: asNumber(pick(record, "student_id", "studentId")) || 0,
    studentName:
      asString(pick(record, "student_name", "studentName", "student")) ||
      "Ученик",
    tutorName: asString(pick(record, "tutor_name", "tutorName", "tutor")),
    starRewardsEnabled: asBoolean(
      pick(record, "star_rewards_enabled", "starRewardsEnabled"),
    ),
    starGoal: asNumber(pick(record, "star_goal", "starGoal")),
    starRewardTitle: asString(
      pick(record, "star_reward_title", "starRewardTitle"),
    ),
    homeworkStars: asNumber(pick(record, "homework_stars", "homeworkStars")) || 0,
    bonusStars: asNumber(pick(record, "bonus_stars", "bonusStars")) || 0,
    earnedStars: asNumber(pick(record, "earned_stars", "earnedStars")) || 0,
    bonusTasks: Array.isArray(tasks) ? tasks.map(mapBonusTask) : [],
  };
}
