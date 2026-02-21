import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Dumbbell, ChevronRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { api, formatDate, formatTime } from "@/lib/api";

const dayColors = {
  1: { border: "border-sky-400/40", bg: "bg-sky-500/5", badge: "bg-sky-400/15 text-sky-500" },
  2: { border: "border-emerald-400/40", bg: "bg-emerald-500/5", badge: "bg-emerald-400/15 text-emerald-500" },
  3: { border: "border-violet-400/40", bg: "bg-violet-500/5", badge: "bg-violet-400/15 text-violet-500" },
  4: { border: "border-amber-400/40", bg: "bg-amber-500/5", badge: "bg-amber-400/15 text-amber-500" },
};

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    api.getWorkoutSessions(user.id).then(setSessions).finally(() => setLoading(false));
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="animate-pulse text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="history-page">
      <div className="max-w-md mx-auto px-5 pt-14 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-8" data-testid="history-title">
          History
        </h1>

        {sessions.length === 0 ? (
          <div className="text-center py-20" data-testid="history-empty">
            <Clock size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No Workouts Completed</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Complete Your First Workout To See It Here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const colors = dayColors[s.day_number] || dayColors[1];
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/history/${s.id}`)}
                  className={`rounded-2xl border-2 ${colors.border} ${colors.bg} card-blur p-4 cursor-pointer transition-all active:scale-[0.98]`}
                  data-testid={`history-session-${s.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[10px] font-bold rounded-full border-0 shrink-0 ${colors.badge}`}>
                          {s.day_name}
                        </Badge>
                        {s.report?.load_changes?.length > 0 && (
                          <span className="text-[10px] font-bold text-green-500">
                            +{s.report.load_changes.length} Changes
                          </span>
                        )}
                      </div>
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
        )}
      </div>
    </div>
  );
}
