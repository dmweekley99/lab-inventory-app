import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function getTokenData() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    // JWT: header.payload.signature
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { token, exp: payload.exp };
  } catch {
    return { token };
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getTokenData()?.token || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Set up auto-logout on token expiry (uses JWT exp claim)
  useEffect(() => {
    if (!token) return;
    let timeoutId;
    try {
      const { exp } = getTokenData() || {};
      const now = Math.floor(Date.now() / 1000);
      if (exp && exp > now) {
        const expiresIn = (exp - now) * 1000;
        timeoutId = setTimeout(() => {
          logout();
        }, expiresIn);
      } else {
        // Token already expired or no exp claim
        logout();
      }
    } catch {
      // fallback: logout after 24 hours
      timeoutId = setTimeout(() => logout(), 24 * 60 * 60 * 1000);
    }
    return () => clearTimeout(timeoutId);
  }, [token]);

  const login = useCallback((newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    // On mount, check token
    const data = getTokenData();
    if (!data?.token) logout();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
