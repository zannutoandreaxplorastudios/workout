import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, ChevronRight, ChevronDown, Dumbbell, Clock, Flame } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { MuscleIcon } from "@/components/MuscleIcon";
import { api, formatDate, formatTime } from "@/lib/api";

const dayColors = {
  1: { border: "border-sky-400/40", bg: "bg-sky-500/5", badge: "bg-sky-400/15 text-sky-500" },
  2: { border: "border-emerald-400/40", bg: "bg-emerald-500/5", badge: "bg-emerald-400/15 text-emerald-500" },
  3: { border: "border-violet-400/40", bg: "bg-violet-500/5", badge: "bg-violet-400/15 text-violet-500" },
};

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [nextDay, setNextDay] = useState(1);
  const [lastSessions, setLastSessions] = useState({});
  const [sessions, setSessions] = useState([]);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getWorkoutPlans(), api.getNextWorkout(), api.getWorkoutSessions()])
      .then(([p, n, s]) => {
        setPlans(p);
        setNextDay(n.next_day);
        setLastSessions(n.last_sessions || {});
        setSessions(s);
        setExpandedDays(new Set([n.next_day]));
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (dayNumber) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

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
        <div className="flex items-center justify-between mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              La Tua Scheda
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight" data-testid="dashboard-title">
              Workout
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-2xl bg-secondary/80 backdrop-blur-xl flex items-center justify-center transition-all active:scale-90"
            data-testid="theme-toggle"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Day Cards */}
        <div className="space-y-7">
          {plans.map((plan, i) => {
            const isNext = plan.day_number === nextDay;
            const isExpanded = expandedDays.has(plan.day_number);
            const last = lastSessions[String(plan.day_number)];

            return (
              <motion.div
                key={plan.day_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`relative rounded-3xl overflow-hidden border backdrop-blur-xl transition-all ${
                  isNext
                    ? "bg-primary/5 border-primary/25 shadow-lg shadow-primary/10"
                    : "bg-card/60 border-border/40"
                }`}
                data-testid={`workout-day-card-${plan.day_number}`}
              >
                {/* Card Header - Always Visible */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer active:bg-secondary/20 transition-colors"
                  onClick={() => isNext ? navigate(`/workout/${plan.day_number}`) : toggleExpand(plan.day_number)}
                  data-testid={`day-header-${plan.day_number}`}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    {isNext && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-3 border-0">
                        Prossimo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      {plan.exercises.length} Esercizi
                    </span>
                    {isNext ? (
                      <ChevronRight size={18} className="text-primary" />
                    ) : (
                      <ChevronDown
                        size={18}
                        className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                </div>

                {/* Last completion info */}
                {last && !isExpanded && !isNext && (
                  <div className="px-5 pb-4 -mt-1">
                    <p className="text-[11px] text-muted-foreground">
                      Completato Il {formatDate(last.completed_at)} Alle {formatTime(last.completed_at)}
                    </p>
                  </div>
                )}

                {/* Expanded Content */}
                <AnimatePresence>
                  {(isExpanded || isNext) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {last && (
                        <div className="px-5 pb-3">
                          <p className="text-[11px] text-muted-foreground">
                            Completato Il {formatDate(last.completed_at)} Alle {formatTime(last.completed_at)}
                            {last.duration_minutes > 0 && ` — ${last.duration_minutes}'`}
                          </p>
                        </div>
                      )}
                      <div className="px-5 pb-5 space-y-3">
                        {plan.exercises.map((ex) => (
                          <div key={ex.id} className="flex items-center justify-between py-0.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <MuscleIcon group={ex.muscle_group} size="sm" />
                              <span className="text-sm font-medium truncate">{ex.name}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              {ex.reps > 0 ? (
                                <span className="text-xs text-muted-foreground">{ex.sets}x{ex.reps}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">{ex.notes || "10 Min"}</span>
                              )}
                              <span className="text-sm font-bold text-primary min-w-[40px] text-right">
                                {ex.current_load === "Corpo libero" ? "—" : `${ex.current_load}kg`}
                              </span>
                            </div>
                          </div>
                        ))}
                        {isNext && (
                          <button
                            onClick={() => navigate(`/workout/${plan.day_number}`)}
                            className="w-full mt-4 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-[0.98]"
                            data-testid="start-workout-btn"
                          >
                            Inizia Allenamento
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Storico Recente */}
        {sessions.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold mb-6" data-testid="history-section-title">
              Storico Recente
            </h2>
            <div className="space-y-4">
              {sessions.slice(0, 10).map((s, i) => {
                const colors = dayColors[s.day_number] || dayColors[1];
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/history/${s.id}`)}
                    className={`rounded-2xl border-2 ${colors.border} ${colors.bg} backdrop-blur-xl p-4 cursor-pointer transition-all active:scale-[0.98]`}
                    data-testid={`home-history-${s.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <Badge className={`text-[10px] font-bold rounded-full border-0 mb-1.5 ${colors.badge}`}>
                          {s.day_name}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(s.completed_at)} Alle {formatTime(s.completed_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock size={12} className="text-muted-foreground" />
                            <p className="text-sm font-bold">{s.duration_minutes}'</p>
                          </div>
                          <div className="flex items-center gap-1.5 justify-end mt-0.5">
                            <Flame size={12} className="text-primary/60" />
                            <p className="text-[10px] text-muted-foreground">
                              {s.report?.total_volume?.toLocaleString("it-IT")}kg
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
