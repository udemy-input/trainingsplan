# Trainingsplan-Generator

Statische Web-App, die aus Erfahrung, Trainingstagen, Geräten und Ziel deterministisch einen Calisthenics-Wochenplan erzeugt – für eine kleine Trainingsgruppe, die zu Hause oder im Park trainiert. Auftrag und Entscheidungen: `AUFTRAG.md`, `PLAN.md`.

## Befehle

- `npm run dev` – Dev-Server
- `npm test` – Vitest einmalig (`npm run test:watch` im Watch-Modus)
- `npm run typecheck` – nur `tsc`
- `npm run build` – Typecheck + Produktions-Build
- `npm run format` / `npm run format:check` – Prettier (Markdown ist per `.prettierignore` ausgenommen)

## Fallen

**Determinismus ist eine Anforderung, kein Nice-to-have.** Gleiche Eingaben müssen exakt denselben Plan liefern. Alles, was Zufall oder Reihenfolge-Abhängigkeit einschleust (`Math.random`, `Date`, ungeordnete Gleichstände beim Sortieren), bricht das still – die App sieht trotzdem gut aus. Bei Auswahl aus mehreren gleichwertigen Übungen braucht es einen festen Tie-Breaker.

**Plan-Logik bleibt eine reine Funktion.** `generatePlan(input)` kennt kein DOM und keinen globalen Zustand. Vitest läuft ohne Browser-Umgebung; sobald die Logik DOM anfasst, wird sie untestbar. UI-Code liest das Formular, ruft die Funktion auf, rendert das Ergebnis – mehr nicht.

**Kleine Gerätekombinationen sind der eigentliche Härtetest.** „Nur Boden“ plus Level 1 plus 5 Tage muss trotzdem einen vollständigen, sinnvollen Plan ergeben. Wenn die Datenbank für eine Kombination zu wenig hergibt, ist die Lösung mehr passende Übungen – nicht stillschweigend weniger Übungen, Duplikate am selben Tag oder ein zu schweres Level. Boden ist immer verfügbar, auch wenn die Eingabe ihn nicht explizit enthält.

**Sicherheit vor Vielfalt.** „Kein Level über Nutzerstufe“ ist ein Erfolgskriterium aus dem Auftrag. Wenn Vollständigkeit und Level-Grenze kollidieren, gewinnt die Level-Grenze – und die Lücke gehört in die Übungsdatenbank, nicht in den Generator.

**Grüne Tests heißen nicht typsicher.** Vitest transpiliert nur, es prüft keine Typen. Vor „fertig“ auch `npm run typecheck` laufen lassen.

**Die `tsconfig` ist streng.** `erasableSyntaxOnly` verbietet `enum`, `namespace` und Parameter-Properties – Union-Typen (`'kraft' | 'muskelaufbau' | 'ausdauer'`) und `as const`-Objekte nehmen. `verbatimModuleSyntax` verlangt `import type` für reine Typ-Importe.

**Umfang ist bewusst klein.** Kein Speichern, kein Teilen per Link, keine Progressionsketten, kein Design-Feinschliff (siehe `PLAN.md`). Wenn etwas davon naheliegend wirkt: erwähnen, nicht einbauen.

**Sprache.** UI-Texte auf Deutsch, gängige englische Übungsnamen (Pull-up, Dip, Pike Push-up) bleiben englisch. Code-Bezeichner englisch.

**Umgebung.** Windows mit Git Bash – Pfade mit `/`, keine cmd-Syntax.
