import type { Category, Equipment, Exercise, Level, Unit } from './types.ts'

function ex(
  id: string,
  name: string,
  category: Category,
  level: Level,
  equipment: readonly Equipment[] = ['boden'],
  unit: Unit = 'wdh',
): Exercise {
  return { id, name, category, equipment, level, unit }
}

// Jede Kategorie braucht genug Level-1-Übungen nur mit Boden, damit auch
// „nur Boden“ + Level 1 jeden Tagestyp vollständig füllt.
export const EXERCISES: readonly Exercise[] = [
  // Push – Boden
  ex('wall-push-up', 'Wall Push-up', 'push', 1),
  ex('knee-push-up', 'Knie-Liegestütz', 'push', 1),
  ex('wide-knee-push-up', 'Knie-Liegestütz breit', 'push', 1),
  ex('knee-diamond-push-up', 'Knie-Diamond-Push-up', 'push', 1),
  ex('push-up', 'Push-up', 'push', 2),
  ex('pike-push-up', 'Pike Push-up', 'push', 2),
  ex('diamond-push-up', 'Diamond Push-up', 'push', 2),
  ex('decline-push-up', 'Decline Push-up', 'push', 2),
  ex('archer-push-up', 'Archer Push-up', 'push', 3),
  ex('pseudo-planche-push-up', 'Pseudo Planche Push-up', 'push', 3),
  ex('elevated-pike-push-up', 'Elevated Pike Push-up', 'push', 3),
  ex('wall-handstand-push-up', 'Handstand Push-up an der Wand', 'push', 3),
  // Push – Geräte
  ex('bar-support-hold', 'Stütz am Barren', 'push', 1, ['barren'], 'sek'),
  ex('negative-dip', 'Negative Dip', 'push', 1, ['barren']),
  ex('dip', 'Dip', 'push', 2, ['barren']),
  ex('band-assisted-dip', 'Dip mit Band', 'push', 1, ['barren', 'baender']),
  ex('ring-support-hold', 'Stütz an den Ringen', 'push', 2, ['ringe'], 'sek'),
  ex('ring-push-up', 'Ring Push-up', 'push', 2, ['ringe']),
  ex('ring-dip', 'Ring Dip', 'push', 3, ['ringe']),
  ex('straight-bar-dip', 'Straight Bar Dip', 'push', 3, ['klimmzugstange']),
  ex('band-chest-press', 'Brustpresse mit Band', 'push', 1, ['baender']),
  ex('band-overhead-press', 'Schulterdrücken mit Band', 'push', 1, ['baender']),
  ex('band-triceps-extension', 'Trizepsstrecken mit Band', 'push', 1, [
    'baender',
  ]),

  // Pull – Boden
  ex('superman', 'Superman', 'pull', 1),
  ex('prone-y-raise', 'Y-Raise in Bauchlage', 'pull', 1),
  ex('prone-w-raise', 'W-Raise in Bauchlage', 'pull', 1),
  ex('reverse-snow-angel', 'Reverse Snow Angel', 'pull', 1),
  ex('superman-hold', 'Superman Hold', 'pull', 2, ['boden'], 'sek'),
  ex('towel-floor-pull', 'Handtuch-Zug am Boden', 'pull', 2),
  // Pull – Geräte
  ex('dead-hang', 'Dead Hang', 'pull', 1, ['klimmzugstange'], 'sek'),
  ex('scapula-pull-up', 'Scapula Pull-up', 'pull', 1, ['klimmzugstange']),
  ex('negative-pull-up', 'Negative Pull-up', 'pull', 1, ['klimmzugstange']),
  ex('pull-up', 'Pull-up', 'pull', 2, ['klimmzugstange']),
  ex('chin-up', 'Chin-up', 'pull', 2, ['klimmzugstange']),
  ex('archer-pull-up', 'Archer Pull-up', 'pull', 3, ['klimmzugstange']),
  ex('l-sit-pull-up', 'L-Sit Pull-up', 'pull', 3, ['klimmzugstange']),
  ex('band-assisted-pull-up', 'Pull-up mit Band', 'pull', 1, [
    'klimmzugstange',
    'baender',
  ]),
  ex('australian-pull-up', 'Australian Pull-up am Barren', 'pull', 1, [
    'barren',
  ]),
  ex('ring-row', 'Ring Row', 'pull', 1, ['ringe']),
  ex('ring-face-pull', 'Ring Face Pull', 'pull', 2, ['ringe']),
  ex('ring-pull-up', 'Ring Pull-up', 'pull', 2, ['ringe']),
  ex('ring-muscle-up', 'Ring Muscle-up', 'pull', 3, ['ringe']),
  ex('band-row', 'Rudern mit Band', 'pull', 1, ['baender']),
  ex('band-pull-apart', 'Band Pull-apart', 'pull', 1, ['baender']),
  ex('band-face-pull', 'Band Face Pull', 'pull', 1, ['baender']),

  // Beine – Boden
  ex('squat', 'Kniebeuge', 'beine', 1),
  ex('glute-bridge', 'Glute Bridge', 'beine', 1),
  ex('reverse-lunge', 'Ausfallschritt rückwärts', 'beine', 1),
  ex('wall-sit', 'Wall Sit', 'beine', 1, ['boden'], 'sek'),
  ex('calf-raise', 'Wadenheben', 'beine', 1),
  ex('split-squat', 'Split Squat', 'beine', 2),
  ex('jump-squat', 'Jump Squat', 'beine', 2),
  ex('single-leg-glute-bridge', 'Glute Bridge einbeinig', 'beine', 2),
  ex('cossack-squat', 'Cossack Squat', 'beine', 2),
  ex('pistol-squat', 'Pistol Squat', 'beine', 3),
  ex('shrimp-squat', 'Shrimp Squat', 'beine', 3),
  ex('jump-lunge', 'Jump Lunge', 'beine', 3),
  // Beine – Geräte
  ex('band-squat', 'Kniebeuge mit Band', 'beine', 1, ['baender']),
  ex('band-lateral-walk', 'Seitwärtsgehen mit Band', 'beine', 1, ['baender']),
  ex('band-good-morning', 'Good Morning mit Band', 'beine', 1, ['baender']),
  ex('ring-assisted-pistol', 'Pistol Squat mit Ringen', 'beine', 2, ['ringe']),
  ex('ring-hamstring-curl', 'Beinbeuger an den Ringen', 'beine', 2, ['ringe']),

  // Core – Boden
  ex('plank', 'Plank', 'core', 1, ['boden'], 'sek'),
  ex('side-plank', 'Seitstütz', 'core', 1, ['boden'], 'sek'),
  ex('dead-bug', 'Dead Bug', 'core', 1),
  ex('bird-dog', 'Bird Dog', 'core', 1),
  ex('hollow-body-hold', 'Hollow Body Hold', 'core', 2, ['boden'], 'sek'),
  ex('lying-leg-raise', 'Beinheben liegend', 'core', 2),
  ex('mountain-climber', 'Mountain Climber', 'core', 2),
  ex('v-up', 'V-up', 'core', 2),
  ex('hollow-body-rock', 'Hollow Body Rock', 'core', 3),
  ex('l-sit', 'L-Sit', 'core', 3, ['boden'], 'sek'),
  // Core – Geräte
  ex('hanging-knee-raise', 'Knieheben hängend', 'core', 1, ['klimmzugstange']),
  ex('hanging-leg-raise', 'Beinheben hängend', 'core', 2, ['klimmzugstange']),
  ex('toes-to-bar', 'Toes to Bar', 'core', 3, ['klimmzugstange']),
  ex('bar-knee-raise', 'Knieheben am Barren', 'core', 1, ['barren']),
  ex('bar-l-sit', 'L-Sit am Barren', 'core', 2, ['barren'], 'sek'),
  ex('ring-plank', 'Plank an den Ringen', 'core', 2, ['ringe'], 'sek'),
  ex('ring-knee-tuck', 'Ring Knee Tuck', 'core', 2, ['ringe']),
  ex('ring-rollout', 'Ring Rollout', 'core', 3, ['ringe']),
  ex('pallof-press', 'Pallof Press', 'core', 1, ['baender']),
  ex('band-woodchopper', 'Woodchopper mit Band', 'core', 1, ['baender']),
]
