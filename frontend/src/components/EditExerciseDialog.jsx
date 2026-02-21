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
import { Trash2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

const MUSCLE_GROUPS = [
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "quads", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "shoulders", label: "Shoulders" },
  { value: "triceps", label: "Triceps" },
  { value: "biceps", label: "Biceps" },
  { value: "abs", label: "Abs" },
];

export function EditExerciseDialog({ exercise, dayNumber, open, onClose, onSave, onAdd, onDelete, mode = "edit" }) {
  const { user } = useUser();
  const isAdd = mode === "add";
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("chest");
  const [savePermanently, setSavePermanently] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdd && open) {
      setName("");
      setSets("4");
      setReps("10");
      setLoad("0");
      setMuscleGroup("chest");
      setSavePermanently(false);
    } else if (exercise && open) {
      setName(exercise.name);
      setSets(String(exercise.sets));
      setReps(String(exercise.reps));
      setLoad(exercise.current_load);
      setMuscleGroup(exercise.muscle_group || "chest");
      setSavePermanently(false);
    }
  }, [exercise, isAdd, open]);

  const handleSave = async () => {
    if (isAdd) {
      if (!name.trim()) {
        toast.error("Enter An Exercise Name");
        return;
      }
      const mg = MUSCLE_GROUPS.find((m) => m.value === muscleGroup);
      onAdd?.({
        name: name.trim(),
        sets: parseInt(sets) || 4,
        reps: parseInt(reps) || 10,
        rest_time: "1'",
        rest_seconds: 60,
        current_load: load || "0",
        muscle_group: muscleGroup,
        muscle_label: mg?.label || "Chest",
        notes: "",
      });
      return;
    }

    const updates = {
      name,
      sets: parseInt(sets) || exercise.sets,
      reps: parseInt(reps) || exercise.reps,
      current_load: load || exercise.current_load,
    };

    if (savePermanently && dayNumber && user) {
      setSaving(true);
      try {
        const mg = MUSCLE_GROUPS.find((m) => m.value === muscleGroup);
        await api.updateExercise(dayNumber, exercise.id, {
          ...updates,
          muscle_group: muscleGroup,
          muscle_label: mg?.label || exercise.muscle_label,
        }, user.id);
        toast.success("Saved Permanently");
      } catch {
        toast.error("Error Saving");
      }
      setSaving(false);
    }

    onSave?.(exercise.id, {
      ...updates,
      muscle_group: savePermanently ? muscleGroup : exercise.muscle_group,
      muscle_label: savePermanently
        ? (MUSCLE_GROUPS.find((m) => m.value === muscleGroup)?.label || exercise.muscle_label)
        : exercise.muscle_label,
      original_name: savePermanently ? updates.name : (exercise.original_name || exercise.name),
      was_modified: !savePermanently,
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Remove "${exercise?.name}" from this workout?`)) return;
    onDelete?.(exercise.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl max-w-sm mx-4 card-blur" data-testid="edit-exercise-dialog">
        <DialogHeader>
          <DialogTitle>{isAdd ? "Add Exercise" : "Edit Exercise"}</DialogTitle>
          <DialogDescription>
            {isAdd
              ? "Add A New Exercise To This Day"
              : savePermanently
              ? "Saving Permanently To Workout"
              : "Changes For This Session Only"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Exercise name"
              className="rounded-2xl h-12 mt-1.5"
              data-testid="edit-name-input"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sets</Label>
              <Input type="number" value={sets} onChange={(e) => setSets(e.target.value)} className="rounded-2xl h-12 mt-1.5 text-center" data-testid="edit-sets-input" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reps</Label>
              <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} className="rounded-2xl h-12 mt-1.5 text-center" data-testid="edit-reps-input" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Load</Label>
              <Input value={load} onChange={(e) => setLoad(e.target.value)} className="rounded-2xl h-12 mt-1.5 text-center" data-testid="edit-load-input" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Muscle Group</Label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="w-full h-12 mt-1.5 rounded-2xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="edit-muscle-group"
            >
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg.value} value={mg.value}>{mg.label}</option>
              ))}
            </select>
          </div>
          {!isAdd && (
            <div className="flex items-center justify-between pt-2 px-1">
              <Label className="text-sm font-medium">Save Permanently</Label>
              <Switch checked={savePermanently} onCheckedChange={setSavePermanently} data-testid="save-permanently-switch" />
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-row gap-3">
          {!isAdd && onDelete && (
            <Button variant="ghost" onClick={handleDelete} className="rounded-full text-destructive hover:bg-destructive/10 px-3" data-testid="delete-exercise-btn">
              <Trash2 size={16} />
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="rounded-full flex-1" data-testid="edit-cancel-btn">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full flex-1" data-testid="edit-save-btn">
            {saving ? "Saving..." : isAdd ? "Add" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
