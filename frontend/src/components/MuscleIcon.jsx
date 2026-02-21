import { cn } from "@/lib/utils";

const Svg = ({ children, className }) => (
  <svg viewBox="0 0 24 24" className={cn("w-full h-full", className)}>{children}</svg>
);

const config = {
  chest: {
    label: "Chest", bg: "bg-rose-500/15", text: "text-rose-500",
    svg: <Svg><path d="M4 14c0-5 3.5-8 8-6 4.5-2 8 1 8 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="8" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/></Svg>,
  },
  back: {
    label: "Back", bg: "bg-sky-500/15", text: "text-sky-500",
    svg: <Svg><path d="M12 5v14M7 6L4 19M17 6l3 13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></Svg>,
  },
  quads: {
    label: "Quads", bg: "bg-emerald-500/15", text: "text-emerald-500",
    svg: <Svg><rect x="5.5" y="3" width="5" height="18" rx="2.5" fill="currentColor" opacity="0.85"/><rect x="13.5" y="3" width="5" height="18" rx="2.5" fill="currentColor" opacity="0.85"/></Svg>,
  },
  hamstrings: {
    label: "Hamstrings", bg: "bg-lime-500/15", text: "text-lime-500",
    svg: <Svg><path d="M8 4c.5 5 .5 11-.5 16M16 4c-.5 5-.5 11 .5 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></Svg>,
  },
  shoulders: {
    label: "Shoulders", bg: "bg-amber-500/15", text: "text-amber-500",
    svg: <Svg><path d="M4 18c0-8 3.5-14 8-14s8 6 8 14H4z" fill="currentColor" opacity="0.8"/></Svg>,
  },
  triceps: {
    label: "Triceps", bg: "bg-violet-500/15", text: "text-violet-500",
    svg: <Svg><path d="M12 3v12M8 11l4 5 4-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>,
  },
  biceps: {
    label: "Biceps", bg: "bg-teal-500/15", text: "text-teal-500",
    svg: <Svg><path d="M7 19l2-7c.5-2 1.5-3.5 3-5 2-2 3-.5 3 1.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><circle cx="14.5" cy="10" r="2.5" fill="currentColor" opacity="0.4"/></Svg>,
  },
  abs: {
    label: "Abs", bg: "bg-orange-500/15", text: "text-orange-500",
    svg: <Svg><rect x="6" y="3" width="5" height="4.5" rx="1.5" fill="currentColor" opacity="0.9"/><rect x="13" y="3" width="5" height="4.5" rx="1.5" fill="currentColor" opacity="0.9"/><rect x="6" y="9.5" width="5" height="4.5" rx="1.5" fill="currentColor" opacity="0.7"/><rect x="13" y="9.5" width="5" height="4.5" rx="1.5" fill="currentColor" opacity="0.7"/><rect x="6" y="16" width="5" height="4.5" rx="1.5" fill="currentColor" opacity="0.5"/><rect x="13" y="16" width="5" height="4.5" rx="1.5" fill="currentColor" opacity="0.5"/></Svg>,
  },
};

export function MuscleIcon({ group, size = "md", showLabel = false }) {
  const { label, bg, text, svg } = config[group] || config.chest;
  const containerSize = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";

  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-2xl flex items-center justify-center shrink-0", containerSize, bg, text)}>
        <div className={iconSize}>{svg}</div>
      </div>
      {showLabel && (
        <span className={cn("text-xs font-bold uppercase tracking-wider", text)}>{label}</span>
      )}
    </div>
  );
}
