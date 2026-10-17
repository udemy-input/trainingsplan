export type Level = 1 | 2 | 3

export type TrainingDays = 2 | 3 | 4 | 5

export type Goal = 'kraft' | 'muskelaufbau' | 'ausdauer'

export type Equipment =
  'boden' | 'klimmzugstange' | 'barren' | 'ringe' | 'baender'

export type Category = 'push' | 'pull' | 'beine' | 'core'

export type DayFocus =
  'ganzkoerper' | 'oberkoerper' | 'unterkoerper' | 'push' | 'pull' | 'beine'

/** Wiederholungen oder Haltezeit in Sekunden. */
export type Unit = 'wdh' | 'sek'

export interface Exercise {
  id: string
  name: string
  category: Category
  /** Alle hier genannten Geräte werden gleichzeitig benötigt. */
  equipment: readonly Equipment[]
  level: Level
  unit: Unit
}

export interface PlanInput {
  level: Level
  days: TrainingDays
  /** Boden ist immer verfügbar, auch wenn er hier fehlt. */
  equipment: readonly Equipment[]
  goal: Goal
}

export interface PlannedExercise {
  exercise: Exercise
  sets: number
  /** Bereich in der Einheit der Übung (Wiederholungen oder Sekunden). */
  reps: { min: number; max: number }
  /** Pause zwischen den Sätzen in Sekunden. */
  rest: { min: number; max: number }
}

export interface PlanDay {
  /** 1-basiert */
  day: number
  focus: DayFocus
  title: string
  exercises: PlannedExercise[]
}

export interface Plan {
  days: PlanDay[]
}
