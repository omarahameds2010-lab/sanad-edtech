"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";

interface AuthState {
  token: string | null;
  userId: string | null;
  userName: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  login: (phone: string, password: string) => Promise<import("./api").LoginResult>;
  applySession: (result: import("./api").LoginResult) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  token: null,
  userId: null,
  userName: null,
  role: null,
};

/**
 * In-memory auth session. The access token lives only in React state —
 * it is never written to localStorage (per platform security rules).
 * Demo-grade: a production hardening step is a BFF session proxy.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  const login = useCallback(async (phone: string, password: string) => {
    const result = await api.login(phone, password);
    setState({
      token: result.accessToken,
      userId: result.user.id,
      userName: result.user.name,
      role: result.user.role,
    });
    return result;
  }, []);

  const applySession = useCallback(
    (result: import("./api").LoginResult) => {
      setState({
        token: result.accessToken,
        userId: result.user.id,
        userName: result.user.name,
        role: result.user.role,
      });
    },
    [],
  );

  const logout = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, applySession, logout }),
    [state, login, applySession, logout],
  );

   const AuthContextProvider = AuthContext.Provider as any;
  return <AuthContextProvider value={value}>{children}</AuthContextProvider>;

}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
