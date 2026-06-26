import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

// Horizontal scroller of selectable exercise cards. The visual is intentionally
// simple — each rule file owns its own deeper UI inside FeedbackPanel.

export function ExerciseSelector({ exercises, selectedId, onSelect, disabled }) {
  const recommended = new Set(["neckStretch", "armRaise", "elbowBend"]);

  return (
    <div className="card p-4">
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        Start with the easy exercises
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {exercises.map((exercise) => {
          const isSelected = exercise.id === selectedId;
          return (
            <motion.button
              key={exercise.id}
              onClick={() => !disabled && onSelect(exercise.id)}
              whileHover={{ y: disabled ? 0 : -2 }}
              disabled={disabled}
              className={`group min-w-[200px] rounded-2xl border p-3 text-left transition ${
                isSelected
                  ? "border-teal-500 bg-teal-50 shadow-card"
                  : "border-slate-200 bg-white hover:border-teal-300"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-extrabold text-ink">{exercise.name}</p>
                {recommended.has(exercise.id) && (
                  <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-teal-700">
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{exercise.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs font-bold text-teal-700">
                <span>{exercise.requiredLandmarks.length} landmarks</span>
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
