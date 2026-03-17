import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/AuthContext";
import type { UserRole } from "../types/domain";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">Загружаем данные аккаунта...</p>
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
    const fallbackPath = user.role === "tutor" ? "/tutor/dashboard" : "/student/lessons";
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
