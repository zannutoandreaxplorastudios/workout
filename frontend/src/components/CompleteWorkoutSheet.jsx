import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, Flame, ArrowRight } from "lucide-react";
import { api, parseLoad } from "@/lib/api";
import { toast } from "sonner";

export function CompleteWorkoutSheet({ plan, exercises, completed, open, onClose, onComplete }) {
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState(null);

  const completedExercises = exercises.filter((ex) => completed.has(ex.id));

  const totalVolume = completedExercises.reduce((sum, ex) => {
    return sum + ex.sets * ex.reps * parseLoad(ex.current_load);
  }, 0);

  const handleSave = async () => {
    if (!duration) {
      toast.error("Inserisci la durata dell'allenamento");
      return;
    }
    setSaving(true);
    try {
      const result = await api.createWorkoutSession({
        day_number: plan.day_number,
        day_name: plan.name,
        duration_minutes: parseInt(duration),
        exercises: exercises.map((ex) => ({
          exercise_id: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          load: ex.current_load,
          muscle_group: ex.muscle_group,
          muscle_label: ex.muscle_label,
          completed: completed.has(ex.id),
          was_modified: ex.was_modified || false,
          original_name: ex.original_name || ex.name,
        })),
      });
      setReport(result.report);
      toast.success("Allenamento Salvato!");
    } catch {
      toast.error("Errore Nel Salvataggio");
    }
    setSaving(false);
  };

  const handleClose = () => {
    setReport(null);
    setDuration("");
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent className="max-h-[90vh]" data-testid="complete-workout-sheet">
        <div className="max-w-md mx-auto w-full px-5 pb-8 overflow-y-auto">
          <DrawerHeader className="px-0 text-center">
            <DrawerTitle className="text-2xl font-bold">
              {report ? "Report Allenamento" : "Completa Allenamento"}
            </DrawerTitle>
            <DrawerDescription>
              {report ? plan.name : `${completed.size} Esercizi Completati Su ${exercises.length}`}
            </DrawerDescription>
          </DrawerHeader>

          {!report ? (
            <>
              <div className="text-center py-4">
                <p className="text-5xl font-black text-primary mb-1">{completed.size}</p>
                <p className="text-sm text-muted-foreground">
                  Su {exercises.length} Esercizi
                </p>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Flame size={18} className="text-primary" />
                  <span className="text-sm font-bold">Volume Stimato</span>
                </div>
                <p className="text-3xl font-black">
                  {totalVolume.toLocaleString("it-IT")}{" "}
                  <span className="text-sm font-normal text-muted-foreground">kg</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Durata Allenamento (Minuti)
                </label>
                <Input
                  type="number"
                  placeholder="Es. 60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-2xl h-14 text-2xl font-bold text-center"
                  data-testid="duration-input"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-14 rounded-2xl text-base font-bold"
                data-testid="save-workout-btn"
              >
                <Check size={20} className="mr-2" />
                {saving ? "Salvataggio..." : "Salva Allenamento"}              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-secondary/30 rounded-2xl p-4 text-center">
                  <Clock size={18} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{duration}'</p>
                  <p className="text-xs text-muted-foreground">Durata</p>
                </div>
                <div className="bg-secondary/30 rounded-2xl p-4 text-center">
                  <Flame size={18} className="mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{report.total_volume.toLocaleString("it-IT")}</p>
                  <p className="text-xs text-muted-foreground">Volume (kg)</p>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-4 text-center mb-6">
                <Check size={18} className="mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">
                  {report.completed_exercises}/{report.total_exercises}
                </p>
                <p className="text-xs text-muted-foreground">Esercizi Completati</p>
              </div>

              {report.load_changes && report.load_changes.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Variazioni Carichi
                  </p>
                  <div className="space-y-2">
                    {report.load_changes.map((change, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/30"
                      >
                        <span className="text-sm font-medium truncate max-w-[120px]">
                          {change.exercise_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{change.previous_load}</span>
                          <ArrowRight size={12} className="text-muted-foreground" />
                          <span className="text-sm font-bold">{change.current_load}</span>
                          <Badge
                            className={`text-[10px] border-0 ${
                              change.change_pct > 0
                                ? "bg-green-500/15 text-green-500"
                                : "bg-red-500/15 text-red-500"
                            }`}
                          >
                            {change.change_pct > 0 ? "+" : ""}
                            {change.change_pct}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="mb-6" />

              <Button
                onClick={() => {
                  setReport(null);
                  setDuration("");
                  onComplete();
                }}
                className="w-full h-14 rounded-2xl text-base font-bold"
                data-testid="back-to-dashboard-btn"
              >
                Torna Alla Dashboard
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
