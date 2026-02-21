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

export function EditExerciseDialog({ exercise, open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setSets(String(exercise.sets));
      setReps(String(exercise.reps));
      setLoad(exercise.current_load);
    }
  }, [exercise]);

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl max-w-sm mx-4" data-testid="edit-exercise-dialog">
        <DialogHeader>
          <DialogTitle>Modifica esercizio</DialogTitle>
          <DialogDescription>Solo per questa sessione</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Esercizio
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl h-12 mt-1"
              data-testid="edit-name-input"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Serie
              </Label>
              <Input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                className="rounded-2xl h-12 mt-1 text-center"
                data-testid="edit-sets-input"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Reps
              </Label>
              <Input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="rounded-2xl h-12 mt-1 text-center"
                data-testid="edit-reps-input"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Carico
              </Label>
              <Input
                value={load}
                onChange={(e) => setLoad(e.target.value)}
                className="rounded-2xl h-12 mt-1 text-center"
                data-testid="edit-load-input"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full flex-1"
            data-testid="edit-cancel-btn"
          >
            Annulla
          </Button>
          <Button
            onClick={() =>
              onSave(exercise.id, {
                name,
                sets: parseInt(sets) || exercise.sets,
                reps: parseInt(reps) || exercise.reps,
                current_load: load || exercise.current_load,
                original_name: exercise.original_name || exercise.name,
              })
            }
            className="rounded-full flex-1"
            data-testid="edit-save-btn"
          >
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
