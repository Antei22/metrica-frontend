import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import { mapTutorStudent } from "./mappers";

export async function listTutorStudents() {
  const payload = await apiRequest<unknown[]>(apiConfig.tutor.students);
  return payload.map(mapTutorStudent);
}

export async function addTutorStudent(email: string) {
  const payload = await apiRequest(apiConfig.tutor.students, {
    method: "POST",
    body: JSON.stringify({ email }),
  });

  return mapTutorStudent(payload);
}

export async function updateTutorStudent(
  tutorStudentId: number | string,
  input: {
    classInfo: string | null;
    email: string;
    firstName: string;
    lastName: string | null;
    parentContactEnabled?: boolean;
    subject: string | null;
  },
) {
  const payload = await apiRequest(apiConfig.tutor.studentById(tutorStudentId), {
    method: "PATCH",
    body: JSON.stringify({
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      parent_contact_enabled: input.parentContactEnabled,
      subject: input.subject,
      class_info: input.classInfo,
    }),
  });

  return mapTutorStudent(payload);
}

export async function deleteTutorStudent(tutorStudentId: number | string) {
  await apiRequest(apiConfig.tutor.studentById(tutorStudentId), {
    method: "DELETE",
  });
}
