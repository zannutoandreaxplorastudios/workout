import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { BottomNav } from "@/components/BottomNav";
import ProfileSelect from "@/pages/ProfileSelect";
import Dashboard from "@/pages/Dashboard";
import ActiveWorkout from "@/pages/ActiveWorkout";
import History from "@/pages/History";
import HistoryDetail from "@/pages/HistoryDetail";
import "@/App.css";

function AppContent() {
  const { user } = useUser();

  if (!user) return <ProfileSelect />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workout/:dayNumber" element={<ActiveWorkout />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:sessionId" element={<HistoryDetail />} />
      </Routes>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background font-sans antialiased">
            <AppContent />
          </div>
        </BrowserRouter>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
