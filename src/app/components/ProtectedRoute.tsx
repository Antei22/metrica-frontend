import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/AuthContext";
import type { UserRole } from "../types/domain";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-panel-blue px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-medium text-muted-foreground">Загружаем данные аккаунта...</p>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackPath =
      user.role === "tutor"
        ? "/tutor/dashboard"
        : user.role === "parent"
          ? "/parent/dashboard"
          : "/student/dashboard";
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
