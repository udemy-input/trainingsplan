import { EXERCISES } from './exercises.ts'
import type {
  Category,
  DayFocus,
  Equipment,
  Exercise,
  Goal,
  Level,
  Plan,
  PlanDay,
  PlanInput,
  PlannedExercise,
  TrainingDays,
  Unit,
} from './types.ts'

/**
 * Regeln aus PLAN.md, konkretisiert:
 *
 * Split nach Trainingstagen:
 *   2 → ganzkoerper, ganzkoerper
 *   3 → ganzkoerper, ganzkoerper, ganzkoerper
 *   4 → oberkoerper, unterkoerper, oberkoerper, unterkoerper
 *   5 → push, pull, beine, oberkoerper, unterkoerper
 *
 * Übungen pro Tag nach Stufe: Level 1 → 4, Level 2 → 5, Level 3 → 6.
 *
 * Sätze / Bereich nach Ziel (Wiederholungen bzw. Sekunden bei Halteübungen):
 *   kraft        → 5 Sätze, 3–6 Wdh,   10–20 s
 *   muskelaufbau → 4 Sätze, 8–12 Wdh,  20–40 s
 *   ausdauer     → 3 Sätze, 15–25 Wdh, 30–60 s
 *
 * Pause zwischen den Sätzen nach Ziel (Sekunden, unabhängig von der Einheit):
 *   kraft        → 120–180 s
 *   muskelaufbau →  60–90 s
 *   ausdauer     →  30–45 s
 *
 * Auswahl: nur Übungen mit level ≤ input.level, deren Geräte alle verfügbar
 * sind (Boden immer verfügbar), keine Übung doppelt am selben Tag.
 * Gleiche Eingabe (auch bei anderer Geräte-Reihenfolge oder Duplikaten)
 * ergibt exakt denselben Plan.
 *
 * Wirft RangeError bei level außerhalb 1–3 oder days außerhalb 2–5.
 */

export const SPLITS: Record<TrainingDays, readonly DayFocus[]> = {
  2: ['ganzkoerper', 'ganzkoerper'],
  3: ['ganzkoerper', 'ganzkoerper', 'ganzkoerper'],
  4: ['oberkoerper', 'unterkoerper', 'oberkoerper', 'unterkoerper'],
  5: ['push', 'pull', 'beine', 'oberkoerper', 'unterkoerper'],
}

export const EXERCISES_PER_DAY: Record<Level, number> = { 1: 4, 2: 5, 3: 6 }

export const GOAL_RULES: Record<
  Goal,
  {
    sets: number
    ranges: Record<Unit, { min: number; max: number }>
    rest: { min: number; max: number }
  }
> = {
  kraft: {
    sets: 5,
    ranges: { wdh: { min: 3, max: 6 }, sek: { min: 10, max: 20 } },
    rest: { min: 120, max: 180 },
  },
  muskelaufbau: {
    sets: 4,
    ranges: { wdh: { min: 8, max: 12 }, sek: { min: 20, max: 40 } },
    rest: { min: 60, max: 90 },
  },
  ausdauer: {
    sets: 3,
    ranges: { wdh: { min: 15, max: 25 }, sek: { min: 30, max: 60 } },
    rest: { min: 30, max: 45 },
  },
}

export const FOCUS_TITLES: Record<DayFocus, string> = {
  ganzkoerper: 'Ganzkörper',
  oberkoerper: 'Oberkörper',
  unterkoerper: 'Unterkörper',
  push: 'Push',
  pull: 'Pull',
  beine: 'Beine',
}

// Kategorie je Übungsplatz; eine Stufe nutzt die ersten EXERCISES_PER_DAY Plätze.
const SLOTS: Record<DayFocus, readonly Category[]> = {
  ganzkoerper: ['push', 'pull', 'beine', 'core', 'push', 'beine'],
  oberkoerper: ['push', 'pull', 'push', 'pull', 'core', 'push'],
  unterkoerper: ['beine', 'beine', 'core', 'beine', 'core', 'beine'],
  push: ['push', 'push', 'core', 'push', 'push', 'core'],
  pull: ['pull', 'pull', 'core', 'pull', 'pull', 'core'],
  beine: ['beine', 'beine', 'core', 'beine', 'beine', 'core'],
}

export function generatePlan(input: PlanInput): Plan {
  const { level, days, goal } = input
  if (!(level in EXERCISES_PER_DAY)) {
    throw new RangeError(`Ungültige Stufe: ${level}`)
  }
  if (!(days in SPLITS)) {
    throw new RangeError(`Ungültige Anzahl Trainingstage: ${days}`)
  }

  const available = new Set<Equipment>([...input.equipment, 'boden'])
  const pool = EXERCISES.filter(
    (e) => e.level <= level && e.equipment.every((eq) => available.has(eq)),
  )
  const weeklyUses = new Map<string, number>()
  const rules = GOAL_RULES[goal]

  const planDays = SPLITS[days].map((focus, index): PlanDay => {
    const usedToday = new Set<string>()
    const exercises = SLOTS[focus]
      .slice(0, EXERCISES_PER_DAY[level])
      .map((category): PlannedExercise => {
        const exercise = pickExercise(pool, category, usedToday, weeklyUses)
        usedToday.add(exercise.id)
        weeklyUses.set(exercise.id, (weeklyUses.get(exercise.id) ?? 0) + 1)
        return {
          exercise,
          sets: rules.sets,
          reps: { ...rules.ranges[exercise.unit] },
          rest: { ...rules.rest },
        }
      })
    return {
      day: index + 1,
      focus,
      title: `Tag ${index + 1} – ${FOCUS_TITLES[focus]}`,
      exercises,
    }
  })

  return { days: planDays }
}

/**
 * Wählt deterministisch: zuerst die diese Woche am seltensten genutzte Übung
 * (Abwechslung), dann die höchste passende Stufe, dann Geräte-Übungen vor
 * reinen Boden-Übungen, zuletzt die id als fester Tie-Breaker.
 */
function pickExercise(
  pool: readonly Exercise[],
  category: Category,
  usedToday: ReadonlySet<string>,
  weeklyUses: ReadonlyMap<string, number>,
): Exercise {
  const candidates = pool.filter(
    (e) => e.category === category && !usedToday.has(e.id),
  )
  if (candidates.length === 0) {
    // Lücke in der Übungsdatenbank, nicht im Generator: dort ergänzen.
    throw new Error(`Keine passende Übung für Kategorie „${category}“`)
  }
  const usesOf = (e: Exercise) => weeklyUses.get(e.id) ?? 0
  const needsGear = (e: Exercise) =>
    e.equipment.some((eq) => eq !== 'boden') ? 1 : 0
  return [...candidates].sort(
    (a, b) =>
      usesOf(a) - usesOf(b) ||
      b.level - a.level ||
      needsGear(b) - needsGear(a) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  )[0]
}
