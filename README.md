# ⚽ Liga-Simulator

Ein Fußball-Manager für die Familie – gespielt mit euren echten Panini-Karten der WM 2026.
Ihr zieht Karten vom Stapel, tippt sie ins Spiel ein, stellt eure Mannschaft auf und
der Computer spielt eine ganze Liga-Saison mit Live-Ticker, Tabelle, Torschützenliste und Finale.

## Spielen

**Auf dem Computer:** Doppelklick auf `index.html` – fertig. Kein Installieren nötig.

**Auf dem Handy / Tablet:** über den Link, den Claude veröffentlicht hat (siehe unten „Online stellen“).

Der Spielstand wird im Browser gespeichert. Ihr könnt jederzeit aufhören und später auf
„Spiel fortsetzen“ tippen (auf demselben Gerät, im selben Browser).

## So läuft eine Runde

1. **Spieltag-Vorschau** – wo wird gespielt, wie ist das Wetter, wer hat Feiertag?
2. **Gerät weitergeben** – jeder stellt geheim auf, die anderen schauen weg.
3. **Karte ziehen** (ab Spieltag 2) – vom echten Stapel ziehen und den Namen eintippen.
   Ab 8 Karten darf man einmal pro Runde einen Spieler tauschen.
4. **Aufstellen** – Karten antippen, Kapitän wählen, „Fertig“ → „So spielen“ oder „Ändern“.
   Der Knopf 💡 gibt Tipps, 🪄 macht einen Vorschlag.
5. **Live-Ticker** – die Spiele laufen ab, mit Toren, Vorlagen und Bildern.
6. **Auswertung** – Ergebnisse, Tabelle mit Auf- und Abstieg, Scorerliste.

Nach dem letzten Spieltag spielen Platz 1 und Platz 2 das **Finale**, danach gibt es die **Pokalübergabe**.

## Was beeinflusst ein Spiel?

| Was | Wirkung |
|---|---|
| Positionen | Ohne Stürmer keine Tore, ohne Abwehr viele Gegentore. Ohne Torwart muss der beste Verteidiger ins Tor (schwach!). |
| Stärke | Jeder Spieler hat eine Stärke (als ★ angezeigt). |
| Teamgeist | Spieler aus dem gleichen Land oder Verein (laut Sticker) spielen besser zusammen. |
| Kapitän | +10 % |
| Heimvorteil | Das Heimteam +5 %. Spieler im eigenen Land oder im Land ihres Vereins +10 %. |
| Wetter | Ist es viel kälter oder wärmer als zu Hause, spielt man schlechter (z. B. Wesley im Winter in Stockholm). |
| Feiertage | Am Feiertag des eigenen Landes −50 %, am Tag danach −20 %. |
| Müdigkeit | Ampel auf der Karte: 🟢 frisch, 🟡 bald müde, 🔴 müde. Ab dem 4. Spiel in Folge −10 % pro Spiel und mehr Verletzungsgefahr. |
| Verletzungen | Alle 4 Spieltage verletzt sich zufällig jemand. Verletzte fehlen ein Spiel. |

Alle Zahlen könnt ihr im Spiel unter ⚙️ **Einstellungen** ändern.

## Was steckt in welcher Datei?

```
index.html            Die Seite selbst. Lädt alle anderen Dateien.
style.css             Das Aussehen: Farben, Schriften, Karten-Design.
daten/
  spielset.js         EURE Karten (121 Spieler). Hier tragt ihr neue Karten ein!
  computer-pool.js    Alle anderen WM-Sticker (743) – nur für die Computer-Gegner.
  laender.js          Die 48 WM-Länder: Stadt, Temperaturen, Feiertage.
js/
  einstellungen.js    Alle Spielregeln mit Standardwerten (X, y, h, i, j, k …).
  texte.js            Die Sätze für Live-Ticker und Auswertung.
  spiellogik.js       Das Rechnen: Stärke, Wetter, Tore, Tabelle. Zeigt nichts an.
  app.js              Die Bildschirme und was beim Klicken passiert.
bilder/               Logo, Pokal und die Bilder für Tore und Vorlagen (SVG).
SPIELIDEE.md          Die ursprüngliche Spielidee und alle Entscheidungen.
```

Die Reihenfolge in `index.html` ist wichtig: erst die Daten, dann die Logik, dann die Anzeige.

## Neue Karten eintragen

Ihr habt eine neue Karte bekommen? So kommt sie ins Spielset:

1. `daten/computer-pool.js` öffnen und die Sticker-Nummer suchen (z. B. `"GER 11"`).
2. Die Zeile **ausschneiden** und in `daten/spielset.js` **einfügen**.
3. In der Zeile `verein: "…"` ergänzen – so wie es auf dem Sticker steht, z. B.
   `verein: "Liverpool FC (ENG)"`. Das Kürzel in Klammern ist wichtig für den Heimat-Bonus.

Beispiel einer Zeile:

```js
{ id: "BRA 8", name: "Wesley", land: "BRA", verein: "AS Roma (ITA)", pos: "AB", staerke: 78, geb: "06.09.2003", staerken: "Blitzschneller Außenverteidiger", schwaechen: "Fehler in der Abwehr" },
```

Doppelte Karten müsst ihr nicht extra eintragen. Zieht jemand eine Karte, die schon ein anderer hat,
sagt das Spiel: „Den hat schon …! Lege die Karte zurück und ziehe eine neue.“

## Quellen

- Sticker-Nummern und Namen aller 980 Sticker: [scanini.app](https://scanini.app/albums/world-cup-2026)
- Verein und Geburtsdatum eurer Karten: abgelesen von euren Fotos.
- Positionen: Panini-Reihenfolge (Torwart → Abwehr → Mittelfeld → Sturm).
- Stärken (50–99): geschätzt, angelehnt an FC-26-Werte. Ändert sie gerne!

## Ideen für später

- Mannschaftssticker (Wappen) als Bonus-Karten
- Bonus-Ziehen aus Stickern, die ihr nicht habt (Chance auf Messi oder Mbappé)
- Echte Fotos der Karten statt Initialen
- KI-gemalte Torbilder statt der Strichmännchen
