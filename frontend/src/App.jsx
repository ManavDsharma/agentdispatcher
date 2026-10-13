import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import {
  AuthProvider
} from "./context/AuthContext";

import ProtectedRoute
  from "./components/routing/ProtectedRoute";

import GuestRoute
  from "./components/routing/GuestRoute";

import AdminRoute
  from "./components/routing/AdminRoute";

import AppShell
  from "./components/layout/AppShell";

import LoginPage
  from "./pages/LoginPage";

import RegisterPage
  from "./pages/RegisterPage";

import ForgotPasswordPage
  from "./pages/ForgotPasswordPage";

import TicketsPage
  from "./pages/TicketsPage";

import AIAgentPage
  from "./pages/AIAgentPage";

import SettingsPage
  from "./pages/SettingsPage";

import AdminControlPage
  from "./pages/AdminControlPage";


export default function App() {

  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* ================================================= */}
          {/* GUEST */}
          {/* ================================================= */}

          <Route
            element={<GuestRoute />}
          >

            <Route
              path="/login"
              element={
                <LoginPage />
              }
            />

            <Route
              path="/register"
              element={
                <RegisterPage />
              }
            />

            <Route
              path="/forgot-password"
              element={
                <ForgotPasswordPage />
              }
            />

          </Route>


          {/* ================================================= */}
          {/* PROTECTED */}
          {/* ================================================= */}

          <Route
            element={
              <ProtectedRoute />
            }
          >

            <Route
              element={
                <AppShell />
              }
            >

              <Route
                path="/"
                element={
                  <TicketsPage />
                }
              />

              <Route
                path="/ai-agent"
                element={
                  <AIAgentPage />
                }
              />

              <Route
                path="/settings"
                element={
                  <SettingsPage />
                }
              />


              {/* ============================================= */}
              {/* ADMIN */}
              {/* ============================================= */}

              <Route
                element={
                  <AdminRoute />
                }
              >

                <Route
                  path="/admin-control"
                  element={
                    <AdminControlPage />
                  }
                />

              </Route>

            </Route>

          </Route>

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}