import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function EditExerciseDialog({ exercise, dayNumber, open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [savePermanently, setSavePermanently] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setSets(String(exercise.sets));
      setReps(String(exercise.reps));
      setLoad(exercise.current_load);
      setSavePermanently(false);
    }
  }, [exercise]);

  if (!exercise) return null;

  const handleSave = async () => {
    const updates = {
      name,
      sets: parseInt(sets) || exercise.sets,
      reps: parseInt(reps) || exercise.reps,
      current_load: load || exercise.current_load,
    };

    if (savePermanently && dayNumber) {
      setSaving(true);
      try {
        await api.updateExercise(dayNumber, exercise.id, updates);
        toast.success("Salvato Definitivamente");
      } catch {
        toast.error("Errore Nel Salvataggio");
      }
      setSaving(false);
    }

    onSave(exercise.id, {
      ...updates,
      original_name: savePermanently ? updates.name : (exercise.original_name || exercise.name),
      was_modified: !savePermanently,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl max-w-sm mx-4 backdrop-blur-xl" data-testid="edit-exercise-dialog">
        <DialogHeader>
          <DialogTitle>Modifica Esercizio</DialogTitle>
          <DialogDescription>
            {savePermanently ? "Salvataggio Permanente Nel Workout" : "Solo Per Questa Sessione"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Esercizio
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl h-12 mt-1.5"
              data-testid="edit-name-input"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Serie</Label>
              <Input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="rounded-2xl h-12 mt-1.5 text-center" data-testid="edit-sets-input" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reps</Label>
              <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="rounded-2xl h-12 mt-1.5 text-center" data-testid="edit-reps-input" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Carico</Label>
              <Input value={load} onChange={(e) => setLoad(e.target.value)} className="rounded-2xl h-12 mt-1.5 text-center" data-testid="edit-load-input" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 px-1">
            <Label className="text-sm font-medium">Salva Definitivamente</Label>
            <Switch checked={savePermanently} onCheckedChange={setSavePermanently} data-testid="save-permanently-switch" />
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-full flex-1" data-testid="edit-cancel-btn">
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full flex-1" data-testid="edit-save-btn">
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
