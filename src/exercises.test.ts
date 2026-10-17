import { describe, expect, it } from 'vitest'
import { EXERCISES } from './exercises.ts'
import type { Category, Equipment, Level, Unit } from './types.ts'

const LEVELS: readonly Level[] = [1, 2, 3]
const CATEGORIES: readonly Category[] = ['push', 'pull', 'beine', 'core']
const UNITS: readonly Unit[] = ['wdh', 'sek']
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
})
