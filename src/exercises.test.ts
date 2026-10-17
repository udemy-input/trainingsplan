import { describe, expect, it } from 'vitest'
import { EXERCISES } from './exercises.ts'
import type {
  Category,
  Equipment,
  Intensity,
  Level,
  Role,
  Unit,
} from './types.ts'

const LEVELS: readonly Level[] = [1, 2, 3]
const CATEGORIES: readonly Category[] = ['push', 'pull', 'beine', 'core']
const UNITS: readonly Unit[] = ['wdh', 'sek']
const INTENSITIES: readonly Intensity[] = [
  'leicht',
  'mittel',
  'schwer',
  'maximal',
]
const ROLES: readonly Role[] = ['haupt', 'ergaenzung']
const EQUIPMENT: readonly Equipment[] = [
  'boden',
  'klimmzugstange',
  'barren',
  'ringe',
  'baender',
]

/** Übung braucht nur den Boden (leere Liste oder ausschließlich 'boden'). */
function onlyFloor(equipment: readonly Equipment[]): boolean {
  return equipment.every((e) => e === 'boden')
}

describe('Übungsdatenbank EXERCISES', () => {
  it('ist nicht leer', () => {
    expect(EXERCISES.length).toBeGreaterThan(0)
  })

  it('hat eindeutige ids', () => {
    const ids = EXERCISES.map((e) => e.id)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(duplicates).toEqual([])
  })

  it('hat nicht-leere ids', () => {
    const invalid = EXERCISES.filter(
      (e) => typeof e.id !== 'string' || e.id.trim() === '',
    )
    expect(invalid).toEqual([])
  })

  it('hat nicht-leere Namen', () => {
    const invalid = EXERCISES.filter(
      (e) => typeof e.name !== 'string' || e.name.trim() === '',
    )
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat nur gültige Level (1–3)', () => {
    const invalid = EXERCISES.filter((e) => !LEVELS.includes(e.level))
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat nur gültige Kategorien', () => {
    const invalid = EXERCISES.filter((e) => !CATEGORIES.includes(e.category))
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat nur gültige Einheiten', () => {
    const invalid = EXERCISES.filter((e) => !UNITS.includes(e.unit))
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat nur gültige Geräte', () => {
    const invalid = EXERCISES.filter(
      (e) =>
        !Array.isArray(e.equipment) ||
        !e.equipment.every((eq) => EQUIPMENT.includes(eq)),
    )
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat keine doppelten Geräte innerhalb einer Übung', () => {
    const invalid = EXERCISES.filter(
      (e) => new Set(e.equipment).size !== e.equipment.length,
    )
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat zu jeder Übung eine nicht-leere leichtere Variante', () => {
    const invalid = EXERCISES.filter(
      (e) => typeof e.easier !== 'string' || e.easier.trim() === '',
    )
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat keine leichtere Variante, die der Übung selbst entspricht', () => {
    const invalid = EXERCISES.filter(
      (e) => e.easier.trim().toLowerCase() === e.name.trim().toLowerCase(),
    )
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('verweist mit der leichteren Variante nur auf passende Übungen der Datenbank', () => {
    const byName = new Map(EXERCISES.map((e) => [e.name, e]))
    const violations = EXERCISES.flatMap((e) => {
      const target = byName.get(e.easier)
      if (target === undefined) return []
      const allowed = new Set<Equipment>([...e.equipment, 'boden'])
      const out: string[] = []
      if (target.category !== e.category) {
        out.push(`${e.id} → ${target.id}: Kategorie ${target.category}`)
      }
      if (target.level > e.level) {
        out.push(`${e.id} → ${target.id}: Level ${target.level} > ${e.level}`)
      }
      if (!target.equipment.every((eq) => allowed.has(eq))) {
        out.push(
          `${e.id} → ${target.id}: braucht ${target.equipment.join('+')}`,
        )
      }
      return out
    })
    expect(violations).toEqual([])
  })

  it.each(CATEGORIES)(
    'hat für Kategorie "%s" mindestens eine Level-1-Übung nur mit Boden',
    (category) => {
      const matches = EXERCISES.filter(
        (e) =>
          e.category === category && e.level === 1 && onlyFloor(e.equipment),
      )
      expect(matches.length).toBeGreaterThan(0)
    },
  )

  it('hat nur gültige Intensitäten', () => {
    const invalid = EXERCISES.filter((e) => !INTENSITIES.includes(e.intensity))
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  it('hat nur gültige Rollen', () => {
    const invalid = EXERCISES.filter((e) => !ROLES.includes(e.role))
    expect(invalid.map((e) => e.id)).toEqual([])
  })

  // Ein Ganzkörper-Tag braucht je Kategorie eine echte Grundübung – auch nur
  // mit Boden. Für Pull heißt das: Rudern statt nur Raises in Bauchlage.
  it.each(['push', 'pull', 'beine'] as const)(
    'hat für Kategorie "%s" mindestens zwei Level-1-Hauptübungen nur mit Boden',
    (category) => {
      const matches = EXERCISES.filter(
        (e) =>
          e.category === category &&
          e.level === 1 &&
          e.role === 'haupt' &&
          onlyFloor(e.equipment),
      )
      expect(matches.length).toBeGreaterThanOrEqual(2)
    },
  )

  // Fortgeschrittene ohne Geräte brauchen zwei Zugübungen pro Ganzkörper-Tag.
  it('hat mindestens zwei Level-2-Hauptübungen für Pull nur mit Boden', () => {
    const matches = EXERCISES.filter(
      (e) =>
        e.category === 'pull' &&
        e.level === 2 &&
        e.role === 'haupt' &&
        onlyFloor(e.equipment),
    )
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  // Sonst bestünde ein Profi-Oberkörpertag (3 Pull-Plätze) überwiegend aus
  // Maximal-Zugübungen. Mit Stange gibt es zwei Maximal-Übungen auf Level 3.
  it.each([
    ['klimmzugstange', 2],
    ['ringe', 1],
  ] as const)(
    'hat mit Gerät "%s" mindestens %i Level-3-Zugübungen unterhalb von maximal',
    (equipment, min) => {
      const matches = EXERCISES.filter(
        (e) =>
          e.category === 'pull' &&
          e.level === 3 &&
          e.intensity !== 'maximal' &&
          e.equipment.includes(equipment),
      )
      expect(matches.length).toBeGreaterThanOrEqual(min)
    },
  )

  // Sonst verdrängen Boden-Übungen höherer Stufe das Gerät komplett.
  it.each(EQUIPMENT.filter((e) => e !== 'boden'))(
    'hat für Gerät "%s" auf jeder Stufe mindestens eine Übung',
    (equipment) => {
      const missing = LEVELS.filter(
        (level) =>
          !EXERCISES.some(
            (e) => e.level === level && e.equipment.includes(equipment),
          ),
      )
      expect(missing).toEqual([])
    },
  )

  describe('fachliche Einstufung', () => {
    const byId = new Map(EXERCISES.map((e) => [e.id, e]))

    it.each([
      'ring-muscle-up',
      'archer-pull-up',
      'l-sit-pull-up',
      'wall-handstand-push-up',
      'negative-pull-up',
      'negative-dip',
      'l-sit',
    ])('%s ist maximal (nur wenige Wiederholungen)', (id) => {
      expect(byId.get(id)?.intensity).toBe('maximal')
    })

    it.each([
      'pull-up',
      'chin-up',
      'ring-pull-up',
      'dip',
      'ring-dip',
      'straight-bar-dip',
      'pistol-squat',
      'toes-to-bar',
    ])('%s ist schwer', (id) => {
      expect(byId.get(id)?.intensity).toBe('schwer')
    })

    // Knieheben ist auch für Anfänger in 8–15 Wiederholungen machbar.
    it.each(['hanging-knee-raise', 'bar-knee-raise'])('%s ist mittel', (id) => {
      expect(byId.get(id)?.intensity).toBe('mittel')
    })

    // Superman Hold ist nur die gehaltene Variante des Superman (Level 1).
    it('superman-hold ist Level 1', () => {
      expect(byId.get('superman-hold')?.level).toBe(1)
    })

    it.each(['wall-push-up', 'calf-raise', 'mountain-climber', 'plank'])(
      '%s ist leicht (mehr Wiederholungen bzw. längeres Halten)',
      (id) => {
        expect(byId.get(id)?.intensity).toBe('leicht')
      },
    )

    it.each([
      'wall-push-up',
      'knee-diamond-push-up',
      'calf-raise',
      'prone-w-raise',
      'prone-y-raise',
      'reverse-snow-angel',
      'superman',
      'dead-hang',
      'band-pull-apart',
    ])('%s ist eine Ergänzung, keine Hauptübung', (id) => {
      expect(byId.get(id)?.role).toBe('ergaenzung')
    })

    it.each(['knee-push-up', 'squat', 'pull-up', 'ring-row', 'band-row'])(
      '%s ist eine Hauptübung',
      (id) => {
        expect(byId.get(id)?.role).toBe('haupt')
      },
    )
  })
})
