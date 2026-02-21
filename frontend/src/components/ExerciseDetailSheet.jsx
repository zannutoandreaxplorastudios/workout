import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MuscleIcon } from "@/components/MuscleIcon";
import { Plus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useUser } from "@/context/UserContext";
import { api, parseLoad, formatShortDate } from "@/lib/api";
import { toast } from "sonner";

export function ExerciseDetailSheet({ exercise, dayNumber, open, onClose, onLoadUpdated }) {
  const { user } = useUser();
  const [logs, setLogs] = useState([]);
  const [newLoad, setNewLoad] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exercise && open && user) {
      api.getExerciseLogs(exercise.id, user.id).then(setLogs).catch(() => {});
    }
  }, [exercise, open, user]);

  if (!exercise) return null;

  const chartData = logs.map((log) => ({
    date: formatShortDate(log.date),
    load: parseLoad(log.load),
  }));

  const handleAddLoad = async () => {
    if (!newLoad.trim()) return;
    setSaving(true);
    try {
      await api.createExerciseLog({
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        load: newLoad,
        sets: exercise.sets,
        reps: exercise.reps,
        day_number: dayNumber,
      }, user.id);
      const updated = await api.getExerciseLogs(exercise.id, user.id);
      setLogs(updated);
      onLoadUpdated(exercise.id, newLoad);
      setNewLoad("");
      toast.success("Load Updated");
    } catch {
      toast.error("Error Updating Load");
    }
    setSaving(false);
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[85vh]" data-testid="exercise-detail-sheet">
        <div className="max-w-md mx-auto w-full px-5 pb-8 overflow-y-auto">
          <DrawerHeader className="px-0">
            <div className="flex items-center gap-3">
              <MuscleIcon group={exercise.muscle_group} size="lg" />
              <div>
                <DrawerTitle className="text-xl font-bold text-left capitalize">{exercise.name}</DrawerTitle>
                <DrawerDescription className="text-left">{exercise.muscle_label}</DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="text-center py-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Load</p>
            <p className="text-5xl font-black tracking-tighter text-primary" data-testid="current-load-display">
              {exercise.current_load}
              {exercise.current_load !== "Bodyweight" && (
                <span className="text-lg font-bold text-muted-foreground">kg</span>
              )}
            </p>
          </div>

          {chartData.length > 1 && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Progression</p>
              <div className="h-40 bg-secondary/30 rounded-2xl p-3" data-testid="load-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="loadGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="load" stroke="hsl(var(--primary))" fill="url(#loadGradient)" strokeWidth={3} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Load History</p>
              <div className="space-y-2">
                {[...logs].reverse().slice(0, 10).map((log, i) => (
                  <div key={log.id || i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/30">
                    <span className="text-xs text-muted-foreground">{formatShortDate(log.date)}</span>
                    <span className="text-sm font-bold">{log.load}kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exercise.current_load !== "Bodyweight" && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Update Load</p>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="New load (e.g. 18)"
                  value={newLoad}
                  onChange={(e) => setNewLoad(e.target.value)}
                  className="rounded-2xl h-12 text-lg font-medium flex-1"
                  data-testid="new-load-input"
                />
                <Button
                  onClick={handleAddLoad}
                  disabled={saving || !newLoad.trim()}
                  className="h-12 px-6 rounded-2xl font-bold"
                  data-testid="add-load-btn"
                >
                  <Plus size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
