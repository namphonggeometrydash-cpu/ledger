import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    const { token, user } = await api.login({ email, password });
    setToken(token, remember);
    setUser(user);
  }, []);

  const register = useCallback(async (name, email, password, remember = true) => {
    const { token, user } = await api.register({ name, email, password });
    setToken(token, remember);
    setUser(user);
  }, []);

  const loginWithGoogle = useCallback(async (idToken, remember = true) => {
    const { token, user } = await api.google(idToken);
    setToken(token, remember);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
