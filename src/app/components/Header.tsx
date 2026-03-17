import { ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../auth/AuthContext";
import { getHomePathForRole, getRoleLabel } from "../lib/routes";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
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
      : [{ label: "Мои занятия", path: "/student/lessons" }];

  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <button
          className="text-left"
          onClick={() => navigate(getHomePathForRole(user.role))}
          type="button"
        >
          <span className="block text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Онлайн-платформа
          </span>
          <span className="block text-2xl font-semibold text-slate-900">METRICA</span>
        </button>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <nav className="flex flex-wrap gap-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Button
                  key={item.path}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  className={`rounded-full px-4 ${
                    isActive
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-slate-900 text-white">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium text-slate-900">{user.fullName}</div>
                  <div className="text-xs text-slate-500">{getRoleLabel(user.role)}</div>
                </div>
                <ChevronDown className="size-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
