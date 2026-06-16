import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import * as authApi from "@/api/auth";
import { clearTokens, getRefreshToken, setTokenGetter, setTokens } from "@/api/tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const tokenRef = useRef(null);
  const [user, setUser] = useState(null);

  const getToken = useCallback(() => tokenRef.current, []);

  // Set token getter for API client
  useMemo(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  const login = useCallback(async (emailOrPhone, password) => {
    const identifier = String(emailOrPhone).trim();
    const pass = password;
    const isEmail = identifier.includes("@");
    const credentials = isEmail
      ? { email: identifier, password: pass }
      : { phone: identifier, password: pass };

    const tokens = await authApi.login(credentials);
    tokenRef.current = tokens.access;
    setTokens({ access: tokens.access, refresh: tokens.refresh });

    const me = await authApi.fetchMe();
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh && tokenRef.current) {
        await authApi.logout(refresh);
      }
    } finally {
      tokenRef.current = null;
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && tokenRef.current),
      login,
      logout,
      getToken,
    }),
    [user, login, logout, getToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
