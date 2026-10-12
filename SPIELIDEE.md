# Liga-Simulator – Spielidee & Entscheidungen (Übergabe-Dokument)

Dieses Dokument fasst alles zusammen, was bisher besprochen und entschieden wurde.
Eine neue Claude-Sitzung soll es lesen und auf dieser Basis das Spiel bauen.

## Rahmen

- **Name:** Liga-Simulator. **Logo:** schematischer Fußballspieler beim Fallrückzieher (SVG).
- **Spieler:** meist 2 Kinder (9 und 13 Jahre), manchmal + 1 Erwachsener, max. 2 Kinder + 3 Erwachsene.
- **Gerät:** ein gemeinsames Gerät zum Weiterreichen (Hot-Seat). Aufstellungen sind **versteckt**, bis die Mannschaften gegeneinander spielen, danach werden sie gezeigt.
- **Technik:** Web-App aus **einfachem HTML + CSS + JavaScript, ohne Frameworks, ohne Build-Tools**.
  Der Besitzer lernt gerade programmieren: Code möglichst einfach halten, viele deutsche Kommentare,
  jeden Schritt erklären. Normale `<script>`-Tags (keine ES-Module), damit `index.html` auch per Doppelklick läuft.
  Spielstand im `localStorage` (mit try/catch).
- **Aufruf übers Internet / Handy:** gewünscht (z. B. GitHub Pages oder Claude-Artifact-Link).
- **Repo:** `dadmindset/fiebelfu-`, Branch `claude/football-manager-game-65qxhk`.
- **Sprache:** Deutsch.

## Variablen (alle auf einer Konfigurationsseite einstellbar!)

| Variable | Bedeutung | Standard |
|---|---|---|
| X | Startkarten pro Teilnehmer | 6 |
| y | max. Handkarten (11 + Ersatz) | 14 |
| a/b | Runden 1–3: Teamgröße | 5 |
| d/e | ab Runde 4: Teamgröße | 7 |
| f/g | ab Runde 8: Teamgröße | 11 |
| h | Tauschen erlaubt ab so vielen Handkarten (max. 1 Tausch/Runde, Karte geht zurück in den Stapel) | 8 |
| c | Anzahl Computer-Teams = Anzahl Teilnehmer | – |
| i | Ermüdung ab dem i-ten Spiel in Folge (−10 % pro weiterem Spiel, Verletzungsrisiko steigt) | 4 |
| k | Tipp warnt nach k Spielen in Folge | 3 |
| j | Zufallsverletzung alle j Runden (fällt 1 Spiel aus) | 4 |
| – | Saisonlänge (Spieltage) | 14 (wählbar 8/14/34) |
| – | Tage zwischen Spieltagen | 7 |
| – | Startdatum der Saison | heute (Spiel soll auch außerhalb der Bundesliga-Saison funktionieren) |
| – | Feiertag am Spieltag / Tag danach | −50 % / −20 % (abgemildert statt Totalausfall) |
| – | Kapitän-Bonus | +10 % |
| – | Computer-Level | 1–3 (einstellbar) |
| l | Bonus-Ziehen aus Stickern, die man physisch nicht hat (Chance auf Messi/Mbappé) | **später**, nicht im MVP |

## Spielablauf (Entscheidungen)

1. **Start:** Namen eingeben, Computer-Level wählen. Jeder Teilnehmer tippt seine 6 physisch ausgeteilten Startkarten ein
   (Autovervollständigung mit Flagge, Name, Verein, Position, Sterne – keine Tippfehler möglich).
2. **Heimat:** Jeder wählt Land/Stadt als Heimat – **nur aus Ländern, von denen er mind. einen Spieler auf der Starthand hat**.
   Computer-Teams wählen ebenso aus ihrer Starthand.
3. **Pro Spieltag:**
   - **Spieltag-Vorschau** vor dem Aufstellen: Datum, Paarungen, Stadion/Land, Wetter, Feiertage.
   - Übergabe-Bildschirm („Gib das Gerät an …, die anderen schauen weg“).
   - Ab Runde 2: neue Karte ziehen (bis max. y) und Namen eintippen. Ab h Karten optional 1 Tausch.
   - **Aufstellung:** Karten antippen zum Auswählen, Kapitän wählen, Buttons **„So spielen“** und **„Ändern“**.
     Button **„Tipp“** (müde Spieler, Teamgeist-Paare, Wetter, Feiertage, kein Torwart …). Rest der Hand = Ersatzbank.
   - Computer zieht und stellt automatisch auf.
   - **Live-Ticker** (~20 Sek., überspringbar) mit „TOOOR!“-Momenten, Torschützen und Vorlagengebern.
   - **Bilder** bei Toren und Vorlagen: zunächst eine Handvoll gezeichneter SVG-Bilder (Schuss, Kopfball,
     Fallrückzieher, Elfmeter, Freistoß, Flanke/Vorlage, Jubel), später durch KI-Bilder austauschbar.
   - **Auswertung:** emotionale Spielauswertung je Teilnehmer, Tabelle mit Auf-/Abstieg (Pfeile),
     **Scorerliste** (Tore **und Vorlagen** bringen Punkte).
4. **Saisonende:** **Finale** Platz 1 gegen Platz 2 (bei Unentschieden Elfmeterschießen), dann **Pokalübergabe** auf dem Bildschirm.

## Regeln für die Spielstärke

- Jeder Spieler: Position (TW/AB/MF/ST), Stärke 50–90 (an FC-26-Ratings angelehnt), für Kinder als 1–5 Sterne.
- **Kein Torwart aufgestellt** → der abwehrstärkste Spieler geht ins Tor (deutlich schwächer).
- **Teamgeist:** gleiche Nationalmannschaft oder gleicher Verein (Verein laut **Sticker**!) → Bonus, sichtbar auf der Karte
  (z. B. „🔗 Liverpool-Quartett“).
- **Müdigkeit als Ampel** auf jeder Karte (grün/gelb/rot), Verletzte mit 🤕 markiert und nicht auswählbar.
- **Heimvorteil** für das Heimteam. **Heimat-Bonus**, wenn ein Spieler im Land seiner Nation oder seines Vereins spielt.
- **Wetter:** Durchschnittstemperatur je Land und Monat; großer Unterschied zur Heimat des Spielers → Abzug
  (z. B. Wesley aus Brasilien im Dezember in Schweden).
- **Feiertage** des Heimatlandes jedes Spielers (inkl. Karneval in Rio, Weihnachten, Ramadan-Ende, Thanksgiving …).
- **Doppelte Spieler:** Niemals zwei gleiche Spieler gegeneinander. Wenn ein Kind eine Karte eintippt, die schon jemand hat
  (physische Doppelte!), Meldung: „Den hat schon …! Lege die Karte zurück und ziehe neu.“
- **Computer-Gegner:** ziehen genauso zufällig, aber **nur aus WM-2026-Stickern, die NICHT im Spielset sind**.
  Schwierigkeit steigt mit dem Spielfortschritt: anfangs würfelt der Computer die Aufstellung zufällig,
  später stellt er taktisch auf (ab welcher Runde, hängt vom Level ab). Level 3 zieht „bester aus 2“.
- **Mannschaftssticker (Wappen):** kommen später (Fotos folgen). Idee: gezogenes Wappen stärkt alle Spieler dieses Landes im Team.
- Spieler-Bilder: Es gibt keine freie Quelle für Panini-Bilder. Erst Flagge + Initialen; optional später eigene Fotos der Karten
  (Feld `bild` in den Spielerdaten).

## Computer-Pool (offener Punkt)

**Erledigt:** Die Liste aller 864 Spieler-Sticker wurde von https://scanini.app/albums/world-cup-2026 geladen.
Alle 121 Karten des Spielsets sind darin gefunden; die übrigen 743 bilden den Computer-Pool (`daten/computer-pool.js`).
Positionen nach Panini-Reihenfolge korrigiert: Ibrahim Sabra und Elijah Just = Sturm, Saleh Abu Alshamat = Mittelfeld.
Album: 48 Teams × 20 Sticker (Wappen, Teamfoto, 18 Spieler) + 20 Sonder-Sticker = 980.

48 Teams: USA, MEX, CAN · JPN, IRN, UZB, KOR, JOR, AUS, QAT, KSA, IRQ · MAR, TUN, EGY, ALG, GHA, CPV, RSA, SEN, CIV, COD ·
ARG, BRA, ECU, URU, COL, PAR · NZL · PAN, HAI, CUW · ENG, FRA, CRO, POR, NOR, GER, NED, ESP, BEL, AUT, SUI, SCO, SWE, TUR, CZE, BIH.

## Das Spielset (von den Fotos abgelesen)

**124 physische Karten = 121 verschiedene Spieler.** Doppelt vorhanden: Wesley, Leandro Bacuna, Hyeongyu Oh.
Verein und Geburtsdatum laut Sticker. Position und Stärke sind ein erster Vorschlag (bitte in der Recherche prüfen).
Farbe des Namensbalkens auf dem Sticker scheint die Position zu zeigen: lila = TW, rosa = AB, orange = MF, dunkelblau = ST.

| # | Spieler | Land | Verein (Sticker) | Geb. | Pos | Stärke |
|---|---|---|---|---|---|---|
| 1 | Hassan Al-Haydos | QAT | Al Sadd SC (QAT) | 11.12.1990 | ST | 70 |
| 2 | Leandro Bacuna (2×) | CUW | Iğdır FK (TUR) | 21.08.1991 | MF | 68 |
| 3 | Ryan Christie | SCO | AFC Bournemouth (ENG) | 22.02.1995 | MF | 76 |
| 4 | Diogo Costa | POR | FC Porto (POR) | 19.09.1999 | TW | 85 |
| 5 | Thomas Partey | GHA | Villarreal CF (ESP) | 13.06.1993 | MF | 80 |
| 6 | Alisson | BRA | Liverpool FC (ENG) | 02.10.1992 | TW | 88 |
| 7 | Wesley (2×) | BRA | AS Roma (ITA) | 06.09.2003 | AB | 78 |
| 8 | Christopher Attys | HAI | US Triestina Calcio 1918 (ITA) | 13.03.2001 | MF | 64 |
| 9 | Aaron Wan-Bissaka | COD | West Ham United FC (ENG) | 26.11.1997 | AB | 79 |
| 10 | Joshua Brenet | CUW | Livingston FC (SCO) | 20.03.1994 | AB | 66 |
| 11 | Khaled Sobhi | EGY | Al Masry SC (EGY) | 04.05.1995 | AB | 68 |
| 12 | Matěj Vydra | CZE | FC Viktoria Plzeň (CZE) | 01.05.1992 | ST | 72 |
| 13 | Scott McTominay | SCO | SSC Napoli (ITA) | 08.12.1996 | MF | 86 |
| 14 | Gustaf Lagerbielke | SWE | SC Braga (POR) | 10.04.2000 | AB | 73 |
| 15 | Nasser Aldawsari | KSA | Al Hilal Saudi Club (KSA) | 19.12.1998 | MF | 74 |
| 16 | Ehsan Hajsafi | IRN | Sepahan SC (IRN) | 25.02.1990 | AB | 70 |
| 17 | John Souttar | SCO | Rangers FC (SCO) | 25.09.1996 | AB | 74 |
| 18 | Aimar Sher | IRQ | Sarpsborg 08 FF (NOR) | 20.12.2002 | MF | 67 |
| 19 | Richard Ríos | COL | SL Benfica (POR) | 02.06.2000 | MF | 81 |
| 20 | Habib Diarra | SEN | Sunderland AFC (ENG) | 03.01.2004 | MF | 77 |
| 21 | Exequiel Palacios | ARG | Bayer 04 Leverkusen (GER) | 05.10.1998 | MF | 81 |
| 22 | Granit Xhaka | SUI | Sunderland AFC (ENG) | 27.09.1992 | MF | 84 |
| 23 | Érick Sánchez | MEX | Club América (MEX) | 27.09.1999 | MF | 73 |
| 24 | Mohammad Abu Hashish | JOR | Al-Karma SC (IRQ) | 09.05.1995 | AB | 66 |
| 25 | Arthur Theate | BEL | Eintracht Frankfurt (GER) | 25.05.2000 | AB | 79 |
| 26 | Antonee Robinson | USA | Fulham FC (ENG) | 08.08.1997 | AB | 81 |
| 27 | Amir Hadžiahmetović | BIH | Hull City (ENG) | 08.03.1997 | MF | 71 |
| 28 | Amar Dedić | BIH | SL Benfica (POR) | 18.08.2002 | AB | 77 |
| 29 | Nicolás Tagliafico | ARG | Olympique Lyonnais (FRA) | 31.08.1992 | AB | 79 |
| 30 | Alexis Mac Allister | ARG | Liverpool FC (ENG) | 24.12.1998 | MF | 87 |
| 31 | Juan Fernando Quintero | COL | Club Atlético River Plate (ARG) | 18.01.1993 | MF | 76 |
| 32 | Chancel Mbemba | COD | LOSC Lille (FRA) | 08.08.1994 | AB | 77 |
| 33 | Michel Aebischer | SUI | Pisa SC (ITA) | 06.01.1997 | MF | 74 |
| 34 | Hazem Mastouri | TUN | FC Dynamo Makhachkala (RUS) | 18.06.1997 | ST | 68 |
| 35 | Osama Rashid | IRQ | Zakho SC (IRQ) | 13.01.1992 | MF | 66 |
| 36 | Maximilian Mittelstädt | GER | VfB Stuttgart (GER) | 18.03.1997 | AB | 79 |
| 37 | Florian Grillitsch | AUT | SC Braga (POR) | 07.08.1995 | MF | 75 |
| 38 | Deroy Duarte | CPV | PFC Ludogorets Razgrad (BUL) | 04.07.1999 | MF | 70 |
| 39 | Achraf Hakimi | MAR | Paris Saint-Germain FC (FRA) | 04.11.1998 | AB | 89 |
| 40 | Esmir Bajraktarević | BIH | PSV Eindhoven (NED) | 10.03.2005 | MF | 74 |
| 41 | Axel Tuanzebe | COD | Burnley FC (ENG) | 14.11.1997 | AB | 72 |
| 42 | Grant Hanley | SCO | Hibernian FC (SCO) | 20.11.1991 | AB | 71 |
| 43 | Matt Freese | USA | New York City FC (USA) | 02.09.1998 | TW | 73 |
| 44 | Igor Sergeev | UZB | Persepolis FC (IRN) | 30.04.1993 | ST | 72 |
| 45 | Guillermo Varela | URU | Clube de Regatas do Flamengo (BRA) | 24.03.1993 | AB | 76 |
| 46 | Alexander Isak | SWE | Liverpool FC (ENG) | 21.09.1999 | ST | 88 |
| 47 | Riyad Mahrez | ALG | Al-Ahli Saudi FC (KSA) | 21.02.1991 | ST | 82 |
| 48 | Connor Metcalfe | AUS | FC St. Pauli (GER) | 05.11.1999 | MF | 71 |
| 49 | Antonio Nusa | NOR | RB Leipzig (GER) | 17.04.2005 | ST | 79 |
| 50 | Nahitan Nández | URU | Al Qadsiah FC (KSA) | 28.12.1995 | MF | 77 |
| 51 | Azzedine Ounahi | MAR | Girona FC (ESP) | 19.04.2000 | MF | 77 |
| 52 | Logan Costa | CPV | Villarreal CF (ESP) | 01.04.2001 | AB | 74 |
| 53 | Aubrey Modiba | RSA | Mamelodi Sundowns FC (RSA) | 22.07.1995 | AB | 72 |
| 54 | Zeno Debast | BEL | Sporting CP (POR) | 24.10.2003 | AB | 76 |
| 55 | Uğurcan Çakır | TUR | Galatasaray AŞ (TUR) | 05.04.1996 | TW | 81 |
| 56 | Ørjan Nyland | NOR | Sevilla FC (ESP) | 10.09.1990 | TW | 75 |
| 57 | Mohau Nkota | RSA | Al-Ettifaq Club (KSA) | 09.11.2004 | ST | 68 |
| 58 | Bechir Ben Saïd | TUN | Espérance Sportive de Tunis (TUN) | 29.11.1992 | TW | 70 |
| 59 | Thomas Meunier | BEL | LOSC Lille (FRA) | 12.09.1991 | AB | 76 |
| 60 | Mohamed Elshenawy | EGY | Al Ahly FC (EGY) | 18.12.1988 | TW | 74 |
| 61 | Romain Saïss | MAR | Al Sadd SC (QAT) | 26.03.1990 | AB | 74 |
| 62 | Michael Gregoritsch | AUT | FC Augsburg (GER) | 18.04.1994 | ST | 75 |
| 63 | Mohammed Amoura | ALG | VfL Wolfsburg (GER) | 09.05.2000 | ST | 78 |
| 64 | Ibrahima Konaté | FRA | Liverpool FC (ENG) | 25.05.1999 | AB | 85 |
| 65 | José Fajardo | PAN | CD Universidad Católica (ECU) | 18.08.1993 | ST | 68 |
| 66 | Nawaf Alaqidi | KSA | Al-Nassr FC (KSA) | 10.05.2000 | TW | 68 |
| 67 | Nihad Mujakić | BIH | Gaziantep FK (TUR) | 15.04.1998 | AB | 70 |
| 68 | Gideon Mensah | GHA | AJ Auxerre (FRA) | 18.07.1998 | AB | 71 |
| 69 | Sherel Floranus | CUW | PEC Zwolle (NED) | 23.08.1998 | AB | 66 |
| 70 | Zeki Amdouni | SUI | Burnley FC (ENG) | 04.12.2000 | ST | 75 |
| 71 | Rafael Leão | POR | AC Milan (ITA) | 10.06.1999 | ST | 86 |
| 72 | Keito Nakamura | JPN | Stade de Reims (FRA) | 28.07.2000 | ST | 75 |
| 73 | Andrés Cubas | PAR | Vancouver Whitecaps FC (CAN) | 11.05.1996 | MF | 73 |
| 74 | John Stones | ENG | Manchester City FC (ENG) | 28.05.1994 | AB | 84 |
| 75 | Billy Gilmour | SCO | SSC Napoli (ITA) | 11.06.2001 | MF | 77 |
| 76 | Munir El Kajoui | MAR | RS Berkane (MAR) | 10.05.1989 | TW | 72 |
| 77 | Pavel Šulc | CZE | Olympique Lyonnais (FRA) | 29.12.2000 | MF | 76 |
| 78 | César Montes | MEX | FC Lokomotiv Moskva (RUS) | 24.02.1997 | AB | 74 |
| 79 | Kristijan Jakić | CRO | FC Augsburg (GER) | 14.05.1997 | MF | 73 |
| 80 | Yahia Fofana | CIV | Çaykur Rizespor (TUR) | 21.08.2000 | TW | 73 |
| 81 | Mikel Oyarzabal | ESP | Real Sociedad de Fútbol (ESP) | 21.04.1997 | ST | 83 |
| 82 | Saleh Abu Alshamat | KSA | Al-Ahli Saudi FC (KSA) | 11.06.2002 | AB | 66 |
| 83 | Anthony Elanga | SWE | Newcastle United FC (ENG) | 27.04.2002 | ST | 79 |
| 84 | Chris Wood | NZL | Nottingham Forest FC (ENG) | 07.12.1991 | ST | 80 |
| 85 | Elijah Just | NZL | Motherwell FC (SCO) | 01.05.2000 | MF | 66 |
| 86 | Silvan Widmer | SUI | 1. FSV Mainz 05 (GER) | 05.03.1993 | AB | 75 |
| 87 | Luis Mejía | PAN | Club Nacional de Football (URU) | 16.03.1991 | TW | 70 |
| 88 | Ao Tanaka | JPN | Leeds United (ENG) | 10.09.1998 | MF | 76 |
| 89 | Vinícius Júnior | BRA | Real Madrid CF (ESP) | 12.07.2000 | ST | 90 |
| 90 | Leandro Paredes | ARG | Club Atlético Boca Juniors (ARG) | 29.06.1994 | MF | 79 |
| 91 | Ayoub El Kaabi | MAR | Olympiacos FC (GRE) | 25.06.1993 | ST | 79 |
| 92 | Inbeom Hwang | KOR | Feyenoord (NED) | 20.09.1996 | MF | 78 |
| 93 | Cecilio Waterman | PAN | Universidad de Concepción (CHI) | 13.04.1991 | ST | 66 |
| 94 | Alan Franco | ECU | Clube Atlético Mineiro (BRA) | 21.08.1998 | MF | 74 |
| 95 | Harry Kane | ENG | FC Bayern München (GER) | 28.07.1993 | ST | 91 |
| 96 | Mohammad Abu Zrayq | JOR | Raja CA (MAR) | 30.12.1997 | ST | 69 |
| 97 | Ibrahim Sabra | JOR | Göztepe SK (TUR) | 01.02.2006 (prüfen) | MF | 64 |
| 98 | Nayef Aguerd | MAR | Olympique de Marseille (FRA) | 30.03.1996 | AB | 80 |
| 99 | Utkir Yusupov | UZB | Navbahor Namangan (UZB) | 04.01.1991 | TW | 66 |
| 100 | Junnosuke Suzuki | JPN | FC Copenhagen (DEN) | 12.07.2003 | AB | 72 |
| 101 | Tarek Salman | QAT | Al Sadd SC (QAT) | 05.12.1997 | AB | 69 |
| 102 | Mike Maignan | FRA | AC Milan (ITA) | 03.07.1995 | TW | 87 |
| 103 | Yuki Soma | JPN | FC Machida Zelvia (JPN) | 25.02.1997 | MF | 72 |
| 104 | Hyeongyu Oh (2×) | KOR | KRC Genk (BEL) | 12.04.2001 | ST | 74 |
| 105 | Ibrahim Saadeh | JOR | Al-Karma SC (IRQ) | 27.04.2000 | MF | 64 |
| 106 | Petar Sučić | CRO | FC Internazionale Milano (ITA) | 25.10.2003 | MF | 77 |
| 107 | Abdulaziz Hatem | QAT | Al-Rayyan SC (QAT) | 28.10.1990 | MF | 68 |
| 108 | Emiliano Martínez | ARG | Aston Villa FC (ENG) | 02.09.1992 | TW | 87 |
| 109 | Kevin Pina | CPV | FC Krasnodar (RUS) | 27.01.1997 | MF | 72 |
| 110 | Théo Bongonda | COD | FC Spartak Moskva (RUS) | 20.11.1995 | ST | 74 |
| 111 | Ángel Romero | PAR | ? (auf dem Foto nicht lesbar – bitte auf der Karte nachsehen) | 04.07.1992 | ST | 72 |
| 112 | Sander Berge | NOR | Fulham FC (ENG) | 14.02.1998 | MF | 78 |
| 113 | Lucas Digne | FRA | Aston Villa FC (ENG) | 20.07.1993 | AB | 79 |
| 114 | Yerry Mina | COL | Cagliari Calcio (ITA) | 23.09.1994 | AB | 75 |
| 115 | Seungho Paik | KOR | Birmingham City FC (ENG) | 17.03.1997 | MF | 72 |
| 116 | Jonathan David | CAN | Juventus (ITA) | 14.01.2000 | ST | 83 |
| 117 | Husniddin Aliqulov | UZB | Çaykur Rizespor (TUR) | 04.04.1999 | AB | 68 |
| 118 | Kaan Ayhan | TUR | Galatasaray AŞ (TUR) | 10.11.1994 | AB | 75 |
| 119 | Ferdi Kadıoğlu | TUR | Brighton & Hove Albion FC (ENG) | 07.10.1999 | AB | 79 |
| 120 | Enzo Fernández | ARG | Chelsea FC (ENG) | 17.01.2001 | MF | 85 |
| 121 | Mostafa Mohamed | EGY | FC Nantes (FRA) | 28.11.1997 | ST | 75 |

Im Set sind 47 der 48 WM-Nationen vertreten (nur NED fehlt).

**Teamgeist-Gruppen im Set (gleicher Verein laut Sticker):**
Liverpool (Alisson, Mac Allister, Isak, Konaté) · Napoli (McTominay, Gilmour) · Benfica (Ríos, Dedić) · Braga (Lagerbielke, Grillitsch) ·
Villarreal (Partey, L. Costa) · Sunderland (Xhaka, Diarra) · Lille (Mbemba, Meunier) · Lyon (Tagliafico, Šulc) ·
Al Sadd (Al-Haydos, Saïss, Salman) · Augsburg (Gregoritsch, Jakić) · Burnley (Tuanzebe, Amdouni) · Fulham (Robinson, Berge) ·
Aston Villa (E. Martínez, Digne) · AC Milan (Leão, Maignan) · Galatasaray (Çakır, Ayhan) · Al-Karma (Abu Hashish, Saadeh) ·
Al-Ahli Saudi (Mahrez, Abu Alshamat) · Çaykur Rizespor (Fofana, Aliqulov).

## Offene Punkte

- Verein von Ángel Romero (PAR 19) auf der Karte nachsehen und in `daten/spielset.js` eintragen.
- Geburtsjahr von Ibrahim Sabra prüfen.
- Mannschaftssticker (Wappen) einbauen, sobald die Fotos da sind.

## Ursprünglich geplante Schritte (erledigt)

1. Panini-Checkliste von scanini.app laden → Computer-Pool (alle Sticker außer dem Spielset).
2. Spielerdaten recherchieren und ergänzen (Stärken, Schwächen, Länderspiele, internationale Erfahrung).
3. Web-App bauen (Dateien z. B. `index.html`, `style.css`, `js/…`, `daten/…`, `bilder/…`), jeden Schritt erklären.
4. Testen, committen, pushen, Link fürs Handy bereitstellen.
