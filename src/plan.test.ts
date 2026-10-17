import { afterEach, describe, expect, it, vi } from 'vitest'
import { GOAL_RULES as PLAN_GOAL_RULES, generatePlan } from './plan.ts'
import { EXERCISES } from './exercises.ts'
import type {
  Category,
  DayFocus,
  Equipment,
  Goal,
  Intensity,
  Level,
  Plan,
  PlanInput,
  Range,
  Exercise,
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

const r = (min: number, max: number): Range => ({ min, max })

const GOAL_RULES: Record<
  Goal,
  { sets: number; ranges: Record<Unit, Record<Intensity, Range>> }
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

  it('setzt Sätze und Bereich nach Ziel, Einheit und Intensität der Übung', () => {
    const v = violationsForAll((input, plan) => {
      const rule = GOAL_RULES[input.goal]
      return plan.days.flatMap((d) =>
        d.exercises.flatMap((p) => {
          const out: string[] = []
          const range = rule.ranges[p.exercise.unit][p.exercise.intensity]
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
        expect(p.reps).toEqual(
          GOAL_RULES[goal].ranges[p.exercise.unit][p.exercise.intensity],
        )
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

describe('generatePlan – Wiederholungen passen zur Übung', () => {
  it('verlangt nie mehr als 6 Ring Muscle-ups pro Satz', () => {
    const v = violationsForAll((_, plan) =>
      plan.days.flatMap((d) =>
        d.exercises
          .filter((p) => p.exercise.id === 'ring-muscle-up' && p.reps.max > 6)
          .map((p) => `Tag ${d.day}: ${p.reps.min}–${p.reps.max}`),
      ),
    )
    expect(v).toEqual([])
  })

  it('verlangt bei Maximal-Übungen nie mehr als 6 Wdh. bzw. 15 s', () => {
    const v = violationsForAll((_, plan) =>
      plan.days.flatMap((d) =>
        d.exercises
          .filter(
            (p) =>
              p.exercise.intensity === 'maximal' &&
              p.reps.max > (p.exercise.unit === 'wdh' ? 6 : 15),
          )
          .map((p) => `Tag ${d.day}: ${p.exercise.id} ${p.reps.max}`),
      ),
    )
    expect(v).toEqual([])
  })

  it('gibt je Ziel und Einheit mit steigender Intensität kleinere Bereiche', () => {
    const order: readonly Intensity[] = [
      'leicht',
      'mittel',
      'schwer',
      'maximal',
    ]
    const v: string[] = []
    for (const goal of GOALS) {
      for (const unit of ['wdh', 'sek'] as const) {
        const ranges = PLAN_GOAL_RULES[goal].ranges[unit]
        for (let i = 1; i < order.length; i++) {
          const easier = ranges[order[i - 1]]
          const harder = ranges[order[i]]
          if (harder.max >= easier.max || harder.min > easier.min) {
            v.push(
              `${goal}/${unit}: ${order[i]} nicht kleiner als ${order[i - 1]}`,
            )
          }
        }
      }
    }
    expect(v).toEqual([])
  })

  it('lässt bei Kraft eine Plank mindestens 20 s halten', () => {
    const plan = generatePlan({
      level: 1,
      days: 3,
      goal: 'kraft',
      equipment: [],
    })
    const plank = plan.days
      .flatMap((d) => d.exercises)
      .find((p) => p.exercise.id === 'plank')
    expect(plank?.reps.min).toBeGreaterThanOrEqual(20)
  })
})

/** Übungen, die für diese Eingabe überhaupt in Frage kommen. */
function poolFor(input: PlanInput) {
  const available = new Set<Equipment>([...input.equipment, 'boden'])
  return EXERCISES.filter(
    (e) =>
      e.level <= input.level && e.equipment.every((eq) => available.has(eq)),
  )
}

/**
 * Ruft check für jede geplante Übung mit den Kandidaten auf, die beim Wählen
 * noch frei waren (gleiche Kategorie, an diesem Tag noch nicht vergeben).
 * Hatte der Tag schon eine Maximal-Übung, zählen weitere Maximal-Übungen nicht
 * als freie Alternative – Sicherheit geht vor Stufe und Rolle.
 */
function violationsPerPick(
  check: (picked: Exercise, free: Exercise[]) => string | undefined,
): string[] {
  return violationsForAll((input, plan) => {
    const pool = poolFor(input)
    return plan.days.flatMap((d) =>
      d.exercises.flatMap((p, i) => {
        const takenSoFar = new Set(
          d.exercises.slice(0, i + 1).map((q) => q.exercise.id),
        )
        const maxBefore = d.exercises
          .slice(0, i)
          .some((q) => q.exercise.intensity === 'maximal')
        const free = pool.filter(
          (e) =>
            e.category === p.exercise.category &&
            !takenSoFar.has(e.id) &&
            !(maxBefore && e.intensity === 'maximal'),
        )
        const msg = check(p.exercise, free)
        return msg ? [`Tag ${d.day}: ${msg}`] : []
      }),
    )
  })
}

describe('generatePlan – Auswahl der Übungen', () => {
  it('wählt je Platz die höchste noch freie Stufe (kein Abfall an späteren Tagen)', () => {
    const v = violationsPerPick((picked, free) => {
      const higher = free.find((e) => e.level > picked.level)
      return higher
        ? `${picked.id} (L${picked.level}) statt ${higher.id} (L${higher.level})`
        : undefined
    })
    expect(v).toEqual([])
  })

  it('wählt eine Ergänzung erst, wenn keine Hauptübung gleicher Stufe mehr frei ist', () => {
    const v = violationsPerPick((picked, free) => {
      if (picked.role !== 'ergaenzung') return undefined
      const main = free.find(
        (e) => e.level === picked.level && e.role === 'haupt',
      )
      return main ? `${picked.id} statt Hauptübung ${main.id}` : undefined
    })
    expect(v).toEqual([])
  })

  it('gibt Fortgeschrittenen mit nur Boden keine Level-1-Push-Übung', () => {
    const v: string[] = []
    for (const days of DAYS) {
      for (const goal of GOALS) {
        const plan = generatePlan({ level: 2, days, goal, equipment: [] })
        for (const d of plan.days) {
          for (const p of d.exercises) {
            if (p.exercise.category === 'push' && p.exercise.level === 1) {
              v.push(`${days}T/${goal} Tag ${d.day}: ${p.exercise.id}`)
            }
          }
        }
      }
    }
    expect(v).toEqual([])
  })

  it('hat an jedem Tag für jede Hauptkategorie des Tagestyps eine Hauptübung', () => {
    const MAIN_CATEGORIES: Record<DayFocus, readonly Category[]> = {
      ganzkoerper: ['push', 'pull', 'beine'],
      oberkoerper: ['push', 'pull'],
      unterkoerper: ['beine'],
      push: ['push'],
      pull: ['pull'],
      beine: ['beine'],
    }
    const v = violationsForAll((_, plan) =>
      plan.days.flatMap((d) =>
        MAIN_CATEGORIES[d.focus]
          .filter(
            (c) =>
              !d.exercises.some(
                (p) => p.exercise.category === c && p.exercise.role === 'haupt',
              ),
          )
          .map((c) => `Tag ${d.day}: keine Hauptübung für ${c}`),
      ),
    )
    expect(v).toEqual([])
  })

  it('hat an Ganzkörper- und Oberkörper-Tagen mindestens so viel Pull wie Push', () => {
    const v = violationsForAll((_, plan) =>
      plan.days
        .filter((d) => d.focus === 'ganzkoerper' || d.focus === 'oberkoerper')
        .flatMap((d) => {
          const count = (c: string) =>
            d.exercises.filter((p) => p.exercise.category === c).length
          return count('pull') < count('push')
            ? [`Tag ${d.day}: ${count('push')} Push, ${count('pull')} Pull`]
            : []
        }),
    )
    expect(v).toEqual([])
  })

  it('nutzt jedes gewählte Zusatzgerät auch (alle Kombinationen)', () => {
    const v = violationsForAll((input, plan) =>
      input.equipment
        .filter(
          (eq) =>
            !plan.days.some((d) =>
              d.exercises.some((p) => p.exercise.equipment.includes(eq)),
            ),
        )
        .map((eq) => `${eq} kommt nicht vor`),
    )
    expect(v).toEqual([])
  })

  it('hat an Ganzkörper- und Oberkörper-Tagen höchstens eine Maximal-Übung', () => {
    const v = violationsForAll((_, plan) =>
      plan.days
        .filter((d) => d.focus === 'ganzkoerper' || d.focus === 'oberkoerper')
        .flatMap((d) => {
          const max = d.exercises.filter(
            (p) => p.exercise.intensity === 'maximal',
          )
          return max.length > 1
            ? [`Tag ${d.day}: ${max.map((p) => p.exercise.id).join(', ')}`]
            : []
        }),
    )
    expect(v).toEqual([])
  })

  it('gibt Fortgeschrittenen mit nur Boden an Ganzkörper-Tagen zweimal echtes Rudern', () => {
    const v: string[] = []
    for (const goal of GOALS) {
      const plan = generatePlan({ level: 2, days: 3, goal, equipment: [] })
      for (const d of plan.days) {
        const mainPulls = d.exercises.filter(
          (p) => p.exercise.category === 'pull' && p.exercise.role === 'haupt',
        )
        if (mainPulls.length < 2) {
          v.push(`${goal} Tag ${d.day}: ${mainPulls.length} Haupt-Zugübungen`)
        }
      }
    }
    expect(v).toEqual([])
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
