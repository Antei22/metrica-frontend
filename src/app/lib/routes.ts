import type { UserRole } from "../types/domain";

export function getHomePathForRole(role: UserRole) {
  if (role === "tutor") {
    return "/tutor/dashboard";
  }

  if (role === "parent") {
    return "/parent/dashboard";
  }

  return "/student/dashboard";
}

export function getRoleLabel(role: UserRole) {
  if (role === "tutor") {
    return "Репетитор";
  }

  return role === "parent" ? "Родитель" : "Ученик";
}
