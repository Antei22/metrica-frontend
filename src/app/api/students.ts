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
