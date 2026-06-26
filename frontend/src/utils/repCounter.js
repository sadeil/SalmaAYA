// Generic two-stage rep counter built on top of a hysteresis state machine.
//
// Every exercise rule file emits a `stage` value per frame (e.g. "up" | "down" |
// null). A rep is counted only on the transition `up -> down -> up`, AND only
// when a debounce delay has passed since the last transition. Without debounce
// the counter double-counts when angles flicker right at the threshold.
//
// The counter also accepts a `qualityHint` from the rule file so each rep can
// be tagged as `correct` or `incorrect`. A rep is "correct" only if no mistake
// was raised between entering the down stage and returning to the up stage.

export function createRepCounter({
  startStage = "up",
  countOnReturnTo = "up",
  minStageMs = 250,
} = {}) {
  let total = 0;
  let correct = 0;
  let stage = startStage;
  let lastStageChangeAt = 0;
  let descended = false;
  let mistakeDuringRep = false;
  const mistakeBuckets = new Map();

  return {
    update({ now, nextStage, mistakes }) {
      if (Array.isArray(mistakes) && mistakes.length > 0) {
        // We only consider a mistake "during a rep" once the user has begun
        // the descent — mistakes detected while idle in `up` stage shouldn't
        // taint the next rep.
        if (descended) mistakeDuringRep = true;
        for (const m of mistakes) {
          mistakeBuckets.set(m, (mistakeBuckets.get(m) ?? 0) + 1);
        }
      }
      if (!nextStage || nextStage === stage) return null;
      if (now - lastStageChangeAt < minStageMs) return null;

      const previous = stage;
      stage = nextStage;
      lastStageChangeAt = now;

      if (previous === startStage && nextStage !== startStage) {
        descended = true;
        mistakeDuringRep = false;
      }
      if (descended && nextStage === countOnReturnTo) {
        total += 1;
        if (!mistakeDuringRep) correct += 1;
        descended = false;
        const result = { total, correct, wasCorrect: !mistakeDuringRep };
        mistakeDuringRep = false;
        return result;
      }
      return null;
    },
    getStage() {
      return stage;
    },
    snapshot() {
      return {
        total,
        correct,
        incorrect: total - correct,
        mistakes: Object.fromEntries(mistakeBuckets),
      };
    },
    reset() {
      total = 0;
      correct = 0;
      stage = startStage;
      lastStageChangeAt = 0;
      descended = false;
      mistakeDuringRep = false;
      mistakeBuckets.clear();
    },
  };
}
