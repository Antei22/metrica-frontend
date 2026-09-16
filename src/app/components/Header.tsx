import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { listStudentGamification } from "../api/gamification";
import { useAuth } from "../auth/AuthContext";
import { getHomePathForRole, getRoleLabel } from "../lib/routes";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { StarValue } from "./StarValue";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [studentRewards, setStudentRewards] = useState<Awaited<
    ReturnType<typeof listStudentGamification>
  >>([]);
  const [isRewardsDialogOpen, setIsRewardsDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (user?.role !== "student") {
      setStudentRewards([]);
      return () => {
        isMounted = false;
      };
    }

    listStudentGamification()
      .then((items) => {
        if (!isMounted) {
          return;
        }

        setStudentRewards(items);
      })
      .catch(() => {
        if (isMounted) {
          setStudentRewards([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role]);

  if (!user) {
    return null;
  }

  const navigationItems =
    user.role === "tutor"
      ? [
          { label: "Занятия", path: "/tutor/dashboard" },
          { label: "Ученики", path: "/tutor/students" },
          { label: "Проверка ДЗ", path: "/tutor/homework" },
        ]
      : user.role === "parent"
        ? [{ label: "Кабинет", path: "/parent/dashboard" }]
        : [
          { label: "Кабинет", path: "/student/dashboard" },
          { label: "История занятий", path: "/student/lessons" },
        ];

  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const activeStudentRewards = studentRewards.filter(
    (item) => item.starRewardsEnabled && item.starGoal,
  );
  const studentStars = activeStudentRewards.reduce((sum, item) => sum + item.earnedStars, 0);
  const studentGoal = activeStudentRewards.reduce((sum, item) => sum + (item.starGoal || 0), 0);
  const studentProgress = studentGoal ? Math.min(100, (studentStars / studentGoal) * 100) : 0;

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <button
          className="text-left"
          onClick={() => navigate(getHomePathForRole(user.role))}
          type="button"
        >
          <span className="eyebrow block">Онлайн-платформа</span>
          <span className="block text-[20px] leading-tight tracking-[-0.035em] text-foreground">
            МЕТРИКА
          </span>
        </button>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <nav className="flex flex-wrap gap-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Button
                  key={item.path}
                  type="button"
                  variant={isActive ? "default" : "secondary"}
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Button>
              );
            })}
            {user.role === "student" && activeStudentRewards.length > 0 ? (
              <button
                aria-label="Открыть прогресс накопления"
                onClick={() => setIsRewardsDialogOpen(true)}
                type="button"
              >
                <StarValue className="h-9 px-4 text-sm" value={studentStars} />
              </button>
            ) : null}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto min-h-0 rounded-full border border-border bg-secondary px-3 py-2 hover:bg-accent"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">{user.fullName}</div>
                  <div className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</div>
                </div>
                <ChevronDown className="size-4 text-quiet" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Dialog open={isRewardsDialogOpen} onOpenChange={setIsRewardsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Прогресс накопления</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-warning/20 bg-warning-soft p-4">
              <p className="text-sm text-warning">Накоплено</p>
              <p className="mt-2 text-2xl tracking-[-0.035em] text-foreground">
                {studentStars.toLocaleString("ru-RU")} / {studentGoal.toLocaleString("ru-RU")}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-star"
                  style={{ width: `${studentProgress}%` }}
                />
              </div>
            </div>
            {activeStudentRewards.map((item) => (
              <div
                className="rounded-2xl border border-border bg-canvas p-4 text-sm text-muted-foreground"
                key={item.tutorStudentId}
              >
                <p className="font-medium text-foreground">
                  {item.tutorName || "Репетитор"}
                </p>
                <p className="mt-1">
                  {item.earnedStars.toLocaleString("ru-RU")} /{" "}
                  {(item.starGoal || 0).toLocaleString("ru-RU")}
                </p>
                {item.starRewardTitle ? (
                  <p className="mt-1">Награда: {item.starRewardTitle}</p>
                ) : null}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
