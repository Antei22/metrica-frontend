import type { UserRole } from "../types/domain";

export function getHomePathForRole(role: UserRole) {
  return role === "tutor" ? "/tutor/dashboard" : "/student/lessons";
}

export function getRoleLabel(role: UserRole) {
  return role === "tutor" ? "Репетитор" : "Ученик";
}
