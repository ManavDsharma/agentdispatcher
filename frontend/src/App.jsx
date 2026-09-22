import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import TicketsPage from "./pages/TicketsPage";
import CreateIssuePage from "./pages/CreateIssuePage";
import AIAgentPage from "./pages/AIAgentPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<TicketsPage />} />
          <Route path="/issues/new" element={<CreateIssuePage />} />
          <Route path="/ai-agent" element={<AIAgentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
