import '@fontsource/big-shoulders-display/700'
import '@fontsource/big-shoulders-display/900'
import '@fontsource/atkinson-hyperlegible/400'
import '@fontsource/atkinson-hyperlegible/700'
import './style.css'
import { FOCUS_TITLES, generatePlan } from './plan.ts'
import type {
  Equipment,
  Goal,
  Level,
  Plan,
  PlanDay,
  PlanInput,
  PlannedExercise,
  Range,
  TrainingDays,
} from './types.ts'

const LEVEL_LABELS: Record<Level, string> = {
  1: 'Anfänger',
  2: 'Fortgeschritten',
  3: 'Profi',
}

const GOAL_LABELS: Record<Goal, string> = {
  kraft: 'Kraft',
  muskelaufbau: 'Muskelaufbau',
  ausdauer: 'Ausdauer',
}

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  boden: 'Boden',
  klimmzugstange: 'Klimmzugstange',
  barren: 'Barren',
  ringe: 'Ringe',
  baender: 'Bänder',
}

const form = document.querySelector<HTMLFormElement>('#plan-form')!
const planSection = document.querySelector<HTMLElement>('#plan')!
const emptyState = document.querySelector<HTMLElement>('#plan-empty')!
const summary = document.querySelector<HTMLUListElement>('#plan-summary')!
const daysContainer = document.querySelector<HTMLDivElement>('#plan-days')!
const printButton = document.querySelector<HTMLButtonElement>('#print')!

function readInput(): PlanInput {
  const data = new FormData(form)
  return {
    level: Number(data.get('level')) as Level,
    days: Number(data.get('days')) as TrainingDays,
    goal: data.get('goal') as Goal,
    equipment: data.getAll('equipment') as Equipment[],
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** Ganze Minuten als „2–3 min“, sonst Sekunden als „60–90 s“. */
function formatRest({ min, max }: Range): string {
  if (min % 60 === 0 && max % 60 === 0) return `${min / 60}–${max / 60} min`
  return `${min}–${max} s`
}

/** „3 × 8–12 Wdh.“ bzw. „3 × 20–30 s“ – Zahlen groß, Einheit klein. */
function renderDose(planned: PlannedExercise): HTMLElement {
  const dose = el('p', 'ex-dose')
  const unit = planned.exercise.unit === 'sek' ? 's' : 'Wdh.'
  dose.append(
    el('b', 'ex-sets', String(planned.sets)),
    el('span', 'ex-times', ' × '),
    el('b', 'ex-reps', `${planned.reps.min}–${planned.reps.max}`),
    el('span', 'ex-unit', ` ${unit}`),
  )
  return dose
}

function renderExercise(planned: PlannedExercise, index: number): HTMLElement {
  const item = el('li', 'exercise')

  const name = el('h4', 'ex-name')
  name.append(
    el('span', 'ex-index', String(index + 1).padStart(2, '0')),
    planned.exercise.name,
  )

  const rest = el('p', 'ex-rest')
  rest.append(el('span', 'ex-tag', 'Pause'), ` ${formatRest(planned.rest)}`)

  const easier = el('p', 'ex-easier')
  easier.append(el('span', 'ex-tag', 'Leichter'), ` ${planned.exercise.easier}`)

  item.append(name, renderDose(planned), rest, easier)
  return item
}

function renderDay(day: PlanDay, index: number): HTMLElement {
  const article = el('article', 'plan-day')
  // Gestaffeltes Einblenden der Tage (siehe style.css).
  article.style.setProperty('--i', String(index))

  const head = el('header', 'day-head')
  const number = el('span', 'day-number', String(day.day))
  number.setAttribute('aria-hidden', 'true')
  const title = el('h3', 'day-title')
  title.append(
    el(
      'span',
      'day-kicker',
      `Tag ${day.day} · ${day.exercises.length} Übungen`,
    ),
    FOCUS_TITLES[day.focus],
  )
  head.append(number, title)

  const list = el('ol', 'exercises')
  list.append(...day.exercises.map(renderExercise))

  article.append(head, list)
  return article
}

function renderPlan(input: PlanInput, plan: Plan): void {
  const gear: Equipment[] = ['boden', ...input.equipment]
  summary.replaceChildren(
    ...[
      LEVEL_LABELS[input.level],
      `${input.days} Tage`,
      GOAL_LABELS[input.goal],
      gear.map((e) => EQUIPMENT_LABELS[e]).join(' · '),
    ].map((text) => el('li', undefined, text)),
  )

  daysContainer.replaceChildren(...plan.days.map(renderDay))
  emptyState.hidden = true
  planSection.hidden = false
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const input = readInput()
  renderPlan(input, generatePlan(input))

  // Auf dem Handy liegt der Plan unter dem Formular – direkt hinscrollen.
  if (window.matchMedia('(max-width: 59.99rem)').matches) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    planSection.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }
})

printButton.addEventListener('click', () => window.print())
