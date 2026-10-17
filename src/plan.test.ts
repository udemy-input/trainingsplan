import { afterEach, describe, expect, it, vi } from 'vitest'
import { generatePlan } from './plan.ts'
import { EXERCISES } from './exercises.ts'
import type {
  DayFocus,
  Equipment,
  Goal,
  Level,
  Plan,
  PlanInput,
  TrainingDays,
  Unit,
} from './types.ts'

// ---------------------------------------------------------------------------
// Vertrag aus dem Doc-Kommentar von src/plan.ts
// ---------------------------------------------------------------------------

const LEVELS: readonly Level[] = [1, 2, 3]
const DAYS: readonly TrainingDays[] = [2, 3, 4, 5]
const GOALS: readonly Goal[] = ['kraft', 'muskelaufbau', 'ausdauer']
const EXTRA_EQUIPMENT: readonly Equipment[] = [
  'klimmzugstange',
  'barren',
  'ringe',
  'baender',
]

const SPLIT: Record<TrainingDays, readonly DayFocus[]> = {
  2: ['ganzkoerper', 'ganzkoerper'],
  3: ['ganzkoerper', 'ganzkoerper', 'ganzkoerper'],
  4: ['oberkoerper', 'unterkoerper', 'oberkoerper', 'unterkoerper'],
  5: ['push', 'pull', 'beine', 'oberkoerper', 'unterkoerper'],
}

const EXERCISES_PER_DAY: Record<Level, number> = { 1: 4, 2: 5, 3: 6 }

interface Range {
  min: number
  max: number
}

const GOAL_RULES: Record<Goal, { sets: number; ranges: Record<Unit, Range> }> =
  {
    kraft: {
      sets: 5,
      ranges: { wdh: { min: 3, max: 6 }, sek: { min: 10, max: 20 } },
    },
    muskelaufbau: {
      sets: 4,
      ranges: { wdh: { min: 8, max: 12 }, sek: { min: 20, max: 40 } },
    },
    ausdauer: {
      sets: 3,
      ranges: { wdh: { min: 15, max: 25 }, sek: { min: 30, max: 60 } },
    },
  }

// ---------------------------------------------------------------------------
// Eingabe-Kombinationen
// ---------------------------------------------------------------------------

/** Alle 16 Teilmengen der vier Zusatzgeräte (leere Liste = nur Boden). */
function equipmentSubsets(): Equipment[][] {
  const subsets: Equipment[][] = []
  for (let mask = 0; mask < 1 << EXTRA_EQUIPMENT.length; mask++) {
    subsets.push(EXTRA_EQUIPMENT.filter((_, i) => (mask & (1 << i)) !== 0))
  }
  return subsets
}

const EQUIPMENT_SETS = equipmentSubsets()

const ALL_INPUTS: PlanInput[] = LEVELS.flatMap((level) =>
  DAYS.flatMap((days) =>
    GOALS.flatMap((goal) =>
      EQUIPMENT_SETS.map((equipment) => ({ level, days, goal, equipment })),
    ),
  ),
)

function label(input: PlanInput): string {
  const eq = input.equipment.length ? input.equipment.join('+') : 'nur Boden'
  return `L${input.level}/${input.days}T/${input.goal}/${eq}`
}

/** Prüft eine Eigenschaft für alle Kombinationen und sammelt Verstöße. */
function violationsForAll(
  check: (input: PlanInput, plan: Plan) => string[],
): string[] {
  const violations: string[] = []
  for (const input of ALL_INPUTS) {
    const plan = generatePlan(input)
    for (const v of check(input, plan)) violations.push(`${label(input)}: ${v}`)
  }
  return violations
}

const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generatePlan – alle Kombinationen Stufe × Tage × Ziel × Geräte', () => {
  it(`deckt ${ALL_INPUTS.length} Kombinationen ab`, () => {
    expect(ALL_INPUTS.length).toBe(3 * 4 * 3 * 16)
  })

  it('liefert so viele Tage wie Trainingstage, durchnummeriert ab 1', () => {
    const v = violationsForAll((input, plan) => {
      const out: string[] = []
      if (plan.days.length !== input.days) {
        out.push(`${plan.days.length} Tage statt ${input.days}`)
      }
      plan.days.forEach((d, i) => {
        if (d.day !== i + 1) out.push(`Tag an Position ${i} hat day=${d.day}`)
      })
      return out
    })
    expect(v).toEqual([])
  })

  it('verwendet den Split nach Trainingstagen', () => {
    const v = violationsForAll((input, plan) => {
      const focus = plan.days.map((d) => d.focus)
      const expected = SPLIT[input.days]
      return JSON.stringify(focus) === JSON.stringify(expected)
        ? []
        : [`Split ${focus.join(',')} statt ${expected.join(',')}`]
    })
    expect(v).toEqual([])
  })

  it('hat pro Tag die Übungsanzahl nach Stufe (4/5/6)', () => {
    const v = violationsForAll((input, plan) =>
      plan.days
        .filter((d) => d.exercises.length !== EXERCISES_PER_DAY[input.level])
        .map(
          (d) =>
            `Tag ${d.day}: ${d.exercises.length} Übungen statt ${EXERCISES_PER_DAY[input.level]}`,
        ),
    )
    expect(v).toEqual([])
  })

  it('hat keine Übung doppelt am selben Tag', () => {
    const v = violationsForAll((_, plan) =>
      plan.days.flatMap((d) => {
        const ids = d.exercises.map((p) => p.exercise.id)
        const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
        return dup.length ? [`Tag ${d.day}: doppelt ${dup.join(',')}`] : []
      }),
    )
    expect(v).toEqual([])
  })

  it('wählt keine Übung über der Nutzerstufe', () => {
    const v = violationsForAll((input, plan) =>
      plan.days.flatMap((d) =>
        d.exercises
          .filter((p) => p.exercise.level > input.level)
          .map(
            (p) =>
              `Tag ${d.day}: ${p.exercise.id} hat Level ${p.exercise.level}`,
          ),
      ),
    )
    expect(v).toEqual([])
  })

  it('wählt nur Übungen mit verfügbaren Geräten (Boden immer verfügbar)', () => {
    const v = violationsForAll((input, plan) => {
      const available = new Set<Equipment>([...input.equipment, 'boden'])
      return plan.days.flatMap((d) =>
        d.exercises
          .filter((p) => !p.exercise.equipment.every((e) => available.has(e)))
          .map(
            (p) =>
              `Tag ${d.day}: ${p.exercise.id} braucht ${p.exercise.equipment.join('+')}`,
          ),
      )
    })
    expect(v).toEqual([])
  })

  it('gibt zu jeder geplanten Übung eine leichtere Variante mit', () => {
    const v = violationsForAll((_, plan) =>
      plan.days.flatMap((d) =>
        d.exercises
          .filter(
            (p) =>
              typeof p.exercise.easier !== 'string' ||
              p.exercise.easier.trim() === '',
          )
          .map((p) => `Tag ${d.day}: ${p.exercise.id} ohne leichtere Variante`),
      ),
    )
    expect(v).toEqual([])
  })

  it('verwendet nur Übungen aus der Übungsdatenbank', () => {
    const v = violationsForAll((_, plan) =>
      plan.days.flatMap((d) =>
        d.exercises
          .filter((p) => {
            const known = EXERCISE_BY_ID.get(p.exercise.id)
            return (
              known === undefined ||
              JSON.stringify(known) !== JSON.stringify(p.exercise)
            )
          })
          .map((p) => `Tag ${d.day}: unbekannte Übung ${p.exercise.id}`),
      ),
    )
    expect(v).toEqual([])
  })

  it('setzt Sätze und Bereich nach Ziel und Einheit (Wdh bzw. Sekunden)', () => {
    const v = violationsForAll((input, plan) => {
      const rule = GOAL_RULES[input.goal]
      return plan.days.flatMap((d) =>
        d.exercises.flatMap((p) => {
          const out: string[] = []
          const range = rule.ranges[p.exercise.unit]
          if (p.sets !== rule.sets) {
            out.push(`${p.exercise.id}: ${p.sets} Sätze statt ${rule.sets}`)
          }
          if (p.reps.min !== range.min || p.reps.max !== range.max) {
            out.push(
              `${p.exercise.id} (${p.exercise.unit}): ${p.reps.min}–${p.reps.max} statt ${range.min}–${range.max}`,
            )
          }
          return out
        }),
      )
    })
    expect(v).toEqual([])
  })
})

describe('generatePlan – nur Boden + Level 1 + 5 Tage', () => {
  it.each(GOALS)('ergibt einen vollständigen Plan (Ziel %s)', (goal) => {
    const input: PlanInput = { level: 1, days: 5, equipment: [], goal }
    const plan = generatePlan(input)

    expect(plan.days).toHaveLength(5)
    expect(plan.days.map((d) => d.focus)).toEqual(SPLIT[5])
    expect(plan.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5])

    for (const day of plan.days) {
      expect(day.exercises).toHaveLength(4)
      const ids = day.exercises.map((p) => p.exercise.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const p of day.exercises) {
        expect(p.exercise.level).toBe(1)
        expect(p.exercise.equipment.every((e) => e === 'boden')).toBe(true)
        expect(p.sets).toBe(GOAL_RULES[goal].sets)
        expect(p.reps).toEqual(GOAL_RULES[goal].ranges[p.exercise.unit])
      }
    }
  })

  it('liefert denselben Plan mit leerer Liste und mit explizitem Boden', () => {
    const withoutFloor = generatePlan({
      level: 1,
      days: 5,
      equipment: [],
      goal: 'muskelaufbau',
    })
    const withFloor = generatePlan({
      level: 1,
      days: 5,
      equipment: ['boden'],
      goal: 'muskelaufbau',
    })
    expect(withFloor).toEqual(withoutFloor)
  })
})

describe('generatePlan – Determinismus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('liefert bei zweimaligem Aufruf mit gleicher Eingabe denselben Plan (alle Kombinationen)', () => {
    const v: string[] = []
    for (const input of ALL_INPUTS) {
      const a = generatePlan(input)
      const b = generatePlan({ ...input, equipment: [...input.equipment] })
      if (JSON.stringify(a) !== JSON.stringify(b)) v.push(label(input))
    }
    expect(v).toEqual([])
  })

  it.each(LEVELS)(
    'ist unabhängig von der Geräte-Reihenfolge (Level %s)',
    (level) => {
      for (const days of DAYS) {
        for (const goal of GOALS) {
          const base = generatePlan({
            level,
            days,
            goal,
            equipment: [...EXTRA_EQUIPMENT],
          })
          const reversed = generatePlan({
            level,
            days,
            goal,
            equipment: [...EXTRA_EQUIPMENT].reverse(),
          })
          const shuffled = generatePlan({
            level,
            days,
            goal,
            equipment: [
              'ringe',
              'boden',
              'baender',
              'klimmzugstange',
              'barren',
            ],
          })
          expect(reversed).toEqual(base)
          expect(shuffled).toEqual(base)
        }
      }
    },
  )

  it('ist unabhängig von der Reihenfolge bei allen Teilmengen', () => {
    const v: string[] = []
    for (const input of ALL_INPUTS) {
      const a = generatePlan(input)
      const b = generatePlan({
        ...input,
        equipment: [...input.equipment].reverse(),
      })
      if (JSON.stringify(a) !== JSON.stringify(b)) v.push(label(input))
    }
    expect(v).toEqual([])
  })

  it('ist unabhängig von doppelten Geräten in der Eingabe', () => {
    const v: string[] = []
    for (const input of ALL_INPUTS) {
      const a = generatePlan(input)
      const b = generatePlan({
        ...input,
        equipment: [...input.equipment, ...input.equipment, 'boden', 'boden'],
      })
      if (JSON.stringify(a) !== JSON.stringify(b)) v.push(label(input))
    }
    expect(v).toEqual([])
  })

  it('hängt nicht von Math.random oder der Uhrzeit ab', () => {
    const input: PlanInput = {
      level: 3,
      days: 5,
      goal: 'kraft',
      equipment: [...EXTRA_EQUIPMENT],
    }

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const a = generatePlan(input)

    vi.setSystemTime(new Date('2031-07-15T13:37:00Z'))
    vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const b = generatePlan(input)

    expect(b).toEqual(a)
  })

  it('verändert die Eingabe nicht', () => {
    const equipment: Equipment[] = ['ringe', 'klimmzugstange', 'ringe']
    const input: PlanInput = { level: 2, days: 4, goal: 'ausdauer', equipment }
    const snapshot = structuredClone(input)
    generatePlan(input)
    expect(input).toEqual(snapshot)
  })
})

describe('generatePlan – Pause zwischen den Sätzen', () => {
  const REST: Record<Goal, Range> = {
    kraft: { min: 120, max: 180 },
    muskelaufbau: { min: 60, max: 90 },
    ausdauer: { min: 30, max: 45 },
  }

  it('jede Übung hat die Pause ihres Ziels (alle Kombinationen)', () => {
    const v = violationsForAll((input, plan) =>
      plan.days.flatMap((day) =>
        day.exercises
          .filter(
            (pe) =>
              pe.rest?.min !== REST[input.goal].min ||
              pe.rest?.max !== REST[input.goal].max,
          )
          .map(
            (pe) =>
              `Tag ${day.day} ${pe.exercise.id}: ${JSON.stringify(pe.rest)}`,
          ),
      ),
    )
    expect(v).toEqual([])
  })

  it('Pause ist unabhängig von der Einheit (wdh/sek)', () => {
    for (const goal of GOALS) {
      const plan = generatePlan({
        level: 3,
        days: 5,
        goal,
        equipment: [...EXTRA_EQUIPMENT],
      })
      const all = plan.days.flatMap((d) => d.exercises)
      const units = new Set(all.map((pe) => pe.exercise.unit))
      expect(units).toEqual(new Set<Unit>(['wdh', 'sek']))
      for (const pe of all) expect(pe.rest).toEqual(REST[goal])
    }
  })

  it('Kraft-Pause > Muskelaufbau-Pause > Ausdauer-Pause', () => {
    const restOf = (goal: Goal) =>
      generatePlan({ level: 2, days: 3, goal, equipment: [] }).days[0]
        .exercises[0].rest
    const kraft = restOf('kraft')
    const muskel = restOf('muskelaufbau')
    const ausdauer = restOf('ausdauer')
    expect(kraft.min).toBeGreaterThan(muskel.max)
    expect(muskel.min).toBeGreaterThan(ausdauer.max)
  })

  it('min ≤ max und jede Übung hat ein eigenes rest-Objekt', () => {
    const plan = generatePlan({
      level: 3,
      days: 4,
      goal: 'kraft',
      equipment: [],
    })
    const all = plan.days.flatMap((d) => d.exercises)
    for (const pe of all) expect(pe.rest.min).toBeLessThanOrEqual(pe.rest.max)
    all[0].rest.min = 0
    expect(all[1].rest.min).toBe(REST.kraft.min)
    expect(
      generatePlan({ level: 3, days: 4, goal: 'kraft', equipment: [] }).days[0]
        .exercises[0].rest,
    ).toEqual(REST.kraft)
  })
})

describe('generatePlan – ungültige Eingaben', () => {
  const valid: PlanInput = {
    level: 2,
    days: 3,
    goal: 'kraft',
    equipment: [],
  }

  it.each([0, 4, -1, 10])('wirft RangeError bei level=%s', (level) => {
    expect(() =>
      generatePlan({ ...valid, level: level as unknown as Level }),
    ).toThrow(RangeError)
  })

  it.each([0, 1, 6, 7, -2])('wirft RangeError bei days=%s', (days) => {
    expect(() =>
      generatePlan({ ...valid, days: days as unknown as TrainingDays }),
    ).toThrow(RangeError)
  })

  it.each(LEVELS)('wirft nicht bei gültigem level=%s', (level) => {
    expect(() => generatePlan({ ...valid, level })).not.toThrow()
  })

  it.each(DAYS)('wirft nicht bei gültigem days=%s', (days) => {
    expect(() => generatePlan({ ...valid, days })).not.toThrow()
  })
})
