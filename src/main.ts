import './style.css'
import { generatePlan } from './plan.ts'
import type {
  Equipment,
  Goal,
  Level,
  Plan,
  PlanInput,
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

const form = document.querySelector<HTMLFormElement>('#plan-form')!
const planSection = document.querySelector<HTMLElement>('#plan')!
const summary = document.querySelector<HTMLParagraphElement>('#plan-summary')!
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
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

/** Ganze Minuten als „2–3 min“, sonst Sekunden als „60–90 s“. */
function formatRest({ min, max }: { min: number; max: number }): string {
  if (min % 60 === 0 && max % 60 === 0) return `${min / 60}–${max / 60} min`
  return `${min}–${max} s`
}

function renderPlan(input: PlanInput, plan: Plan): void {
  summary.textContent = `${LEVEL_LABELS[input.level]} · ${input.days} Tage · Ziel: ${GOAL_LABELS[input.goal]}`

  daysContainer.replaceChildren(
    ...plan.days.map((day) => {
      const article = el('article')
      article.className = 'plan-day'
      article.append(el('h3', day.title))

      const table = el('table')
      const head = el('tr')
      head.append(
        el('th', 'Übung'),
        el('th', 'Sätze'),
        el('th', 'Wdh. / Zeit'),
        el('th', 'Pause'),
      )
      table.append(head)

      for (const { exercise, sets, reps, rest } of day.exercises) {
        const unit = exercise.unit === 'sek' ? ' s' : ''
        const row = el('tr')
        row.append(
          el('td', exercise.name),
          el('td', String(sets)),
          el('td', `${reps.min}–${reps.max}${unit}`),
          el('td', formatRest(rest)),
        )
        table.append(row)
      }

      article.append(table)
      return article
    }),
  )
  planSection.hidden = false
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const input = readInput()
  renderPlan(input, generatePlan(input))
})

printButton.addEventListener('click', () => window.print())
