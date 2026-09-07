import { createContext, useContext, useState } from "react";

const SESSION_KEY = "l1d_authenticated";
const DEMO_USERNAME = "temp";
const DEMO_PASSWORD = "temp";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );

  const login = (username, password) => {
    const ok = username.trim() === DEMO_USERNAME && password === DEMO_PASSWORD;
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
      value={{
        isAuthenticated,
        login,
        logout,
        demoUsername: DEMO_USERNAME,
        demoPassword: DEMO_PASSWORD,
      }}
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
