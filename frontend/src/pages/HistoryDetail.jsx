import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Flame, Check, ArrowRight, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MuscleIcon } from "@/components/MuscleIcon";
import { api, formatDate, formatTime } from "@/lib/api";

export default function HistoryDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkoutSession(sessionId).then(setSession).finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="animate-pulse text-primary" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sessione non trovata</p>
      </div>
    );
  }

  const report = session.report;

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="history-detail">
      <div className="max-w-md mx-auto px-5 pt-14 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center transition-all active:scale-90"
            data-testid="back-from-detail-btn"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
              Report
            </p>
            <h1 className="text-2xl font-bold" data-testid="detail-title">
              {session.day_name}
            </h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-8">
          {formatDate(session.completed_at)} alle {formatTime(session.completed_at)}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-secondary/30 rounded-2xl p-4 text-center">
            <Clock size={16} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl font-bold">{session.duration_minutes}'</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Durata
            </p>
          </div>
          <div className="bg-secondary/30 rounded-2xl p-4 text-center">
            <Flame size={16} className="mx-auto mb-2 text-primary" />
            <p className="text-xl font-bold">{report.total_volume?.toLocaleString("it-IT")}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Volume kg
            </p>
          </div>
          <div className="bg-secondary/30 rounded-2xl p-4 text-center">
            <Check size={16} className="mx-auto mb-2 text-green-500" />
            <p className="text-xl font-bold">
              {report.completed_exercises}/{report.total_exercises}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Esercizi
            </p>
          </div>
        </div>

        {/* Load Changes */}
        {report.load_changes && report.load_changes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Variazioni carichi
            </h3>
            <div className="space-y-2">
              {report.load_changes.map((change, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-3 px-4 rounded-2xl bg-secondary/30"
                >
                  <span className="text-sm font-medium truncate max-w-[130px]">
                    {change.exercise_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{change.previous_load}kg</span>
                    <ArrowRight size={12} className="text-muted-foreground" />
                    <span className="text-sm font-bold">{change.current_load}kg</span>
                    <Badge
                      className={`text-[10px] rounded-full border-0 ${
                        change.change_pct > 0
                          ? "bg-green-500/15 text-green-500"
                          : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {change.change_pct > 0 ? "+" : ""}
                      {change.change_pct}%
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <Separator className="mb-8" />

        {/* Exercises */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Esercizi eseguiti
          </h3>
          <div className="space-y-2">
            {session.exercises.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 py-3 px-4 rounded-2xl ${
                  ex.completed ? "bg-secondary/30" : "bg-destructive/10"
                }`}
                data-testid={`history-exercise-${i}`}
              >
                <MuscleIcon group={ex.muscle_group} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{ex.name}</span>
                    {ex.was_modified && (
                      <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        MOD
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ex.reps > 0 ? `${ex.sets}x${ex.reps}` : "10 min"}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">
                  {ex.load === "Corpo libero" ? "--" : `${ex.load}kg`}
                </span>
                {ex.completed && <Check size={14} className="text-green-500 shrink-0" />}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => navigate("/history")}
            variant="outline"
            className="w-full h-12 rounded-2xl font-bold"
            data-testid="back-to-history-btn"
          >
            Torna allo Storico
          </Button>
        </div>
      </div>
    </div>
  );
}
