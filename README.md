# Trainingsplan-Generator

Kleine Web-App, die aus wenigen Angaben einen Calisthenics-Wochenplan erstellt: Erfahrung, Trainingstage pro Woche, vorhandene Geräte und Ziel. Heraus kommt ein Plan mit Tagen, Übungen, Sätzen, Wiederholungen, Pausen und leichteren Varianten – auch als Druckansicht. Kein Login, kein Server, alles läuft im Browser.

Das Projekt entsteht im Kurs **„Claude Code in der Praxis“** im Extra „Projekt von null“ – von einem leeren Ordner bis Version 1.0, danach mit dem Design-Feinschliff zu Version 1.1. Projektauftrag und Plan stehen in `AUFTRAG.md` und `PLAN.md`, die Regeln für Claude in `CLAUDE.md`.

## Starten

Voraussetzung: Node.js 22.12 oder neuer (im Kurs: Node 24).

```bash
git clone https://github.com/udemy-input/trainingsplan.git
cd trainingsplan
npm install
npm run dev
```

Dann die angezeigte Adresse im Browser öffnen (meist http://localhost:5173). Tests: `npm test`, Typprüfung: `npm run typecheck`.

## Kursstände

Jede Lektion, die am Code etwas ändert, hat einen Git-Tag. „Leerer Ordner, klare Idee“ beginnt mit einem leeren Ordner, „Browser-Check & Fehlerjagd“ prüft nur, und „Ehrliche Bilanz“ blickt auf Version 1.0 zurück – dafür gibt es keinen eigenen Tag.

```bash
git tag                    # alle Stände anzeigen
git checkout B4.5-ende     # Stand nach „Der erste Durchstich“ laden
npm install                # nach jedem Wechsel
git switch -c mein-weg     # ab hier eigene Änderungen auf eigenem Zweig
git checkout master        # zurück zum neuesten Stand (v1.1)
```

Eigene Änderungen vor dem Wechsel committen oder mit `git stash` beiseitelegen.

| Tag | Stand nach | Startpunkt für |
|---|---|---|
| – | leerer Ordner | Extra „Projekt von null“, Lektion „Leerer Ordner, klare Idee“ |
| `B4.2-ende` | Extra „Projekt von null“, Lektion „Leerer Ordner, klare Idee“ und „Planung, die nachbohrt“: AUFTRAG.md, Skill nachbohren, PLAN.md | „Das Fundament nach den neuen Regeln“ |
| `B4.3-ende` | Extra „Projekt von null“, Lektion „Das Fundament nach den neuen Regeln“: Vite + TypeScript + Vitest, CLAUDE.md, Einstellungen | „Toolkit mit einem Befehl“ |
| `B4.4-ende` | Extra „Projekt von null“, Lektion „Toolkit mit einem Befehl“: RepLog-Toolkit angepasst | „Der erste Durchstich: Tests zuerst“ |
| `B4.5-ende` | Extra „Projekt von null“, Lektion „Der erste Durchstich: Tests zuerst“: Tests, Übungsdatenbank, Plan-Logik, Formular | „Zwei Features parallel“ |
| `B4.6-ende` | Extra „Projekt von null“, Lektion „Zwei Features parallel“: Pause und leichtere Variante je Übung | „Browser-Check & Fehlerjagd“ und „Beheben, Review, Release“ (der Browser-Check ändert keinen Code) |
| `v1.0` | Extra „Projekt von null“, Lektion „Beheben, Review, Release“ – Version 1.0 | „Ehrliche Bilanz“ und Extra „Community-Werkzeuge & Feinschliff“, Lektion „Die App wird schön: Design mit dem frontend-design-Plugin“ |
| `v1.1` | Extra „Community-Werkzeuge & Feinschliff“, Lektion „Die App wird schön: Design mit dem frontend-design-Plugin“ – Design „Parcours-Schild“ | „Ein Promo-Video für die App mit HyperFrames“ und die Werkstatt-Lektion „Texte und Dokumentation schreiben lassen“ |

**Praxis-Werkstatt:** Die Lektion „Texte und Dokumentation schreiben lassen“ arbeitet mit einer frischen Kopie von Stand `v1.1`.

**Plugin:** Ab `B4.4-ende` ist in `.claude/settings.json` das Plugin `replog-toolkit@kurs` eingeschaltet. Es stammt aus dem Kursprojekt RepLog (https://github.com/udemy-input/replog, Ordner `kurs-marketplace`, Sektion 7, Lektion 7.2). Ohne das Plugin läuft die App genauso, nur die Kurs-Helfer fehlen.
