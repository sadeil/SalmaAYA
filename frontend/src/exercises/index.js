// Single registry of available exercises. Add a new rule file, import it here,
// and it lights up in the ExerciseSelector automatically.
import { lungeRules } from "./lunge.rules.js";
import { armRaiseRules } from "./armRaise.rules.js";
import { neckStretchRules } from "./neckStretch.rules.js";
import { backStretchRules } from "./backStretch.rules.js";
import { elbowBendRules } from "./elbowBend.rules.js";

export const exerciseRegistry = [
  neckStretchRules,
  armRaiseRules,
  elbowBendRules,
  lungeRules,
  backStretchRules,
];

export function getExerciseById(id) {
  return exerciseRegistry.find((e) => e.id === id) ?? null;
}
