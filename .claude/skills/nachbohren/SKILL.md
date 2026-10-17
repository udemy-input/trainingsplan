---
name: nachbohren
description: Stellt zu einer Idee oder einem Projektauftrag gezielte Rückfragen, bis alle wichtigen Entscheidungen geklärt sind, und schreibt danach einen kurzen Plan in PLAN.md. Verwenden, wenn der Nutzer /nachbohren mit einer Idee oder einem Auftrag aufruft.
argument-hint: <Idee oder Projektauftrag>
---

# Nachbohren

Auftrag: $ARGUMENTS

## Ablauf

1. **Verstehen:** Lies den Auftrag. Falls er auf Dateien verweist (z. B. AUFTRAG.md), lies sie. Schau dir kurz das Projekt an, damit du nichts fragst, was sich selbst klären lässt.
2. **Nachbohren:** Stell Fragen mit dem Tool `AskUserQuestion`.
   - Pro Runde höchstens 3 Fragen, immer mit 2–4 konkreten Antwortvorschlägen.
   - Setz deine Empfehlung an die erste Stelle und markier sie mit „(Empfohlen)“.
   - Frag zuerst das Wichtigste: Ziel und Zielgruppe, Umfang (was gehört dazu, was nicht), Technik, Daten, Erfolgskriterien.
   - Bau auf den bisherigen Antworten auf. Frag nichts doppelt und nichts, was sich aus dem Code oder einem sinnvollen Standard ergibt.
   - Mach so lange weiter, bis keine offene Entscheidung mehr den Plan wesentlich verändern würde.
3. **Bestätigen:** Fass die Entscheidungen in wenigen Stichpunkten zusammen und frag, ob etwas fehlt.
4. **Plan schreiben:** Schreib erst danach `PLAN.md` ins Projektverzeichnis (eine bestehende Datei vorher lesen und nachfragen, ob sie überschrieben werden soll).

## Aufbau von PLAN.md

Kurz halten, höchstens eine Seite:

```markdown
# Plan: <Titel>

## Ziel
<1–2 Sätze>

## Entscheidungen
- <Thema>: <Entscheidung>

## Nicht im Umfang
- ...

## Schritte
1. ...

## Offene Punkte
- ... (oder „keine“)
```

Fang erst mit der Umsetzung an, wenn der Nutzer das ausdrücklich will.
