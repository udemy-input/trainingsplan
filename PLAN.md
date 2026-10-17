# Plan: Trainingsplan-Generator (Calisthenics)

## Ziel
Statische Web-App, die aus Erfahrung, Trainingstagen, Geräten und Ziel deterministisch einen Calisthenics-Wochenplan (Tag, Übungen, Sätze, Wiederholungen) erzeugt – für mich und meine Trainingsgruppe.

## Entscheidungen
- Technik: Vite + TypeScript, statische Seite, Tests mit Vitest
- Plan-Logik: regelbasiert und deterministisch (gleiche Eingaben = gleicher Plan), als reine Funktion getrennt von der UI
- Erfahrung: Anfänger / Fortgeschritten / Profi (Level 1–3)
- Trainingstage: 2–5; Split je nach Tagen (Ganzkörper → Ober-/Unterkörper → Push/Pull/Beine)
- Ziele: Kraft, Muskelaufbau, Ausdauer – steuern Satz- und Wiederholungsbereiche
- Geräte: Boden (immer verfügbar), Klimmzugstange, Barren/Dip-Station, Ringe, Widerstandsbänder
- Schwierigkeit: jede Übung hat Level 1–3; nur Übungen ≤ Nutzerstufe werden gewählt
- Umfang: 4 / 5 / 6 Übungen pro Tag je nach Stufe
- Ausgabe: Plan anzeigen + druckfreundliches Layout
- Sprache: Deutsch, übliche englische Übungsnamen bleiben

## Nicht im Umfang
- Login, Benutzerkonten, Server
- Speichern (localStorage) oder Teilen per Link
- Ernährungspläne, Skill-Ziele/Progressionsketten
- Design-Feinschliff

## Schritte
1. Projekt mit Vite + TypeScript + Vitest aufsetzen
2. Datentypen definieren (Eingaben, Übung, Plan)
3. Übungsdatenbank anlegen (Name, Muskelgruppe/Kategorie, Geräte, Level)
4. Regeln umsetzen: Split nach Tagen, Satz/Wdh. nach Ziel, Übungsanzahl nach Stufe
5. Generator-Funktion `generatePlan(input)` bauen
6. Tests: Geräte-Filter, kein Level über Nutzerstufe, Determinismus, richtige Tages- und Übungsanzahl, Plan auch nur mit Boden vollständig
7. Formular + Planansicht + Druck-CSS
8. Manuell prüfen: Plan in unter einer Minute ohne Anleitung erstellbar

## Offene Punkte
- keine
