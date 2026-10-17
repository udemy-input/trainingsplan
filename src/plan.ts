import { EXERCISES } from './exercises.ts'
import type {
  Category,
  DayFocus,
  Equipment,
  Exercise,
  Goal,
  Intensity,
  Level,
  Plan,
  PlanDay,
  PlanInput,
  Range,
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
 * Sätze nach Ziel: kraft 5, muskelaufbau 4, ausdauer 3.
 *
 * Bereich nach Ziel und Intensität der Übung (Wdh bzw. Sekunden), damit z. B.
 * niemand 15 Muscle-ups oder nur 10 s Plank machen soll:
 *                 leicht          mittel          schwer         maximal
 *   kraft        10–15 / 20–30 s  3–6 / 10–20 s   3–5 / 5–10 s   1–3 / 3–5 s
 *   muskelaufbau 15–20 / 30–45 s  8–12 / 20–40 s  5–8 / 10–15 s  3–5 / 5–10 s
 *   ausdauer     20–30 / 45–90 s  15–25 / 30–60 s 8–12 / 15–20 s 4–6 / 10–15 s
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

const r = (min: number, max: number): Range => ({ min, max })

export const GOAL_RULES: Record<
  Goal,
  {
    sets: number
    ranges: Record<Unit, Record<Intensity, Range>>
    rest: Range
  }
> = {
  kraft: {
    sets: 5,
    ranges: {
      wdh: {
        leicht: r(10, 15),
        mittel: r(3, 6),
        schwer: r(3, 5),
        maximal: r(1, 3),
      },
      sek: {
        leicht: r(20, 30),
        mittel: r(10, 20),
        schwer: r(5, 10),
        maximal: r(3, 5),
      },
    },
    rest: r(120, 180),
  },
  muskelaufbau: {
    sets: 4,
    ranges: {
      wdh: {
        leicht: r(15, 20),
        mittel: r(8, 12),
        schwer: r(5, 8),
        maximal: r(3, 5),
      },
      sek: {
        leicht: r(30, 45),
        mittel: r(20, 40),
        schwer: r(10, 15),
        maximal: r(5, 10),
      },
    },
    rest: r(60, 90),
  },
  ausdauer: {
    sets: 3,
    ranges: {
      wdh: {
        leicht: r(20, 30),
        mittel: r(15, 25),
        schwer: r(8, 12),
        maximal: r(4, 6),
      },
      sek: {
        leicht: r(45, 90),
        mittel: r(30, 60),
        schwer: r(15, 20),
        maximal: r(10, 15),
      },
    },
    rest: r(30, 45),
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
// Ganzkörper und Oberkörper haben auf jeder Stufe mindestens so viel Pull wie
// Push – Drücken überwiegt im Alltag ohnehin.
const SLOTS: Record<DayFocus, readonly Category[]> = {
  ganzkoerper: ['push', 'pull', 'beine', 'core', 'pull', 'push'],
  oberkoerper: ['push', 'pull', 'pull', 'push', 'core', 'pull'],
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
  const week: WeekState = { uses: new Map(), gear: new Set() }
  const rules = GOAL_RULES[goal]

  const planDays = SPLITS[days].map((focus, index): PlanDay => {
    const today: Exercise[] = []
    const exercises = SLOTS[focus]
      .slice(0, EXERCISES_PER_DAY[level])
      .map((category): PlannedExercise => {
        const exercise = pickExercise(pool, category, today, week)
        today.push(exercise)
        week.uses.set(exercise.id, (week.uses.get(exercise.id) ?? 0) + 1)
        for (const eq of exercise.equipment) week.gear.add(eq)
        return {
          exercise,
          sets: rules.sets,
          reps: { ...rules.ranges[exercise.unit][exercise.intensity] },
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

/** Was in der Woche bisher geplant wurde. */
interface WeekState {
  /** Wie oft jede Übung (id) schon vorkam. */
  uses: Map<string, number>
  /** Welche Geräte schon mindestens einmal vorkamen. */
  gear: Set<Equipment>
}

/**
 * Wählt deterministisch, in dieser Rangfolge:
 *   1. höchstens eine Maximal-Übung pro Tag (Sicherheit vor Vielfalt) – eine
 *      zweite nur, wenn es gar keine Alternative gibt,
 *   2. höchste passende Stufe – lieber eine Übung wiederholen als an späteren
 *      Tagen auf eine leichtere Stufe abzufallen,
 *   3. Hauptübung vor Ergänzung (Rudern vor Raises, Kniebeuge vor Wadenheben),
 *   4. diese Woche am seltensten genutzt (Abwechslung),
 *   5. mehr diese Woche noch ungenutzte Geräte zuerst – jedes gewählte Gerät
 *      soll im Plan vorkommen,
 *   6. Geräte-Übung vor reiner Boden-Übung,
 *   7. id als fester Tie-Breaker.
 */
function pickExercise(
  pool: readonly Exercise[],
  category: Category,
  today: readonly Exercise[],
  week: WeekState,
): Exercise {
  const candidates = pool.filter(
    (e) => e.category === category && !today.some((t) => t.id === e.id),
  )
  if (candidates.length === 0) {
    // Lücke in der Übungsdatenbank, nicht im Generator: dort ergänzen.
    throw new Error(`Keine passende Übung für Kategorie „${category}“`)
  }
  const hasMaxToday = today.some((t) => t.intensity === 'maximal')
  const isMain = (e: Exercise) => (e.role === 'haupt' ? 1 : 0)
  const tooHard = (e: Exercise) =>
    hasMaxToday && e.intensity === 'maximal' ? 1 : 0
  const usesOf = (e: Exercise) => week.uses.get(e.id) ?? 0
  const newGear = (e: Exercise) =>
    e.equipment.filter((eq) => !week.gear.has(eq)).length
  const needsGear = (e: Exercise) =>
    e.equipment.some((eq) => eq !== 'boden') ? 1 : 0
  return [...candidates].sort(
    (a, b) =>
      tooHard(a) - tooHard(b) ||
      b.level - a.level ||
      isMain(b) - isMain(a) ||
      usesOf(a) - usesOf(b) ||
      newGear(b) - newGear(a) ||
      needsGear(b) - needsGear(a) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  )[0]
}
