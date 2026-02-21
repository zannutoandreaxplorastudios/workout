import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { BottomNav } from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import ActiveWorkout from "@/pages/ActiveWorkout";
import History from "@/pages/History";
import HistoryDetail from "@/pages/HistoryDetail";
import "@/App.css";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout/:dayNumber" element={<ActiveWorkout />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:sessionId" element={<HistoryDetail />} />
          </Routes>
          <BottomNav />
          <Toaster position="top-center" richColors />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
