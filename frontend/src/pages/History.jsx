import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Dumbbell, ChevronRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api, formatDate, formatTime } from "@/lib/api";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getWorkoutSessions().then(setSessions).finally(() => setLoading(false));
  }, []);

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
          Storico
        </h1>

        {sessions.length === 0 ? (
          <div className="text-center py-20" data-testid="history-empty">
            <Clock size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">Nessun Allenamento Completato</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Completa Il Tuo Primo Workout Per Vederlo Qui
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/history/${s.id}`)}
                className="rounded-2xl border border-border/50 bg-card p-4 cursor-pointer transition-all active:scale-[0.98]"
                data-testid={`history-session-${s.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold rounded-full shrink-0"
                      >
                        {s.day_name}
                      </Badge>
                      {s.report?.load_changes?.length > 0 && (
                        <span className="text-[10px] font-bold text-green-500">
                          +{s.report.load_changes.length} variazioni
                        </span>
                      )}
                    </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
