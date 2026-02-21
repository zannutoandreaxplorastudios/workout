import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, ChevronRight, Dumbbell } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { MuscleIcon } from "@/components/MuscleIcon";
import { api, formatDate, formatTime } from "@/lib/api";

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [nextDay, setNextDay] = useState(1);
  const [lastSessions, setLastSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getWorkoutPlans(), api.getNextWorkout()])
      .then(([p, n]) => {
        setPlans(p);
        setNextDay(n.next_day);
        setLastSessions(n.last_sessions || {});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="animate-pulse text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="dashboard">
      <div className="max-w-md mx-auto px-5 pt-14 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              La tua scheda
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight" data-testid="dashboard-title">
              Workout
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center transition-all active:scale-90"
            data-testid="theme-toggle"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Day Cards */}
        <div className="space-y-5">
          {plans.map((plan, i) => {
            const isNext = plan.day_number === nextDay;
            const last = lastSessions[String(plan.day_number)];

            return (
              <motion.div
                key={plan.day_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                onClick={() => navigate(`/workout/${plan.day_number}`)}
                className={`relative rounded-3xl p-5 cursor-pointer transition-all active:scale-[0.98] border ${
                  isNext
                    ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5"
                    : "bg-card border-border/50 shadow-sm"
                }`}
                data-testid={`workout-day-card-${plan.day_number}`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    {isNext && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-3 border-0">
                        PROSSIMO
                      </Badge>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </div>

                {/* Last completion */}
                {last && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Completato il {formatDate(last.completed_at)} alle{" "}
                    {formatTime(last.completed_at)}
                    {last.duration_minutes > 0 && ` - ${last.duration_minutes}'`}
                  </p>
                )}

                {/* Exercises preview */}
                <div className="space-y-2.5">
                  {plan.exercises.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MuscleIcon group={ex.muscle_group} size="sm" />
                        <span className="text-sm font-medium truncate">{ex.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {ex.reps > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {ex.sets}x{ex.reps}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{ex.notes || "10 min"}</span>
                        )}
                        <span className="text-sm font-bold text-primary min-w-[45px] text-right">
                          {ex.current_load === "Corpo libero" ? "--" : `${ex.current_load}kg`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-border/30">
                  <span className="text-xs text-muted-foreground font-medium">
                    {plan.exercises.length} esercizi
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
