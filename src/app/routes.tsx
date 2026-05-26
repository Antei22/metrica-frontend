import { Navigate, createBrowserRouter } from "react-router";
import { useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getHomePathForRole } from "./lib/routes";
import { AuthPage } from "./pages/AuthPage";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Проверяем сессию...</p>
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
