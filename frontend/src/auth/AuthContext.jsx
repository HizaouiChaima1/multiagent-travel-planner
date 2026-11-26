import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { setUnauthorizedHandler } from "../api/client.js";
import { readToken, writeToken } from "./session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // false tant que le jeton enregistré n'a pas été vérifié auprès de l'API.
  const [ready, setReady] = useState(() => !readToken());

  const logout = useCallback(() => {
    writeToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!readToken()) return;
    authApi
      .fetchMe()
      .then(setUser)
      .catch(logout)
      .finally(() => setReady(true));
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const { access_token } = await authApi.login(email, password);
    writeToken(access_token);
    setUser(await authApi.fetchMe());
  }, []);

  const register = useCallback(
    async (email, password) => {
      await authApi.register(email, password);
      await login(email, password);
    },
    [login]
  );

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
}
