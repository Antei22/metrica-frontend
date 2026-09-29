import { Navigate, createBrowserRouter } from "react-router";
import { useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { initMetrika, trackPageView } from "./lib/analytics";
import { getHomePathForRole } from "./lib/routes";
import { AuthPage } from "./pages/AuthPage";
import { InviteRegisterPage } from "./pages/InviteRegisterPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { LessonDetails } from "./pages/LessonDetails";
import { ParentDashboard } from "./pages/ParentDashboard";
import { ParentLessonDetails } from "./pages/ParentLessonDetails";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentLessons } from "./pages/StudentLessons";
import { TutorDashboard } from "./pages/TutorDashboard";
import { TutorHomework } from "./pages/TutorHomework";
import { TutorStudentProgress } from "./pages/TutorStudentProgress";
import { TutorStudents } from "./pages/TutorStudents";

function PublicEntry() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted-foreground">Проверяем сессию...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate replace to={getHomePathForRole(user.role)} />;
  }

  return <AuthPage />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicEntry,
  },
  {
    path: "/verify-email",
    Component: VerifyEmailPage,
  },
  {
    path: "/register/invite/:token",
    Component: InviteRegisterPage,
  },
  {
    element: <ProtectedRoute allowedRoles={["tutor"]} />,
    children: [
      {
        path: "/tutor/dashboard",
        Component: TutorDashboard,
      },
      {
        path: "/tutor/students",
        Component: TutorStudents,
      },
      {
        path: "/tutor/students/:id",
        Component: TutorStudentProgress,
      },
      {
        path: "/tutor/homework",
        Component: TutorHomework,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["student"]} />,
    children: [
      {
        path: "/student/dashboard",
        Component: StudentDashboard,
      },
      {
        path: "/student/lessons",
        Component: StudentLessons,
      },
      {
        path: "/student/lessons/:id",
        Component: LessonDetails,
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["parent"]} />,
    children: [
      {
        path: "/parent/dashboard",
        Component: ParentDashboard,
      },
      {
        path: "/parent/lessons/:id",
        Component: ParentLessonDetails,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
]);

// SPA не делает полных перезагрузок страницы, поэтому стандартный
// сниппет Метрики не увидит переходы между разделами сам по себе —
// шлём просмотр вручную при каждой смене маршрута.
initMetrika();
let lastTrackedPath = "";
router.subscribe((state) => {
  const path = state.location.pathname + state.location.search;
  if (path === lastTrackedPath) {
    return;
  }
  lastTrackedPath = path;
  trackPageView(path);
});
