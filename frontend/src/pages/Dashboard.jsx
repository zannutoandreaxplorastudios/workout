import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sun, Moon, ChevronRight, ChevronDown, Dumbbell, Clock, Flame, Plus, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { MuscleIcon } from "@/components/MuscleIcon";
import { api, formatDate, formatTime } from "@/lib/api";
import { toast } from "sonner";

const dayColors = {
  1: { border: "border-sky-400/40", bg: "bg-sky-500/5", badge: "bg-sky-400/15 text-sky-500" },
  2: { border: "border-emerald-400/40", bg: "bg-emerald-500/5", badge: "bg-emerald-400/15 text-emerald-500" },
  3: { border: "border-violet-400/40", bg: "bg-violet-500/5", badge: "bg-violet-400/15 text-violet-500" },
  4: { border: "border-amber-400/40", bg: "bg-amber-500/5", badge: "bg-amber-400/15 text-amber-500" },
};

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [nextDay, setNextDay] = useState(1);
  const [lastSessions, setLastSessions] = useState({});
  const [sessions, setSessions] = useState([]);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayName, setNewDayName] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getWorkoutPlans(user.id),
      api.getNextWorkout(user.id),
      api.getWorkoutSessions(user.id),
    ])
      .then(([p, n, s]) => {
        setPlans(p);
        setNextDay(n.next_day);
        setLastSessions(n.last_sessions || {});
        setSessions(s);
        setExpandedDays(new Set([n.next_day]));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user.id]);

  const toggleExpand = (dayNumber) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  };

  const handleAddDay = async () => {
    try {
      const name = newDayName.trim() || undefined;
      await api.createWorkoutDay(user.id, name ? { name } : {});
      setShowAddDay(false);
      setNewDayName("");
      toast.success("Day Added");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed To Add Day");
    }
  };

  const handleDeleteDay = async (dayNumber, dayName) => {
    if (!window.confirm(`Delete "${dayName}"? This cannot be undone.`)) return;
    try {
      await api.deleteWorkoutDay(dayNumber, user.id);
      toast.success("Day Deleted");
      loadData();
    } catch {
      toast.error("Failed To Delete Day");
    }
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
        <div className="flex items-center justify-between mb-14">
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 transition-all active:scale-90"
              style={{ backgroundColor: user.color }}
              data-testid="profile-avatar"
            >
              {user.name[0]}
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                {user.name}'s Schedule
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight" data-testid="dashboard-title">
                Workout
              </h1>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-2xl bg-secondary/80 card-blur flex items-center justify-center transition-all active:scale-90"
            data-testid="theme-toggle"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Day Cards */}
        <div className="space-y-8">
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
                className={`relative rounded-3xl overflow-hidden border card-blur transition-all ${
                  isNext
                    ? "bg-primary/5 border-primary/25 shadow-lg shadow-primary/10"
                    : "bg-card/60 border-border/40"
                }`}
                data-testid={`workout-day-card-${plan.day_number}`}
              >
                {/* Card Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer active:bg-secondary/20 transition-colors"
                  onClick={() => isNext ? navigate(`/workout/${plan.day_number}`) : toggleExpand(plan.day_number)}
                  data-testid={`day-header-${plan.day_number}`}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{plan.name}</h2>
                    {isNext && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-3 border-0">
                        Next
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      {plan.exercises.length} Ex
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDay(plan.day_number, plan.name); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      data-testid={`delete-day-${plan.day_number}`}
                    >
                      <Trash2 size={13} />
                    </button>
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

                {/* Last completion info - collapsed */}
                {last && !isExpanded && !isNext && (
                  <div className="px-5 pb-4 -mt-1">
                    <p className="text-[11px] text-muted-foreground">
                      Completed {formatDate(last.completed_at)} At {formatTime(last.completed_at)}
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
                            Completed {formatDate(last.completed_at)} At {formatTime(last.completed_at)}
                            {last.duration_minutes > 0 && ` — ${last.duration_minutes}'`}
                          </p>
                        </div>
                      )}
                      <div className="px-5 pb-5 space-y-3.5">
                        {plan.exercises.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No Exercises Yet. Start A Workout To Add Some.
                          </p>
                        ) : (
                          plan.exercises.map((ex) => (
                            <div key={ex.id} className="flex items-center justify-between py-0.5">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <MuscleIcon group={ex.muscle_group} size="sm" />
                                <span className="text-sm font-medium truncate capitalize">{ex.name}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                {ex.reps > 0 ? (
                                  <span className="text-xs text-muted-foreground">{ex.sets}x{ex.reps}</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{ex.notes || "10 Min"}</span>
                                )}
                                <span className="text-sm font-bold text-primary min-w-[40px] text-right">
                                  {ex.current_load === "Bodyweight" ? "—" : `${ex.current_load}kg`}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                        {isNext && (
                          <button
                            onClick={() => navigate(`/workout/${plan.day_number}`)}
                            className="w-full mt-5 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm transition-all active:scale-[0.98]"
                            data-testid="start-workout-btn"
                          >
                            Start Workout
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Add Day Button */}
          {plans.length < 4 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowAddDay(true)}
              className="w-full py-4 rounded-3xl border-2 border-dashed border-border/40 text-muted-foreground flex items-center justify-center gap-2 transition-all hover:border-primary/30 hover:text-primary active:scale-[0.98]"
              data-testid="add-day-btn"
            >
              <Plus size={18} />
              <span className="text-sm font-bold">Add Day</span>
            </motion.button>
          )}
        </div>

        {/* Recent History */}
        {sessions.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold mb-7" data-testid="history-section-title">
              Recent History
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
                    className={`rounded-2xl border-2 ${colors.border} ${colors.bg} card-blur p-4 cursor-pointer transition-all active:scale-[0.98]`}
                    data-testid={`home-history-${s.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <Badge className={`text-[10px] font-bold rounded-full border-0 mb-1.5 ${colors.badge}`}>
                          {s.day_name}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(s.completed_at)} At {formatTime(s.completed_at)}
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
                              {s.report?.total_volume?.toLocaleString("en-US")}kg
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

      {/* Add Day Dialog */}
      <Dialog open={showAddDay} onOpenChange={setShowAddDay}>
        <DialogContent className="rounded-3xl max-w-sm mx-4 card-blur" data-testid="add-day-dialog">
          <DialogHeader>
            <DialogTitle>Add Workout Day</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={`Day ${plans.length + 1}`}
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              className="rounded-2xl h-12"
              data-testid="add-day-name-input"
            />
          </div>
          <DialogFooter className="flex flex-row gap-3">
            <Button variant="outline" onClick={() => setShowAddDay(false)} className="rounded-full flex-1">
              Cancel
            </Button>
            <Button onClick={handleAddDay} className="rounded-full flex-1" data-testid="add-day-confirm-btn">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
