import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import TicketsPage from "./pages/TicketsPage";
import CreateIssuePage from "./pages/CreateIssuePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<TicketsPage />} />
          <Route path="/issues/new" element={<CreateIssuePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
