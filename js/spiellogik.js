// =====================================================================
// SPIELLOGIK – hier wird gerechnet: Stärke, Wetter, Tore, Tabelle …
// =====================================================================
// Diese Datei zeigt NICHTS auf dem Bildschirm an. Sie rechnet nur.
// Die Anzeige passiert in app.js.
// =====================================================================


// ---------------------------------------------------------------------
// 1. Alle Spieler in einem Nachschlagewerk sammeln
// ---------------------------------------------------------------------
// ALLE_SPIELER["BRA 8"] liefert z. B. Wesley.
const ALLE_SPIELER = {};

for (const karte of SPIELSET) {
  ALLE_SPIELER[karte.id] = { ...karte, ausSpielset: true };
}
for (const karte of COMPUTER_POOL) {
  // Steht ein Spieler schon im Spielset, gehört er euch – nicht dem Computer.
  if (!ALLE_SPIELER[karte.id]) {
    ALLE_SPIELER[karte.id] = { ...karte, verein: "", ausSpielset: false };
  }
}

// Namen für die Computer-Mannschaften
const COMPUTER_NAMEN = [
  "Robo-Kicker", "Bit-Borussia", "FC Pixel", "Kicker-KI", "Turbo-Tablet 09", "Byte München",
  "Real Roboter", "Akku Aachen", "Chip Chelsea", "Joystick Juventus", "Laptop Lissabon", "Code Dortmund",
  "Sporting Server", "Atlético Algorithmus", "Inter Internet", "Bluetooth Bayern",
];

// Wie stark zählt eine Position für Angriff und Abwehr?
const GEWICHT_ANGRIFF = { TW: 0.05, AB: 0.25, MF: 0.6, ST: 1.0 };
const GEWICHT_ABWEHR  = { TW: 0.3,  AB: 1.0,  MF: 0.55, ST: 0.15 };

// Der aktuelle Spielstand. null = noch kein Spiel gestartet.
let spiel = null;


// ---------------------------------------------------------------------
// 2. Kleine Hilfsfunktionen
// ---------------------------------------------------------------------
function zufall(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

function mischen(liste) {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

// Wählt zufällig etwas aus, aber "schwerere" Einträge öfter.
// Beispiel: gewichteterZufall(["a","b"], [3,1]) → "a" in 75 % der Fälle
function gewichteterZufall(liste, gewichte) {
  const summe = gewichte.reduce((a, b) => a + b, 0);
  let r = Math.random() * summe;
  for (let i = 0; i < liste.length; i++) {
    r -= gewichte[i];
    if (r <= 0) return liste[i];
  }
  return liste[liste.length - 1];
}

// Stärke 50–99 in Sterne 1–5 umrechnen (für die Kinder leichter zu lesen)
function sterne(staerke) {
  if (staerke >= 84) return 5;
  if (staerke >= 78) return 4;
  if (staerke >= 72) return 3;
  if (staerke >= 66) return 2;
  return 1;
}

// "AS Roma (ITA)" → "ITA"
function vereinsLand(verein) {
  const treffer = /\(([A-Z]{3})\)\s*$/.exec(verein || "");
  return treffer ? treffer[1] : null;
}

// "AS Roma (ITA)" → "AS Roma"
function vereinKurz(verein) {
  return (verein || "").replace(/\s*\([A-Z]{3}\)\s*$/, "");
}

// Dynamische Werte eines Spielers (Müdigkeit, Tore …) – wird bei Bedarf angelegt
function status(id) {
  if (!spiel.status[id]) {
    spiel.status[id] = { inFolge: 0, verletztFuer: 0, tore: 0, vorlagen: 0, spiele: 0 };
  }
  return spiel.status[id];
}

function istVerletzt(id) {
  return status(id).verletztFuer === spiel.runde;
}

// Wer hat diesen Spieler auf der Hand? Gibt den Team-Index zurück oder -1.
function besitzerVon(id) {
  return spiel.teams.findIndex((team) => team.hand.includes(id));
}


// ---------------------------------------------------------------------
// 3. Datum, Wetter, Feiertage
// ---------------------------------------------------------------------
function datumVonRunde(runde) {
  const datum = new Date(spiel.startDatum);
  datum.setDate(datum.getDate() + (runde - 1) * EINST.tageZwischen);
  return datum;
}

function datumText(datum) {
  return new Date(datum).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

// Ist an diesem Tag in diesem Land ein Feiertag? Gibt den Namen zurück oder null.
function feiertagAm(land, datum) {
  const tag = new Date(datum);
  tag.setHours(12, 0, 0, 0);
  for (const [wann, name, tage] of LAENDER[land].feiertage) {
    // "MM-TT" → in diesem (und im vorigen) Jahr prüfen; "JJJJ-MM-TT" → genau dieses Datum
    const jahre = wann.length === 5 ? [tag.getFullYear() - 1, tag.getFullYear()] : [null];
    for (const jahr of jahre) {
      const start = new Date((jahr ? jahr + "-" : "") + wann + "T12:00:00");
      const ende = new Date(start);
      ende.setDate(ende.getDate() + tage - 1);
      if (tag >= start && tag <= ende) return name;
    }
  }
  return null;
}

function wetterAuswuerfeln(land, datum) {
  const monat = new Date(datum).getMonth();
  const temp = LAENDER[land].temp[monat] + Math.round(Math.random() * 6 - 3);
  let wetter;
  if (temp <= 1 && Math.random() < 0.5) wetter = "Schnee ❄️";
  else if (temp >= 28) wetter = "Hitze 🔥";
  else if (Math.random() < 0.3) wetter = "Regen 🌧️";
  else if (Math.random() < 0.5) wetter = "bewölkt ⛅";
  else wetter = "sonnig ☀️";
  return { temp, wetter };
}


// ---------------------------------------------------------------------
// 4. Wie gut ist ein Spieler HEUTE? (Form-Faktor)
// ---------------------------------------------------------------------
// Ergebnis: { faktor: 0.85, gruende: ["🥶 viel zu kalt", …] }
// faktor 1.0 = normal, 1.1 = 10 % besser, 0.5 = halb so gut
function spielerFaktor(id, teamIndex, partie, kapitaenId) {
  const sp = ALLE_SPIELER[id];
  let faktor = 1;
  const gruende = [];

  // Heimvorteil fürs ganze Heimteam
  if (teamIndex === partie.heim) faktor += EINST.heimBonus / 100;

  // Im eigenen Land oder im Land seines Vereins fühlt man sich wohl
  if (partie.ort === sp.land || partie.ort === vereinsLand(sp.verein)) {
    faktor += EINST.heimatBonus / 100;
    gruende.push("🏠 fühlt sich zu Hause");
  }

  // Wetter: Wie sehr weicht die Temperatur von seiner Heimat ab?
  const monat = new Date(partie.datum).getMonth();
  const heimTemp = LAENDER[sp.land].temp[monat];
  const unterschied = partie.temp - heimTemp;
  if (Math.abs(unterschied) >= 15) {
    faktor -= 0.15;
    gruende.push(unterschied < 0 ? "🥶 viel zu kalt" : "🥵 viel zu heiß");
  } else if (Math.abs(unterschied) >= 8) {
    faktor -= 0.07;
    gruende.push(unterschied < 0 ? "🧣 etwas zu kalt" : "😓 etwas zu warm");
  }

  // Feiertage seines Landes
  const gestern = new Date(partie.datum);
  gestern.setDate(gestern.getDate() - 1);
  const feiertagHeute = feiertagAm(sp.land, partie.datum);
  const feiertagGestern = feiertagAm(sp.land, gestern);
  if (feiertagHeute) {
    faktor -= EINST.feiertagMalus / 100;
    gruende.push("🎉 feiert " + feiertagHeute);
  } else if (feiertagGestern) {
    faktor -= EINST.feiertagDanachMalus / 100;
    gruende.push("😴 noch müde von " + feiertagGestern);
  }

  // Müdigkeit: ab dem i-ten Spiel in Folge 10 % weniger pro Spiel
  const naechstesSpielInFolge = status(id).inFolge + 1;
  if (naechstesSpielInFolge >= EINST.muedeAb) {
    const abzug = (naechstesSpielInFolge - EINST.muedeAb + 1) * 0.1;
    faktor -= abzug;
    gruende.push("😩 müde (" + naechstesSpielInFolge + ". Spiel in Folge)");
  }

  if (kapitaenId === id) faktor += EINST.kapitaenBonus / 100;

  return { faktor: Math.max(0.2, faktor), gruende };
}

// Müdigkeits-Ampel für die Karte: "gruen", "gelb" oder "rot"
function ampel(id) {
  const naechstes = status(id).inFolge + 1;
  if (naechstes >= EINST.muedeAb) return "rot";
  if (naechstes === EINST.muedeAb - 1) return "gelb";
  return "gruen";
}


// ---------------------------------------------------------------------
// 5. Teamgeist: Spieler aus dem gleichen Land oder Verein
// ---------------------------------------------------------------------
// Ergebnis: { bonus: 0.08, gruppen: [{ text: "Liverpool FC", art: "verein", ids: [...] }] }
function teamgeist(ids) {
  const nachLand = {};
  const nachVerein = {};
  for (const id of ids) {
    const sp = ALLE_SPIELER[id];
    (nachLand[sp.land] = nachLand[sp.land] || []).push(id);
    const verein = vereinKurz(sp.verein);
    if (verein && verein !== "?") (nachVerein[verein] = nachVerein[verein] || []).push(id);
  }

  let bonus = 0;
  const gruppen = [];
  for (const land in nachLand) {
    if (nachLand[land].length >= 2) {
      bonus += (nachLand[land].length - 1) * 0.02;
      gruppen.push({ text: LAENDER[land].flagge + " " + LAENDER[land].name, art: "land", ids: nachLand[land] });
    }
  }
  for (const verein in nachVerein) {
    if (nachVerein[verein].length >= 2) {
      bonus += (nachVerein[verein].length - 1) * 0.03;
      gruppen.push({ text: "🔗 " + verein, art: "verein", ids: nachVerein[verein] });
    }
  }
  return { bonus: Math.min(bonus, 0.15), gruppen };
}


// ---------------------------------------------------------------------
// 6. Saison anlegen: Teams, Spielplan, Spieltage
// ---------------------------------------------------------------------
function neuesSpiel(menschenNamen) {
  spiel = {
    startDatum: new Date().toISOString(),
    runde: 1,
    phase: "startkarten",
    aktuell: 0,          // welcher Mensch ist gerade dran?
    teams: [],
    status: {},
    spielplan: [],
    runden: {},          // runden[1] = { datum, partien: [...] }
    tabelleVorher: null, // Platzierungen vor dem Spieltag (für die Pfeile)
    finale: null,
    meister: null,
  };
  for (const name of menschenNamen) {
    spiel.teams.push({ name, mensch: true, hand: [], heimat: null });
  }
  // Pro Mensch spielen l Computer-Teams mit (Einstellung computerProSpieler)
  const anzahlComputer = menschenNamen.length * EINST.computerProSpieler;
  const computerNamen = mischen(COMPUTER_NAMEN);
  for (let i = 0; i < anzahlComputer; i++) {
    // Reichen die Namen nicht, bekommen sie eine Nummer: "Robo-Kicker 2"
    const name = computerNamen[i % computerNamen.length] + (i >= computerNamen.length ? " " + (Math.floor(i / computerNamen.length) + 1) : "");
    spiel.teams.push({ name, mensch: false, hand: [], heimat: null });
  }
}

// Jeder spielt gegen jeden ("Rundenturnier"), so oft bis alle Spieltage voll sind.
// Bei einer ungeraden Anzahl Teams kommt ein "Spielfrei"-Platz (-1) dazu:
// Wer gegen -1 gelost wird, hat an diesem Spieltag frei.
function spielplanErstellen() {
  const ids = mischen([...Array(spiel.teams.length).keys()]);
  if (ids.length % 2 === 1) ids.push(-1);
  const anzahl = ids.length;
  const grundRunden = [];
  for (let r = 0; r < anzahl - 1; r++) {
    const paare = [];
    for (let i = 0; i < anzahl / 2; i++) {
      const a = ids[i];
      const b = ids[anzahl - 1 - i];
      if (a === -1 || b === -1) continue; // spielfrei
      paare.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    grundRunden.push(paare);
    ids.splice(1, 0, ids.pop()); // alle außer dem ersten eins weiterdrehen
  }
  spiel.spielplan = [];
  for (let i = 0; i < EINST.spieltage; i++) {
    const paare = grundRunden[i % grundRunden.length];
    const rueckrunde = Math.floor(i / grundRunden.length) % 2 === 1;
    spiel.spielplan.push(paare.map(([h, g]) => (rueckrunde ? [g, h] : [h, g])));
  }
}

// Eine Partie (ein Spiel) mit Ort, Datum und Wetter anlegen
function partieAnlegen(heim, gast, datum) {
  const ort = spiel.teams[heim].heimat;
  const { temp, wetter } = wetterAuswuerfeln(ort, datum);
  return {
    heim, gast, ort, stadt: LAENDER[ort].stadt, datum: datum.toISOString(), temp, wetter,
    aufstellung: {}, kapitaen: {}, toreHeim: null, toreGast: null, ereignisse: [], elfmeter: null,
  };
}

// Vor jedem Spieltag: Computer ziehen, Partien mit Wetter anlegen
function rundeVorbereiten() {
  const datum = datumVonRunde(spiel.runde);
  let paare;
  if (spiel.finale) {
    paare = [spiel.finale];
  } else {
    paare = spiel.spielplan[spiel.runde - 1];
    if (spiel.runde > 1) {
      spiel.teams.forEach((team, i) => { if (!team.mensch) computerZiehen(i); });
    }
  }
  spiel.runden[spiel.runde] = {
    datum: datum.toISOString(),
    partien: paare.map(([h, g]) => partieAnlegen(h, g, datum)),
  };
  spiel.teams.forEach((team) => { team.getauscht = false; team.gezogen = false; });
  spiel.tabelleVorher = tabelle().map((zeile) => zeile.team);
}

// Die Partie, in der ein Team in dieser Runde spielt (oder null)
function partieVon(teamIndex) {
  const runde = spiel.runden[spiel.runde];
  if (!runde) return null;
  return runde.partien.find((p) => p.heim === teamIndex || p.gast === teamIndex) || null;
}

// Welche Menschen sind in dieser Runde dran? Im Finale nur die Finalisten.
// Sonst alle – auch wer spielfrei hat, zieht eine Karte.
function menschenDieserRunde() {
  const liste = [];
  spiel.teams.forEach((team, i) => { if (team.mensch && (partieVon(i) || !spiel.finale)) liste.push(i); });
  return liste;
}


// ---------------------------------------------------------------------
// 7. Karten: eintragen, tauschen, Computer ziehen lassen
// ---------------------------------------------------------------------
// Prüft, ob ein Mensch diese Karte aufnehmen darf. Gibt Fehlertext oder null zurück.
function karteDarfAufgenommenWerden(id) {
  const besitzer = besitzerVon(id);
  if (besitzer >= 0) {
    return "Den hat schon " + spiel.teams[besitzer].name + "! Lege die Karte zurück und ziehe eine neue.";
  }
  if (!ALLE_SPIELER[id] || !ALLE_SPIELER[id].ausSpielset) return "Diese Karte gehört nicht zu eurem Spielset.";
  return null;
}

// Alle Karten, die der Computer noch ziehen kann (nie aus eurem Spielset!)
function computerStapel() {
  const vergeben = new Set(spiel.teams.flatMap((team) => team.hand));
  return Object.keys(ALLE_SPIELER).filter((id) => !ALLE_SPIELER[id].ausSpielset && !vergeben.has(id));
}

function computerZiehen(teamIndex) {
  const team = spiel.teams[teamIndex];
  if (team.hand.length >= EINST.maxHand) return;
  const stapel = computerStapel();
  if (stapel.length === 0) return;
  let karte = zufall(stapel);
  // Level 3: zwei Karten ansehen und die bessere behalten
  if (EINST.computerLevel >= 3) {
    const zweite = zufall(stapel);
    if (ALLE_SPIELER[zweite].staerke > ALLE_SPIELER[karte].staerke) karte = zweite;
  }
  team.hand.push(karte);
}

// Computer wählt die Heimat: das Land, von dem er die meisten Spieler hat
function heimatAusHand(hand) {
  const zaehler = {};
  for (const id of hand) zaehler[ALLE_SPIELER[id].land] = (zaehler[ALLE_SPIELER[id].land] || 0) + 1;
  return Object.keys(zaehler).sort((a, b) => zaehler[b] - zaehler[a])[0];
}

function computerStartkarten() {
  spiel.teams.forEach((team, i) => {
    if (team.mensch) return;
    for (let k = 0; k < EINST.startKarten; k++) computerZiehen(i);
    team.heimat = heimatAusHand(team.hand);
  });
}


// ---------------------------------------------------------------------
// 8. Aufstellen: beste Elf finden (für Computer und für den Tipp)
// ---------------------------------------------------------------------
// Wie viele Spieler pro Position bei n Spielern?
function formation(n) {
  const rest = n - 1; // einer steht im Tor
  const st = Math.max(1, Math.round(rest * 0.25));
  const ab = Math.round(rest * 0.4);
  return { TW: 1, AB: ab, MF: Math.max(0, rest - ab - st), ST: st };
}

function verfuegbareSpieler(teamIndex) {
  return spiel.teams[teamIndex].hand.filter((id) => !istVerletzt(id));
}

function besteAufstellung(teamIndex) {
  const partie = partieVon(teamIndex);
  const n = teamGroesse(spiel.runde);
  // Jeden verfügbaren Spieler mit seiner heutigen Stärke bewerten
  const bewertet = verfuegbareSpieler(teamIndex)
    .map((id) => ({ id, wert: ALLE_SPIELER[id].staerke * spielerFaktor(id, teamIndex, partie).faktor }))
    .sort((a, b) => b.wert - a.wert);

  const gewaehlt = [];
  const plan = formation(n);
  for (const pos of ["TW", "AB", "MF", "ST"]) {
    const passende = bewertet.filter((s) => ALLE_SPIELER[s.id].pos === pos && !gewaehlt.includes(s.id));
    gewaehlt.push(...passende.slice(0, plan[pos]).map((s) => s.id));
  }
  // Lücken mit den besten übrigen Spielern füllen
  for (const s of bewertet) {
    if (gewaehlt.length >= n) break;
    if (!gewaehlt.includes(s.id)) gewaehlt.push(s.id);
  }
  const ids = gewaehlt.slice(0, n);
  // Kapitän: der Stärkste
  const kapitaen = bewertet.find((s) => ids.includes(s.id));
  return { ids, kapitaen: kapitaen ? kapitaen.id : null };
}

function zufallsAufstellung(teamIndex) {
  const ids = mischen(verfuegbareSpieler(teamIndex)).slice(0, teamGroesse(spiel.runde));
  return { ids, kapitaen: ids.length ? zufall(ids) : null };
}

// Der Computer würfelt am Anfang, später stellt er taktisch auf
function computerAufstellen(teamIndex) {
  const taktischAbRunde = { 1: 9, 2: 5, 3: 1 }[EINST.computerLevel] || 5;
  const wahl = spiel.runde >= taktischAbRunde || spiel.finale ? besteAufstellung(teamIndex) : zufallsAufstellung(teamIndex);
  aufstellungSpeichern(teamIndex, wahl.ids, wahl.kapitaen);
}

function aufstellungSpeichern(teamIndex, ids, kapitaen) {
  const partie = partieVon(teamIndex);
  partie.aufstellung[teamIndex] = ids;
  partie.kapitaen[teamIndex] = kapitaen;
}


// ---------------------------------------------------------------------
// 9. Tipps für die Aufstellung
// ---------------------------------------------------------------------
function tippsFuer(teamIndex) {
  const team = spiel.teams[teamIndex];
  const partie = partieVon(teamIndex);
  const tipps = [];
  const name = (id) => ALLE_SPIELER[id].name;

  if (!team.hand.some((id) => ALLE_SPIELER[id].pos === "TW" && !istVerletzt(id))) {
    tipps.push("🧤 Du hast keinen fitten Torwart! Dann muss dein bester Verteidiger ins Tor – das ist riskant.");
  }
  for (const id of team.hand) {
    if (istVerletzt(id)) tipps.push("🤕 " + name(id) + " ist verletzt und kann heute nicht spielen.");
    else if (status(id).inFolge >= EINST.tippWarnungAb) {
      tipps.push("😩 " + name(id) + " hat schon " + status(id).inFolge + " Spiele in Folge gemacht. Gönn ihm eine Pause – sonst wird er müde und verletzt sich leichter!");
    }
  }
  for (const gruppe of teamgeist(team.hand).gruppen) {
    tipps.push("🤝 Diese Spieler kennen sich (" + gruppe.text + "): " + gruppe.ids.map(name).join(", ") + ". Zusammen aufgestellt gibt's Teamgeist-Bonus!");
  }
  for (const id of team.hand) {
    const { gruende } = spielerFaktor(id, teamIndex, partie);
    const ohneMuede = gruende.filter((g) => !g.startsWith("😩"));
    if (ohneMuede.length) tipps.push("🌍 " + name(id) + ": " + ohneMuede.join(", "));
  }
  const vorschlag = besteAufstellung(teamIndex);
  tipps.push("💡 Mein Vorschlag: " + vorschlag.ids.map(name).join(", ") + " – Kapitän: " + (vorschlag.kapitaen ? name(vorschlag.kapitaen) : "–"));
  return tipps;
}


// ---------------------------------------------------------------------
// 10. Ein Spiel simulieren
// ---------------------------------------------------------------------
// Rechnet aus, wie stark ein Team heute in Angriff, Abwehr und Tor ist
function teamWerte(teamIndex, partie) {
  const ids = partie.aufstellung[teamIndex] || [];
  const kapitaen = partie.kapitaen[teamIndex];
  const spieler = ids.map((id) => ({
    id,
    pos: ALLE_SPIELER[id].pos,
    wert: ALLE_SPIELER[id].staerke * spielerFaktor(id, teamIndex, partie, kapitaen).faktor,
  }));

  // Wer steht im Tor?
  let torwart = spieler.filter((s) => s.pos === "TW").sort((a, b) => b.wert - a.wert)[0];
  let notTorwart = false;
  if (!torwart && spieler.length) {
    // Kein Torwart → der abwehrstärkste Spieler muss ins Tor (und ist dort schwächer)
    torwart = [...spieler].sort((a, b) => b.wert * GEWICHT_ABWEHR[b.pos] - a.wert * GEWICHT_ABWEHR[a.pos])[0];
    notTorwart = true;
  }
  const feld = spieler.filter((s) => s !== torwart);
  const geist = teamgeist(ids);

  let angriff = 0;
  let abwehr = 0;
  for (const s of feld) {
    angriff += s.wert * GEWICHT_ANGRIFF[s.pos];
    abwehr += s.wert * GEWICHT_ABWEHR[s.pos];
  }
  return {
    spieler, feld, torwart, notTorwart, geist,
    angriff: Math.max(1, angriff * (1 + geist.bonus)),
    abwehr: Math.max(1, abwehr * (1 + geist.bonus)),
    torwartWert: torwart ? (notTorwart ? torwart.wert * 0.7 : torwart.wert) : 30,
  };
}

// Erwartete Tore: guter Angriff gegen schwache Abwehr = viele Tore
function erwarteteTore(angreifer, verteidiger) {
  const tore = 1.1 * Math.pow(angreifer.angriff / verteidiger.abwehr, 1.3) * Math.pow(78 / verteidiger.torwartWert, 1.2);
  return Math.min(4.5, Math.max(0.15, tore));
}

const TOR_ARTEN = ["schuss", "kopfball", "fernschuss", "elfmeter", "freistoss", "fallrueckzieher"];
const TOR_ART_GEWICHTE = [42, 20, 12, 10, 9, 7];
const TOR_GEWICHT = { TW: 0.02, AB: 1, MF: 2.5, ST: 5 };
const VORLAGE_GEWICHT = { TW: 0.3, AB: 1.5, MF: 4, ST: 2.5 };

function simulieren(partie) {
  const werte = { [partie.heim]: teamWerte(partie.heim, partie), [partie.gast]: teamWerte(partie.gast, partie) };
  const ereignisse = [];
  const name = (id) => ALLE_SPIELER[id].name;
  const gegnerVon = (t) => (t === partie.heim ? partie.gast : partie.heim);
  partie.toreHeim = 0;
  partie.toreGast = 0;

  ereignisse.push({ minute: 0, typ: "info", text: textBauen(TEXTE.anpfiff, { stadt: partie.stadt }) });
  for (const t of [partie.heim, partie.gast]) {
    if (werte[t].notTorwart) {
      ereignisse.push({ minute: 0, typ: "info", team: t,
        text: textBauen(TEXTE.notTorwart, { team: spiel.teams[t].name, spieler: name(werte[t].torwart.id) }) });
    }
  }

  for (const t of [partie.heim, partie.gast]) {
    const eigene = werte[t];
    const gegner = werte[gegnerVon(t)];
    if (!eigene.feld.length) continue;
    const erwartet = erwarteteTore(eigene, gegner);
    const torwartName = gegner.torwart ? name(gegner.torwart.id) : "der Torwart";

    // Tore: jede Minute eine kleine Chance
    for (let minute = 1; minute <= 90; minute++) {
      if (Math.random() < erwartet / 90) {
        const art = gewichteterZufall(TOR_ARTEN, TOR_ART_GEWICHTE);
        const schuetze = gewichteterZufall(eigene.feld, eigene.feld.map((s) => s.wert * TOR_GEWICHT[s.pos])).id;
        let vorlage = null;
        const andere = eigene.spieler.filter((s) => s.id !== schuetze);
        if (art !== "elfmeter" && art !== "freistoss" && andere.length && Math.random() < 0.8) {
          vorlage = gewichteterZufall(andere, andere.map((s) => s.wert * VORLAGE_GEWICHT[s.pos])).id;
        }
        if (t === partie.heim) partie.toreHeim++; else partie.toreGast++;
        status(schuetze).tore++;
        if (vorlage) status(vorlage).vorlagen++;
        let text = textBauen(TEXTE.tor[art], { spieler: name(schuetze), team: spiel.teams[t].name, torwart: torwartName });
        if (vorlage) text += " " + textBauen(TEXTE.vorlage, { vorlage: name(vorlage) });
        ereignisse.push({ minute, typ: "tor", team: t, spieler: schuetze, vorlage, art, text });
      }
    }

    // Chancen, Paraden und Karten – damit der Ticker spannend wird
    const anzahlChancen = Math.round(erwartet * 1.5 + Math.random() * 2);
    for (let i = 0; i < anzahlChancen; i++) {
      const sp = gewichteterZufall(eigene.feld, eigene.feld.map((s) => s.wert * TOR_GEWICHT[s.pos])).id;
      const parade = Math.random() < 0.5 && gegner.torwart;
      ereignisse.push({
        minute: 1 + Math.floor(Math.random() * 90), typ: parade ? "parade" : "chance", team: t,
        text: textBauen(parade ? TEXTE.parade : TEXTE.chance, { spieler: name(sp), team: spiel.teams[t].name, torwart: torwartName }),
      });
    }
    if (Math.random() < 0.6) {
      const sp = zufall(eigene.feld).id;
      ereignisse.push({ minute: 1 + Math.floor(Math.random() * 90), typ: "gelb", team: t, text: textBauen(TEXTE.gelb, { spieler: name(sp) }) });
    }
  }

  // Verletzungen
  const verletzte = [];
  for (const t of [partie.heim, partie.gast]) {
    for (const s of werte[t].spieler) {
      // Müde Spieler verletzen sich leichter
      const inFolge = status(s.id).inFolge + 1;
      if (inFolge >= EINST.muedeAb && Math.random() < 0.07 * (inFolge - EINST.muedeAb + 1)) verletzte.push({ t, id: s.id });
    }
  }
  // Alle j Runden erwischt es zufällig einen Spieler
  if (EINST.verletzungAlle > 0 && spiel.runde % EINST.verletzungAlle === 0 && !spiel.finale) {
    const t = zufall([partie.heim, partie.gast]);
    if (werte[t].spieler.length) verletzte.push({ t, id: zufall(werte[t].spieler).id });
  }
  for (const { t, id } of verletzte) {
    if (status(id).verletztFuer === spiel.runde + 1) continue;
    status(id).verletztFuer = spiel.runde + 1;
    ereignisse.push({ minute: 1 + Math.floor(Math.random() * 90), typ: "verletzung", team: t, spieler: id, text: textBauen(TEXTE.verletzung, { spieler: name(id) }) });
  }

  ereignisse.push({ minute: 45, typ: "halbzeit", text: textBauen(TEXTE.halbzeit, {}) });
  ereignisse.sort((a, b) => a.minute - b.minute);
  ereignisse.push({ minute: 90, typ: "info", text: textBauen(TEXTE.abpfiff, {}) });

  // Im Finale gibt es keinen Sieger per Unentschieden → Elfmeterschießen
  if (spiel.finale && partie.toreHeim === partie.toreGast) {
    partie.elfmeter = elfmeterschiessen(werte[partie.heim], werte[partie.gast]);
    ereignisse.push({ minute: 120, typ: "info", text: "Elfmeterschießen! " + partie.elfmeter.heim + " : " + partie.elfmeter.gast });
  }

  partie.ereignisse = ereignisse;
  partie.teamgeist = { [partie.heim]: werte[partie.heim].geist.gruppen.map((g) => g.text), [partie.gast]: werte[partie.gast].geist.gruppen.map((g) => g.text) };
}

function elfmeterschiessen(heim, gast) {
  const trifft = (schuetzen, torwart) => {
    const schuetze = zufall(schuetzen.length ? schuetzen : [{ wert: 60 }]);
    return Math.random() < 0.75 + (schuetze.wert - (torwart ? torwart.wert : 50)) / 400;
  };
  let h = 0;
  let g = 0;
  for (let runde = 1; runde <= 30; runde++) {
    if (trifft(heim.feld, gast.torwart)) h++;
    if (trifft(gast.feld, heim.torwart)) g++;
    if (runde >= 5 && h !== g) break;
  }
  return { heim: h, gast: g };
}

// Prüft zur Sicherheit, dass kein Spieler in beiden Teams steht
function doppeltePruefen(partie) {
  const heim = partie.aufstellung[partie.heim] || [];
  const gast = partie.aufstellung[partie.gast] || [];
  return heim.filter((id) => gast.includes(id));
}

// Wenn alle aufgestellt haben: Computer stellen auf, alle Spiele werden simuliert
function spieltagSpielen() {
  const runde = spiel.runden[spiel.runde];
  spiel.teams.forEach((team, i) => {
    if (!team.mensch && partieVon(i)) computerAufstellen(i);
  });
  for (const partie of runde.partien) {
    const doppelt = doppeltePruefen(partie);
    if (doppelt.length) {
      // Sollte nie passieren – zur Sicherheit wird der Spieler beim Gast gestrichen
      partie.aufstellung[partie.gast] = partie.aufstellung[partie.gast].filter((id) => !doppelt.includes(id));
    }
    simulieren(partie);
  }
  // Müdigkeit zählen: wer gespielt hat, +1; wer pausiert hat, wieder frisch
  spiel.teams.forEach((team, i) => {
    const partie = partieVon(i);
    const aufgestellt = partie ? partie.aufstellung[i] || [] : [];
    for (const id of team.hand) {
      if (aufgestellt.includes(id)) {
        status(id).inFolge++;
        status(id).spiele++;
      } else {
        status(id).inFolge = 0;
      }
    }
  });
}


// ---------------------------------------------------------------------
// 11. Tabelle und Scorerliste
// ---------------------------------------------------------------------
// Bundesliga-Regeln: Sieg 3 Punkte, Unentschieden 1, Niederlage 0
function tabelle() {
  const zeilen = spiel.teams.map((team, i) => ({ team: i, spiele: 0, s: 0, u: 0, n: 0, tore: 0, gegentore: 0, punkte: 0 }));
  for (const nr in spiel.runden) {
    if (Number(nr) > spiel.spielplan.length) continue; // das Finale zählt nicht zur Tabelle
    for (const p of spiel.runden[nr].partien) {
      if (p.toreHeim === null) continue;
      const heim = zeilen[p.heim];
      const gast = zeilen[p.gast];
      heim.spiele++; gast.spiele++;
      heim.tore += p.toreHeim; heim.gegentore += p.toreGast;
      gast.tore += p.toreGast; gast.gegentore += p.toreHeim;
      if (p.toreHeim > p.toreGast) { heim.s++; gast.n++; heim.punkte += 3; }
      else if (p.toreHeim < p.toreGast) { gast.s++; heim.n++; gast.punkte += 3; }
      else { heim.u++; gast.u++; heim.punkte++; gast.punkte++; }
    }
  }
  return zeilen.sort((a, b) =>
    b.punkte - a.punkte ||
    (b.tore - b.gegentore) - (a.tore - a.gegentore) ||
    b.tore - a.tore);
}

// Scorer: Tore + Vorlagen = Scorerpunkte
function scorerListe() {
  const liste = [];
  for (const id in spiel.status) {
    const st = spiel.status[id];
    if (st.tore + st.vorlagen > 0) {
      liste.push({ id, tore: st.tore, vorlagen: st.vorlagen, punkte: st.tore + st.vorlagen, team: besitzerVon(id) });
    }
  }
  return liste.sort((a, b) => b.punkte - a.punkte || b.tore - a.tore);
}

// Sieger einer Partie (Team-Index) oder null bei Unentschieden
function siegerVon(partie) {
  let h = partie.toreHeim;
  let g = partie.toreGast;
  if (h === g && partie.elfmeter) { h = partie.elfmeter.heim; g = partie.elfmeter.gast; }
  if (h > g) return partie.heim;
  if (g > h) return partie.gast;
  return null;
}


// ---------------------------------------------------------------------
// 12. Spielstand speichern und laden (im Browser)
// ---------------------------------------------------------------------
function spielSpeichern() {
  try { localStorage.setItem("liga-spielstand", JSON.stringify(spiel)); } catch (fehler) {}
}

function spielLaden() {
  try {
    const text = localStorage.getItem("liga-spielstand");
    if (text) spiel = JSON.parse(text);
  } catch (fehler) {
    spiel = null;
  }
  return spiel;
}

function spielLoeschen() {
  try { localStorage.removeItem("liga-spielstand"); } catch (fehler) {}
  spiel = null;
}
