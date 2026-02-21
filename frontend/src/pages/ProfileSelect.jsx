import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Sun, Moon } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";

export default function ProfileSelect() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectUser } = useUser();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    api.getProfiles().then(setProfiles).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="animate-pulse text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5" data-testid="profile-select">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-secondary/80 card-blur flex items-center justify-center transition-all active:scale-90"
        data-testid="theme-toggle-profile"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="text-center mb-14">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Dumbbell size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight" data-testid="profile-title">
          Workout Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Select Your Profile</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {profiles.map((profile, i) => (
          <motion.button
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => selectUser(profile)}
            className="w-full flex items-center gap-4 p-5 rounded-3xl border border-border/40 bg-card/60 card-blur transition-all active:scale-[0.98] hover:border-primary/40"
            data-testid={`profile-${profile.id}`}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: profile.color }}
            >
              {profile.name[0]}
            </div>
            <span className="text-lg font-bold">{profile.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
