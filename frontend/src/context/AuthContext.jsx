import { createContext, useContext, useState } from "react";

const SESSION_KEY = "l1d_authenticated";
const DEMO_EMAIL = "demo@l1dispatcher.com";
const DEMO_PASSWORD = "Demo@123";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );

  const login = (email, password) => {
    const ok =
      email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsAuthenticated(true);
    }
    return ok;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, demoEmail: DEMO_EMAIL, demoPassword: DEMO_PASSWORD }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
