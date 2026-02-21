import { Heart, Undo2, Zap, Target, ArrowDown, ArrowUp, Shield, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";

const config = {
  chest: { Icon: Heart, label: "Pettorali", bg: "bg-rose-500/15", text: "text-rose-500" },
  back: { Icon: Undo2, label: "Dorsali", bg: "bg-sky-500/15", text: "text-sky-500" },
  quads: { Icon: Zap, label: "Quadricipiti", bg: "bg-emerald-500/15", text: "text-emerald-500" },
  hamstrings: { Icon: Footprints, label: "Femorali", bg: "bg-lime-500/15", text: "text-lime-500" },
  shoulders: { Icon: Target, label: "Deltoidi", bg: "bg-amber-500/15", text: "text-amber-500" },
  triceps: { Icon: ArrowDown, label: "Tricipiti", bg: "bg-violet-500/15", text: "text-violet-500" },
  biceps: { Icon: ArrowUp, label: "Bicipiti", bg: "bg-teal-500/15", text: "text-teal-500" },
  abs: { Icon: Shield, label: "Addominali", bg: "bg-orange-500/15", text: "text-orange-500" },
};

export function MuscleIcon({ group, size = "md", showLabel = false }) {
  const { Icon, label, bg, text } = config[group] || config.chest;
  const sizeClasses = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 24 : 18;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-2xl flex items-center justify-center shrink-0", sizeClasses, bg)}>
        <Icon size={iconSize} className={text} />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-bold uppercase tracking-wider", text)}>{label}</span>
      )}
    </div>
  );
}
