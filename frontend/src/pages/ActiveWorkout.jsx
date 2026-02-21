import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Edit3, Plus, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { MuscleIcon } from "@/components/MuscleIcon";
import { ExerciseDetailSheet } from "@/components/ExerciseDetailSheet";
import { EditExerciseDialog } from "@/components/EditExerciseDialog";
import { CompleteWorkoutSheet } from "@/components/CompleteWorkoutSheet";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ActiveWorkout() {
  const { dayNumber } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getWorkoutPlan(parseInt(dayNumber), user.id)
      .then((p) => {
        setPlan(p);
        setExercises(
          p.exercises.map((ex) => ({
            ...ex,
            was_modified: false,
            original_name: ex.name,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [dayNumber, user.id]);

  const toggleComplete = (exId) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  };

  const updateExercise = (exId, updates) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exId ? { ...ex, ...updates, was_modified: true } : ex))
    );
  };

  const handleAddExercise = async (data) => {
    try {
      const newEx = await api.addExercise(parseInt(dayNumber), data, user.id);
      setExercises((prev) => [...prev, { ...newEx, was_modified: false, original_name: newEx.name }]);
      toast.success("Exercise Added");
    } catch {
      toast.error("Failed To Add Exercise");
    }
  };

  const handleDeleteExercise = async (exId) => {
    try {
      await api.deleteExercise(parseInt(dayNumber), exId, user.id);
      setExercises((prev) => prev.filter((ex) => ex.id !== exId));
      setCompleted((prev) => { const n = new Set(prev); n.delete(exId); return n; });
      toast.success("Exercise Removed");
    } catch {
      toast.error("Failed To Remove Exercise");
    }
  };

  const progress = exercises.length > 0 ? (completed.size / exercises.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="animate-pulse text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32" data-testid="active-workout">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 glass-soft bg-background/70 border-b border-border/20">
        <div className="max-w-md mx-auto px-5 pt-14 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 rounded-2xl bg-secondary/80 card-blur flex items-center justify-center transition-all active:scale-90"
              data-testid="back-button"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Workout</p>
              <h1 className="text-2xl font-bold" data-testid="workout-title">{plan?.name}</h1>
            </div>
          </div>
          {exercises.length > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1" data-testid="workout-progress" />
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                {completed.size}/{exercises.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Exercise List */}
      <div className="max-w-md mx-auto px-5 pt-6 space-y-4">
        {exercises.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No Exercises Yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Add Your First Exercise Below</p>
          </div>
        )}

        {exercises.map((ex, i) => {
          const isDone = completed.has(ex.id);
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-4 card-blur transition-all ${
                isDone ? "bg-secondary/30 border-border/20 opacity-60" : "bg-card/80 border-border/40"
              }`}
              data-testid={`exercise-card-${ex.id}`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => toggleComplete(ex.id)}
                  className="w-6 h-6 rounded-lg shrink-0"
                  data-testid={`exercise-checkbox-${ex.id}`}
                />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedExercise(ex)}
                  data-testid={`exercise-info-${ex.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MuscleIcon group={ex.muscle_group} size="sm" />
                    <span className={`font-bold text-sm truncate capitalize ${isDone ? "line-through" : ""}`}>
                      {ex.name}
                    </span>
                    {ex.was_modified && (
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">MOD</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-10">
                    {ex.reps > 0 ? (
                      <>
                        <span className="font-medium">{ex.sets}x{ex.reps}</span>
                        <span>-</span>
                        <span>{ex.rest_time}</span>
                      </>
                    ) : (
                      <span>{ex.notes || "10 Min"}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary leading-none">
                      {ex.current_load === "Bodyweight" ? "—" : ex.current_load}
                    </span>
                    {ex.current_load !== "Bodyweight" && (
                      <span className="text-[10px] font-medium text-muted-foreground block">kg</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingExercise(ex); }}
                    className="w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center transition-all active:scale-90"
                    data-testid={`edit-exercise-${ex.id}`}
                  >
                    <Edit3 size={14} className="text-muted-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Add Exercise Button */}
        <button
          onClick={() => setAddingExercise(true)}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground flex items-center justify-center gap-2 transition-all hover:border-primary/30 hover:text-primary active:scale-[0.98]"
          data-testid="add-exercise-btn"
        >
          <Plus size={16} />
          <span className="text-sm font-bold">Add Exercise</span>
        </button>
      </div>

      {/* Complete Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-5 glass-soft bg-background/70 border-t border-border/20">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => setShowComplete(true)}
            className="w-full h-14 rounded-2xl text-base font-bold"
            disabled={completed.size === 0}
            data-testid="complete-workout-btn"
          >
            <Check size={20} className="mr-2" />
            Complete Workout ({completed.size}/{exercises.length})
          </Button>
        </div>
      </div>

      {/* Exercise Detail */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        dayNumber={parseInt(dayNumber)}
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        onLoadUpdated={(exId, newLoad) => {
          setExercises((prev) =>
            prev.map((ex) => (ex.id === exId ? { ...ex, current_load: newLoad } : ex))
          );
        }}
      />

      {/* Edit Exercise */}
      <EditExerciseDialog
        exercise={editingExercise}
        dayNumber={parseInt(dayNumber)}
        open={!!editingExercise}
        onClose={() => setEditingExercise(null)}
        onSave={(exId, updates) => {
          updateExercise(exId, updates);
          setEditingExercise(null);
        }}
        onDelete={handleDeleteExercise}
      />

      {/* Add Exercise Dialog */}
      <EditExerciseDialog
        exercise={null}
        dayNumber={parseInt(dayNumber)}
        open={addingExercise}
        onClose={() => setAddingExercise(false)}
        onAdd={(data) => {
          handleAddExercise(data);
          setAddingExercise(false);
        }}
        mode="add"
      />

      {/* Complete Workout */}
      <CompleteWorkoutSheet
        plan={plan}
        exercises={exercises}
        completed={completed}
        open={showComplete}
        onClose={() => setShowComplete(false)}
        onComplete={() => navigate("/")}
      />
    </div>
  );
}
