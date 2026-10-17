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

/** Bereich von–bis, z. B. Wiederholungen, Sekunden oder Pause. */
export interface Range {
  min: number
  max: number
}

/**
 * Wie viele Wiederholungen bzw. Sekunden pro Satz realistisch sind – für
 * jemanden, der die Übung gerade sauber beherrscht. Unabhängig vom Level:
 * Ein Negative Pull-up (Level 1) ist für Anfänger genauso nah am Maximum wie
 * ein Ring Muscle-up (Level 3) für Profis.
 */
export type Intensity = 'leicht' | 'mittel' | 'schwer' | 'maximal'

/**
 * Hauptübung (Grundübung, trägt den Tag) oder Ergänzung (Isolation, Halten,
 * Schulterpflege). Bei gleicher Stufe kommen Hauptübungen zuerst dran.
 */
export type Role = 'haupt' | 'ergaenzung'

export interface Exercise {
  id: string
  name: string
  category: Category
  /** Alle hier genannten Geräte werden gleichzeitig benötigt. */
  equipment: readonly Equipment[]
  level: Level
  unit: Unit
  intensity: Intensity
  role: Role
  /**
   * Leichtere Variante (Regression) als kurzer Text. Braucht keine Geräte über
   * die der Übung hinaus (Boden ist immer erlaubt) und ist nie schwerer als die
   * Übung selbst. Entspricht sie einer anderen Übung der Datenbank, steht hier
   * deren Name.
   */
  easier: string
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
  reps: Range
  /** Pause zwischen den Sätzen in Sekunden. */
  rest: Range
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
