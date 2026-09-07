import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import GuestRoute from "./components/routing/GuestRoute";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/LoginPage";
import TicketsPage from "./pages/TicketsPage";
import AIAgentPage from "./pages/AIAgentPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<TicketsPage />} />
              <Route path="/ai-agent" element={<AIAgentPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
