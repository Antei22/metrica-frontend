import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import * as authApi from "../api/auth";
import type { CurrentUser, UserRole } from "../types/domain";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<CurrentUser>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const hasInitialized = useRef(false);

  async function refreshUser() {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    void refreshUser();
  }, []);

  async function handleLogin(email: string, password: string) {
    const currentUser = await authApi.login({ email, password });
    setUser(currentUser);
    setStatus("authenticated");
    return currentUser;
  }

  async function handleRegister(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }) {
    const currentUser = await authApi.register(input);
    setUser(currentUser);
    setStatus("authenticated");
    return currentUser;
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
