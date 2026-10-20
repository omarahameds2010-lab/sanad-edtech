"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  refreshSession,
  setMemoryAccessToken,
  SESSION_EXPIRED_EVENT,
} from "./api";

interface AuthState {
  token: string | null;
  userId: string | null;
  userName: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  /**
   * False until the first session-restore attempt has finished. Route guards
   * must wait for it, otherwise a hard reload on a signed-in page would kick
   * the user to /login before the refresh cookie had a chance to restore them.
   */
  ready: boolean;
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
 *
 * A hard reload empties that state, but the HttpOnly refresh cookie survives
 * it, so the provider silently rotates the token and re-reads the profile on
 * mount. That is what keeps the teacher's name (and every API call) alive
 * across refreshes without ever exposing a token to script-readable storage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const [ready, setReady] = useState(false);
  /** True once any session (login, signup or restore) has been adopted. */
  const hasSession = useRef(false);

  const adopt = useCallback(
    (token: string, user: { id: string; name: string; role: string }) => {
      hasSession.current = true;
      setMemoryAccessToken(token);
      setState({
        token,
        userId: user.id,
        userName: user.name,
        role: user.role,
      });
    },
    [],
  );

  const login = useCallback(
    async (phone: string, password: string) => {
      const result = await api.login(phone, password);
      adopt(result.accessToken, result.user);
      return result;
    },
    [adopt],
  );

  const applySession = useCallback(
    (result: import("./api").LoginResult) => {
      adopt(result.accessToken, result.user);
    },
    [adopt],
  );

  const logout = useCallback(() => {
    hasSession.current = false;
    setMemoryAccessToken(null);
    setState(INITIAL_STATE);
  }, []);

  // Restore a session after a hard reload: the refresh token rides in an
  // HttpOnly cookie, so only the server can read it. One rotation returns a
  // fresh access token, then /users/me re-supplies the display name.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const restored = await refreshSession();
        if (cancelled || !restored.ok || hasSession.current) return;

        const me = await api.getProfile(restored.accessToken);
        if (!cancelled && !hasSession.current) {
          adopt(restored.accessToken, {
            id: me.id,
            name: me.name,
            role: me.role,
          });
        }
      } catch {
        // No restorable session — stay signed out; guards handle the rest.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adopt]);

  // A session the API refuses to refresh (expired or revoked) is dead here
  // too — clear it so guards can send the user back to /login.
  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, ready, login, applySession, logout }),
    [state, ready, login, applySession, logout],
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
