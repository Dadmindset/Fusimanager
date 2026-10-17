// =====================================================================
// APP – alles, was man auf dem Bildschirm sieht und anklickt
// =====================================================================
// So funktioniert es:
//  - Jeder Bildschirm ist eine Funktion in SEITEN, die HTML-Text zurückgibt.
//  - zeige() schreibt diesen Text in <div id="app">.
//  - Knöpfe haben data-aktion="…". Ein Klick ruft AKTIONEN[…] auf.
// =====================================================================

// Zustand der Anzeige (wird NICHT gespeichert)
const ui = {
  seite: "start",
  auswahl: [],        // ausgewählte Spieler in der Aufstellung
  kapitaen: null,
  meldung: "",        // Hinweis- oder Fehlertext
  tippsOffen: false,
  tauschKarte: null,  // Karte, die beim Tauschen abgegeben wird
  spielNr: 0,         // welches Spiel im Live-Ticker gezeigt wird
  tickerIndex: 0,
  tickerUhr: null,
  pauseRest: 0,       // Sekunden, die die Halbzeitpause noch dauert
  inHalbzeit: false,  // läuft gerade die Halbzeitpause?
  wechselWarteschlange: [], // wer in dieser Halbzeit noch wechseln darf (erst Heim, dann Gast)
  wechselAktiv: null, // Team, das gerade den Knopf "Spieler wechseln" sieht
  wechselRest: 0,     // Sekunden, die der Knopf noch sichtbar ist
  wechselDialog: null, // offener Wechsel: { team, raus, rein }
  neuBestaetigen: false,
};

// Text sicher ins HTML schreiben (z. B. Namen, die jemand eingetippt hat)
function sicher(text) {
  return String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[z]));
}

// Für die Suche: "Çakır" → "cakir"
function vereinfachen(text) {
  return text.toLowerCase().replace(/ı/g, "i").replace(/ø/g, "o").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function teamName(i) {
  const team = spiel.teams[i];
  return sicher(team.name) + (team.mensch ? "" : " 🤖");
}

function flagge(land) {
  return LAENDER[land] ? LAENDER[land].flagge : "🏳️";
}


// ---------------------------------------------------------------------
// Bausteine: Karte, Sterne, Ampel
// ---------------------------------------------------------------------
function sterneHtml(staerke) {
  const anzahl = sterne(staerke);
  return '<span class="sterne" title="Stärke ' + staerke + '">' + "★".repeat(anzahl) + '<span class="leer">' + "★".repeat(5 - anzahl) + "</span></span>";
}

function initialen(name) {
  const teile = name.split(" ");
  return (teile.length > 1 ? teile[0][0] + teile[teile.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

// Eine Fusi-Karte als Knopf. optionen: { aktion, gewaehlt, kapitaen, teamIndex, klein }
function karteHtml(id, optionen = {}) {
  const sp = ALLE_SPIELER[id];
  const verletzt = spiel && istVerletzt(id);
  const klassen = ["karte", "pos-" + sp.pos];
  if (optionen.gewaehlt) klassen.push("gewaehlt");
  if (verletzt) klassen.push("verletzt");
  if (optionen.klein) klassen.push("klein");

  let hinweise = "";
  if (spiel && optionen.teamIndex !== undefined) {
    const partie = partieVon(optionen.teamIndex);
    if (partie) {
      const { gruende } = spielerFaktor(id, optionen.teamIndex, partie);
      if (gruende.length) hinweise = '<span class="karte-hinweise">' + gruende.map((g) => sicher(g)).join("<br>") + "</span>";
    }
  }
  const ampelHtml = spiel ? '<span class="ampel ' + ampel(id) + '" title="Müdigkeit"></span>' : "";
  const aktion = optionen.aktion ? ' data-aktion="' + optionen.aktion + '" data-wert="' + id + '"' : "";
  const tag = optionen.aktion ? "button" : "div";

  return "<" + tag + ' class="' + klassen.join(" ") + '"' + aktion + ' style="--nation:' + LAENDER[sp.land].farbe + '">' +
    '<span class="karte-code">' + id + "</span>" +
    (optionen.kapitaen ? '<span class="karte-c" title="Kapitän">C</span>' : "") +
    (verletzt ? '<span class="karte-verletzt">🤕</span>' : "") +
    '<span class="karte-bild"><span class="karte-flagge">' + flagge(sp.land) + "</span><b>" + initialen(sp.name) + "</b></span>" +
    '<span class="karte-name">' + sicher(sp.name) + "</span>" +
    '<span class="karte-verein">' + sicher(vereinKurz(sp.verein) || LAENDER[sp.land].name) + "</span>" +
    '<span class="karte-fuss"><span class="pos">' + sp.pos + "</span>" + sterneHtml(sp.staerke) + ampelHtml + "</span>" +
    hinweise +
    "</" + tag + ">";
}

function meldungHtml() {
  if (!ui.meldung) return "";
  return '<p class="meldung">' + ui.meldung + "</p>";
}

// Suchfeld mit Vorschlägen zum Eintippen gezogener Karten
function sucheHtml(platzhalter) {
  return '<div class="suche">' +
    '<input id="suche" type="search" autocomplete="off" placeholder="' + platzhalter + '">' +
    '<div id="vorschlaege" class="vorschlaege"></div></div>';
}

function vorschlaegeAktualisieren() {
  const feld = document.getElementById("suche");
  const box = document.getElementById("vorschlaege");
  if (!feld || !box) return;
  const suche = vereinfachen(feld.value.trim());
  if (suche.length < 2) { box.innerHTML = ""; return; }
  const treffer = SPIELSET.filter((k) => vereinfachen(k.name).includes(suche) || vereinfachen(k.id).includes(suche)).slice(0, 8);
  box.innerHTML = treffer.length ? treffer.map((k) => {
    const besitzer = besitzerVon(k.id);
    const hinweis = besitzer >= 0 ? ' <em>(hat schon ' + sicher(spiel.teams[besitzer].name) + ")</em>" : "";
    return '<button class="vorschlag" data-aktion="karteNehmen" data-wert="' + k.id + '">' +
      '<span class="vorschlag-flagge">' + flagge(k.land) + "</span>" +
      "<span><b>" + sicher(k.name) + "</b>" + hinweis + "<br><small>" + k.id + " · " + k.pos + " · " + sicher(vereinKurz(k.verein)) + "</small></span>" +
      sterneHtml(k.staerke) + "</button>";
  }).join("") : '<p class="leise">Keine Karte gefunden. Stimmt die Schreibweise?</p>';
}


// ---------------------------------------------------------------------
// Kopfzeile
// ---------------------------------------------------------------------
function kopfHtml() {
  let info = "";
  if (spiel && ui.seite !== "start" && ui.seite !== "einrichten") {
    info = spiel.finale ? "🏆 Finale" : "Spieltag " + spiel.runde + " / " + spiel.spielplan.length;
  }
  return '<header class="kopf">' +
    '<button class="logo-knopf" data-aktion="zumStart" title="Zum Startbildschirm"><img src="bilder/logo.svg" alt="" class="logo-klein"><span>Liga-Simulator</span></button>' +
    '<span class="kopf-info">' + info + "</span>" +
    '<button class="icon-knopf" data-aktion="einstellungen" title="Einstellungen">⚙️</button>' +
    "</header>";
}


// ---------------------------------------------------------------------
// DIE BILDSCHIRME
// ---------------------------------------------------------------------
const SEITEN = {};

SEITEN.start = function () {
  const gespeichert = spiel !== null;
  return '<section class="start">' +
    '<img src="bilder/logo.svg" alt="Fußballer beim Fallrückzieher" class="logo-gross">' +
    "<h1>Liga-Simulator</h1>" +
    '<p class="untertitel">Der Fußball-Manager mit euren Fusi-Karten</p>' +
    '<div class="knopfreihe">' +
    (gespeichert ? '<button class="knopf haupt" data-aktion="fortsetzen">▶️ Spiel fortsetzen</button>' : "") +
    '<button class="knopf' + (gespeichert ? "" : " haupt") + '" data-aktion="neuesSpiel">⚽ Neues Spiel</button>' +
    '<button class="knopf" data-aktion="einstellungen">⚙️ Einstellungen</button>' +
    "</div>" +
    (ui.neuBestaetigen ? '<div class="kasten warnung"><p>Wirklich ein neues Spiel starten? Der alte Spielstand wird gelöscht.</p>' +
      '<div class="knopfreihe"><button class="knopf haupt" data-aktion="neuesSpielJa">Ja, neues Spiel</button><button class="knopf" data-aktion="neuesSpielNein">Nein, zurück</button></div></div>' : "") +
    '<p class="leise">' + SPIELSET.length + " Karten in eurem Spielset · " + COMPUTER_POOL.length + " weitere WM-Sticker für die Computer-Gegner</p>" +
    "</section>";
};

SEITEN.einrichten = function () {
  let felder = "";
  for (let i = 0; i < 5; i++) {
    felder += '<input id="name' + i + '" class="namensfeld" placeholder="Spieler ' + (i + 1) + (i < 2 ? "" : " (optional)") + '" maxlength="20">';
  }
  const level = [1, 2, 3].map((l) =>
    '<button class="knopf' + (EINST.computerLevel === l ? " aktiv" : "") + '" data-aktion="level" data-wert="' + l + '">' +
    ["", "😊 Leicht", "😐 Mittel", "😈 Schwer"][l] + "</button>").join("");
  return '<section class="seite">' +
    "<h2>Wer spielt mit?</h2>" +
    '<p class="leise">Tragt eure Namen ein. Für jeden Menschen spielen ' + EINST.computerProSpieler + " Computer-Teams mit (einstellbar unter ⚙️).</p>" +
    '<div class="namen">' + felder + "</div>" +
    "<h3>Wie stark ist der Computer?</h3>" +
    '<div class="knopfreihe">' + level + "</div>" +
    meldungHtml() +
    '<div class="knopfreihe"><button class="knopf haupt" data-aktion="einrichtenFertig">Los geht\'s!</button></div>' +
    "</section>";
};

SEITEN.startkarten = function () {
  const team = spiel.teams[spiel.aktuell];
  const fertig = team.hand.length >= EINST.startKarten;
  let html = '<section class="seite">' +
    "<h2>" + sicher(team.name) + ": deine Startkarten</h2>";
  if (!fertig) {
    html += "<p>Tippe die Namen deiner <b>" + EINST.startKarten + " Startkarten</b> ein (oder die Nummer, z. B. „BRA 8“). " +
      "Noch <b>" + (EINST.startKarten - team.hand.length) + "</b>.</p>" + sucheHtml("Name oder Sticker-Nummer …");
  }
  html += meldungHtml();
  html += '<div class="karten">' + team.hand.map((id) => karteHtml(id, { aktion: "karteEntfernen" })).join("") + "</div>";
  if (team.hand.length) html += '<p class="leise">Vertippt? Tippe auf eine Karte, um sie wieder zu entfernen.</p>';
  if (fertig) {
    const laender = [...new Set(team.hand.map((id) => ALLE_SPIELER[id].land))];
    html += "<h3>Wo ist dein Heimstadion?</h3><p>Du kannst nur ein Land wählen, von dem du einen Spieler hast.</p>" +
      '<div class="knopfreihe">' + laender.map((land) =>
        '<button class="knopf' + (team.heimat === land ? " aktiv" : "") + '" data-aktion="heimat" data-wert="' + land + '">' +
        flagge(land) + " " + LAENDER[land].stadt + "</button>").join("") + "</div>";
    if (team.heimat) html += '<div class="knopfreihe"><button class="knopf haupt" data-aktion="startkartenFertig">Fertig ✔</button></div>';
  }
  return html + "</section>";
};

SEITEN.vorschau = function () {
  const runde = spiel.runden[spiel.runde];
  let html = '<section class="seite"><h2>' + (spiel.finale ? "🏆 Das große Finale" : "Spieltag " + spiel.runde) + "</h2>" +
    '<p class="datum">📅 ' + datumText(runde.datum) + "</p>" +
    '<p class="leise">Teamgröße heute: <b>' + teamGroesse(spiel.runde) + " Spieler</b></p>";
  for (const p of runde.partien) {
    html += '<div class="partie-vorschau">' +
      '<div class="paarung"><span>' + teamName(p.heim) + '</span><span class="vs">gegen</span><span>' + teamName(p.gast) + "</span></div>" +
      '<div class="ort">📍 ' + flagge(p.ort) + " " + p.stadt + " · 🌡️ " + p.temp + " °C · " + p.wetter + "</div>" +
      "</div>";
  }
  // Wer hat an diesem Spieltag frei? (nur bei ungerader Anzahl Teams, nicht im Finale)
  if (!spiel.finale) {
    const frei = spiel.teams.map((t, i) => i).filter((i) => !partieVon(i));
    if (frei.length) html += '<p class="leise">😴 Spielfrei: ' + frei.map(teamName).join(", ") + "</p>";
  }
  // Feiertage aller Länder, deren Spieler gerade auf einer Hand sind
  const laender = [...new Set(spiel.teams.flatMap((t) => t.hand.map((id) => ALLE_SPIELER[id].land)))];
  const gestern = new Date(runde.datum);
  gestern.setDate(gestern.getDate() - 1);
  const feste = [];
  for (const land of laender) {
    const heute = feiertagAm(land, runde.datum);
    const vorher = feiertagAm(land, gestern);
    if (heute) feste.push(flagge(land) + " " + LAENDER[land].name + ": <b>" + heute + "</b> – Spieler feiern und spielen schlecht!");
    else if (vorher) feste.push(flagge(land) + " " + LAENDER[land].name + ": gestern war " + vorher + " – Spieler sind noch müde.");
  }
  html += feste.length ? '<div class="kasten"><h3>🎉 Feiertage</h3><p>' + feste.join("<br>") + "</p></div>"
    : '<p class="leise">Heute ist bei keinem eurer Spieler ein Feiertag.</p>';
  html += '<div class="knopfreihe"><button class="knopf haupt" data-aktion="vorschauWeiter">Aufstellen ▶</button></div>';
  return html + "</section>";
};

SEITEN.uebergabe = function () {
  const team = spiel.teams[spiel.aktuell];
  return '<section class="seite mitte">' +
    '<p class="gross">🤫</p>' +
    "<h2>Gib das Gerät an <span class=\"name\">" + sicher(team.name) + "</span></h2>" +
    "<p>Die anderen schauen bitte weg, die Aufstellung ist geheim!</p>" +
    '<div class="knopfreihe"><button class="knopf haupt" data-aktion="ichBins">Ich bin ' + sicher(team.name) + "</button></div>" +
    "</section>";
};

SEITEN.ziehen = function () {
  const team = spiel.teams[spiel.aktuell];
  const kannZiehen = !team.gezogen && team.hand.length < EINST.maxHand;
  const kannTauschen = team.gezogen || team.hand.length >= EINST.maxHand ? !team.getauscht && team.hand.length >= EINST.tauschAb : false;
  let html = '<section class="seite"><h2>' + sicher(team.name) + ": neue Karte</h2>";
  if (kannZiehen) {
    html += "<p>Ziehe eine Karte vom Stapel und tippe den Namen ein.</p>" + sucheHtml("Name der gezogenen Karte …") + meldungHtml() +
      '<div class="knopfreihe"><button class="knopf" data-aktion="nichtZiehen">Stapel ist leer – überspringen</button></div>';
  } else if (ui.tauschKarte) {
    html += "<p>Du gibst <b>" + sicher(ALLE_SPIELER[ui.tauschKarte].name) + "</b> ab. Lege die Karte zurück in den Stapel, ziehe eine neue und tippe sie ein:</p>" +
      sucheHtml("Name der neuen Karte …") + meldungHtml() +
      '<div class="knopfreihe"><button class="knopf" data-aktion="tauschAbbrechen">Doch nicht tauschen</button></div>';
  } else {
    if (team.hand.length >= EINST.maxHand && !team.gezogen) html += "<p>Deine Hand ist voll (" + EINST.maxHand + " Karten). Du ziehst diesmal keine Karte.</p>";
    html += meldungHtml();
    if (kannTauschen) {
      html += '<div class="kasten"><h3>🔄 Tauschen? (freiwillig)</h3><p>Du hast ' + team.hand.length +
        " Karten und darfst einen Spieler abgeben und dafür einen neuen ziehen. Tippe auf die Karte, die du abgeben willst:</p>" +
        '<div class="karten">' + team.hand.map((id) => karteHtml(id, { aktion: "tauschWaehlen", klein: true })).join("") + "</div></div>";
    }
    const spielfrei = !partieVon(spiel.aktuell);
    html += (spielfrei ? "<p>😴 Du hast diesen Spieltag spielfrei – keine Aufstellung nötig.</p>" : "") +
      '<div class="knopfreihe"><button class="knopf haupt" data-aktion="zurAufstellung">' + (spielfrei ? "Weiter ▶" : "Weiter zur Aufstellung ▶") + "</button></div>";
  }
  return html + "</section>";
};

SEITEN.aufstellen = function () {
  const t = spiel.aktuell;
  const team = spiel.teams[t];
  const partie = partieVon(t);
  const gegner = partie.heim === t ? partie.gast : partie.heim;
  const verfuegbar = verfuegbareSpieler(t).length;
  const n = Math.min(teamGroesse(spiel.runde), verfuegbar);
  const geist = teamgeist(ui.auswahl);

  let html = '<section class="seite"><h2>' + sicher(team.name) + ": Aufstellung</h2>" +
    '<p class="leise">' + (partie.heim === t ? "Heimspiel" : "Auswärtsspiel") + " gegen " + teamName(gegner) +
    " · 📍 " + flagge(partie.ort) + " " + partie.stadt + " · 🌡️ " + partie.temp + " °C · " + partie.wetter + "</p>" +
    '<p class="zaehler">Wähle <b>' + n + "</b> Spieler: <b>" + ui.auswahl.length + " / " + n + "</b></p>";

  // Die gewählten Spieler mit Kapitänsbinde
  if (ui.auswahl.length) {
    html += '<div class="aufstellung-leiste">' + ui.auswahl.map((id) =>
      '<button class="chip' + (ui.kapitaen === id ? " kapitaen" : "") + '" data-aktion="kapitaen" data-wert="' + id + '" title="Zum Kapitän machen">' +
      (ui.kapitaen === id ? "© " : "") + ALLE_SPIELER[id].pos + " " + sicher(ALLE_SPIELER[id].name) + "</button>").join("") + "</div>" +
      '<p class="leise">Tippe oben auf einen Namen, um ihn zum Kapitän (+' + EINST.kapitaenBonus + " %) zu machen.</p>";
  }
  if (geist.gruppen.length) {
    html += '<p class="teamgeist">Teamgeist +' + Math.round(geist.bonus * 100) + " %: " + geist.gruppen.map((g) => g.text).join(" · ") + "</p>";
  }

  html += '<div class="karten">' + team.hand.map((id) => karteHtml(id, {
    aktion: "waehlen", gewaehlt: ui.auswahl.includes(id), kapitaen: ui.kapitaen === id, teamIndex: t,
  })).join("") + "</div>";

  html += meldungHtml();
  if (ui.tippsOffen) {
    html += '<div class="kasten tipps"><h3>💡 Tipps</h3><ul>' + tippsFuer(t).map((tipp) => "<li>" + sicher(tipp) + "</li>").join("") + "</ul></div>";
  }
  html += '<div class="knopfreihe">' +
    '<button class="knopf" data-aktion="tipps">💡 ' + (ui.tippsOffen ? "Tipps ausblenden" : "Tipp anzeigen") + "</button>" +
    '<button class="knopf" data-aktion="vorschlag">🪄 Vorschlag übernehmen</button>' +
    '<button class="knopf haupt" data-aktion="aufstellungFertig"' + (ui.auswahl.length === n && (ui.kapitaen || n === 0) ? "" : " disabled") + ">Fertig ▶</button></div>";
  if (ui.auswahl.length === n && !ui.kapitaen) html += '<p class="leise mitte">Wähle noch einen Kapitän (oben auf einen Namen tippen).</p>';
  return html + "</section>";
};

SEITEN.bestaetigen = function () {
  const t = spiel.aktuell;
  const team = spiel.teams[t];
  const ohneTorwart = !ui.auswahl.some((id) => ALLE_SPIELER[id].pos === "TW");
  const geist = teamgeist(ui.auswahl);
  const reihen = ["TW", "AB", "MF", "ST"].map((pos) => {
    const spieler = ui.auswahl.filter((id) => ALLE_SPIELER[id].pos === pos);
    return spieler.length ? '<div class="reihe">' + spieler.map((id) => karteHtml(id, { klein: true, kapitaen: ui.kapitaen === id })).join("") + "</div>" : "";
  }).reverse().join("");
  return '<section class="seite"><h2>' + sicher(team.name) + ": So soll es sein?</h2>" +
    '<div class="spielfeld">' + reihen + "</div>" +
    (ohneTorwart ? '<p class="meldung">🧤 Achtung: Kein Torwart! Dein abwehrstärkster Spieler muss ins Tor.</p>' : "") +
    (geist.gruppen.length ? '<p class="teamgeist">Teamgeist +' + Math.round(geist.bonus * 100) + " %: " + geist.gruppen.map((g) => g.text).join(" · ") + "</p>" : "") +
    '<div class="knopfreihe"><button class="knopf" data-aktion="aendern">✏️ Ändern</button>' +
    '<button class="knopf haupt" data-aktion="soSpielen">✅ So spielen</button></div></section>';
};

// Live-Ticker: zeigt nur die Spiele, in denen ein Mensch mitspielt (siehe livePartien).
// Die Spiele der Computer untereinander stehen danach in der Auswertung.
function tickerPartien() {
  return livePartien();
}

function aktuellePartie() {
  return tickerPartien()[ui.spielNr];
}

// "heim" oder "gast" – bestimmt die Farbe (Heim blau, Gast orange)
function seiteVon(partie, teamIndex) {
  return teamIndex === partie.heim ? "heim" : "gast";
}

function aufstellungListe(partie, t) {
  const ids = partie.aufstellung[t] || [];
  return '<div class="aufstellung-team ' + seiteVon(partie, t) + '"><h3>' + teamName(t) + "</h3>" +
    '<ul class="liste-aufstellung">' + ids.map((id) => {
      const sp = ALLE_SPIELER[id];
      return "<li><span class=\"pos-mini pos-" + sp.pos + "\">" + sp.pos + "</span> " + flagge(sp.land) + " " + sicher(sp.name) +
        (partie.kapitaen[t] === id ? " ©" : "") + "</li>";
    }).join("") + "</ul>" +
    (partie.teamgeist && partie.teamgeist[t].length ? '<p class="teamgeist klein">' + partie.teamgeist[t].join(" · ") + "</p>" : "") +
    "</div>";
}

function bildFuerTor(art) {
  return "bilder/tor-" + (art === "fernschuss" ? "schuss" : art) + ".svg";
}

// Mini-Tabelle mit allen bisherigen Toren: Minute, Torschütze, Vorlage, Verein
function torUebersicht(partie, sichtbar) {
  const tore = sichtbar.filter((e) => e.typ === "tor");
  let html = '<aside class="tor-uebersicht"><h3>⚽ Tore</h3>';
  if (!tore.length) return html + '<p class="leise">Noch keine Tore.</p></aside>';
  html += '<div class="tabelle-rahmen"><table class="tabelle klein"><thead><tr><th>Min</th><th>Torschütze</th><th>Vorlage</th><th>Verein</th></tr></thead><tbody>';
  for (const e of tore) {
    const schuetze = ALLE_SPIELER[e.spieler];
    const verein = vereinKurz(schuetze.verein);
    html += '<tr class="' + seiteVon(partie, e.team) + '"><td>' + e.minute + "'</td>" +
      '<td class="team-spalte"><b>' + sicher(schuetze.name) + "</b>" + (verein && verein !== "?" ? "<br><small>" + sicher(verein) + "</small>" : "") + "</td>" +
      '<td class="team-spalte">' + (e.vorlage ? sicher(ALLE_SPIELER[e.vorlage].name) : "–") + "</td>" +
      '<td class="team-spalte"><span class="team-punkt"></span>' + teamName(e.team) + "</td></tr>";
  }
  return html + "</tbody></table></div></aside>";
}

// Halbzeit: Knopf "Spieler wechseln" mit Countdown oder die Auswahl für den Wechsel
function wechselHtml(partie) {
  if (!ui.inHalbzeit) return "";
  if (ui.wechselDialog) {
    const d = ui.wechselDialog;
    const bank = ersatzbank(partie, d.team);
    return '<div class="kasten wechsel ' + seiteVon(partie, d.team) + '">' +
      "<h3>🔄 " + teamName(d.team) + ": Spieler wechseln</h3>" +
      "<p><b>1. Wer geht raus?</b></p>" +
      '<div class="karten">' + partie.aufstellung[d.team].map((id) =>
        karteHtml(id, { aktion: "wechselRaus", gewaehlt: d.raus === id, klein: true, kapitaen: partie.kapitaen[d.team] === id })).join("") + "</div>" +
      "<p><b>2. Wer kommt rein?</b></p>" +
      (bank.length ? '<div class="karten">' + bank.map((id) =>
        karteHtml(id, { aktion: "wechselRein", gewaehlt: d.rein === id, klein: true })).join("") + "</div>"
        : '<p class="leise">Auf deiner Bank sitzt niemand, der spielen kann.</p>') +
      '<div class="knopfreihe"><button class="knopf" data-aktion="wechselAbbrechen">Abbrechen</button>' +
      '<button class="knopf haupt" data-aktion="wechselBestaetigen"' + (d.raus && d.rein ? "" : " disabled") + ">✅ Wechseln</button></div></div>";
  }
  if (ui.wechselAktiv !== null) {
    return '<div class="kasten wechsel-angebot ' + seiteVon(partie, ui.wechselAktiv) + '">' +
      '<button class="knopf haupt gross-knopf" data-aktion="wechselStarten">🔄 Spieler wechseln – ' + sicher(spiel.teams[ui.wechselAktiv].name) + "</button>" +
      '<p class="countdown">Noch <b>' + ui.wechselRest + "</b> Sekunden</p>" +
      '<button class="knopf" data-aktion="keinWechsel">Kein Wechsel</button></div>';
  }
  return "";
}

SEITEN.spiele = function () {
  const liste = tickerPartien();
  const partie = liste[ui.spielNr];
  const sichtbar = partie.ereignisse.slice(0, ui.tickerIndex);
  const fertig = ui.tickerIndex >= partie.ereignisse.length && partie.haelfte === 2 && !ui.inHalbzeit;
  const toreH = sichtbar.filter((e) => e.typ === "tor" && e.team === partie.heim).length;
  const toreG = sichtbar.filter((e) => e.typ === "tor" && e.team === partie.gast).length;
  const letztes = sichtbar[sichtbar.length - 1];
  const minute = letztes ? letztes.minute : 0;
  // Hat gerade jemand getroffen? Dann leuchtet seine Seite der Anzeigetafel auf.
  const jubel = letztes && letztes.typ === "tor" && !fertig ? seiteVon(partie, letztes.team) : "";

  const ticker = [...sichtbar].reverse().map((e) => {
    let kopf = "";
    let bilder = "";
    if (e.typ === "tor") {
      kopf = '<strong class="tor-team">⚽ TOR für ' + teamName(e.team) + "!</strong>";
      bilder = '<div class="tor-bilder"><img src="' + bildFuerTor(e.art) + '" alt="Tor">' +
        (e.vorlage ? '<img src="bilder/vorlage.svg" alt="Vorlage">' : "") + "</div>";
    }
    const seite = e.team !== undefined ? " von-" + seiteVon(partie, e.team) : "";
    return '<li class="ereignis ' + e.typ + seite + '"><span class="minute">' + (e.minute ? e.minute + "'" : "") + "</span><div>" +
      kopf + sicher(e.text) + bilder + "</div></li>";
  }).join("");

  let anzeige;
  if (fertig) anzeige = partie.elfmeter ? "n. E. " + partie.elfmeter.heim + ":" + partie.elfmeter.gast : "Abpfiff";
  else if (ui.inHalbzeit) anzeige = "⏸️ Halbzeitpause" + (ui.pauseRest > 0 && ui.wechselAktiv === null && !ui.wechselDialog ? " – weiter in " + ui.pauseRest + " Sek." : "");
  else anzeige = minute + ". Minute";

  const naechster = ui.spielNr + 1 < liste.length
    ? '<button class="knopf haupt" data-aktion="naechstesSpiel">Nächstes Spiel ▶</button>'
    : '<button class="knopf haupt" data-aktion="zurAuswertung">Zur Auswertung ▶</button>';
  const andere = spiel.runden[spiel.runde].partien.length - liste.length;

  return '<section class="seite">' +
    '<p class="leise mitte">Spiel ' + (ui.spielNr + 1) + " von " + liste.length + " · 📍 " + flagge(partie.ort) + " " + partie.stadt + " · " + partie.temp + " °C " + partie.wetter + "</p>" +
    '<div class="anzeigetafel">' +
    '<span class="tafel-team heim' + (jubel === "heim" ? " jubel" : "") + '"><small>HEIM</small>' + teamName(partie.heim) + "</span>" +
    '<span class="tafel-stand"><span class="heim-zahl">' + toreH + '</span> : <span class="gast-zahl">' + toreG + "</span></span>" +
    '<span class="tafel-team gast' + (jubel === "gast" ? " jubel" : "") + '"><small>GAST</small>' + teamName(partie.gast) + "</span>" +
    '<span class="tafel-minute">' + anzeige + "</span>" +
    "</div>" +
    wechselHtml(partie) +
    '<div class="spiel-layout">' +
    '<div class="spiel-haupt">' +
    '<div class="aufstellungen">' + aufstellungListe(partie, partie.heim) + aufstellungListe(partie, partie.gast) + "</div>" +
    '<ul class="ticker">' + ticker + "</ul>" +
    "</div>" +
    torUebersicht(partie, sichtbar) +
    "</div>" +
    '<div class="knopfreihe">' + (fertig ? naechster
      : ui.wechselAktiv !== null || ui.wechselDialog ? "" : '<button class="knopf" data-aktion="ueberspringen">⏩ Überspringen</button>') + "</div>" +
    (fertig && andere > 0 && ui.spielNr + 1 >= liste.length ? '<p class="leise">Die anderen ' + andere + " Spiele dieses Spieltags seht ihr in der Auswertung.</p>" : "") +
    "</section>";
};

SEITEN.auswertung = function () {
  const runde = spiel.runden[spiel.runde];
  const tab = tabelle();
  let html = '<section class="seite"><h2>' + (spiel.finale ? "🏆 Finale – Ergebnis" : "Spieltag " + spiel.runde + " – Ergebnisse") + "</h2>";

  // Ergebnisse
  html += '<div class="ergebnisse">';
  for (const p of runde.partien) {
    const torschuetzen = p.ereignisse.filter((e) => e.typ === "tor").map((e) =>
      e.minute + "' " + sicher(ALLE_SPIELER[e.spieler].name) + (e.vorlage ? " (" + sicher(ALLE_SPIELER[e.vorlage].name) + ")" : ""));
    html += '<div class="ergebnis"><span>' + teamName(p.heim) + '</span><b>' + p.toreHeim + " : " + p.toreGast + "</b><span>" + teamName(p.gast) + "</span>" +
      (p.elfmeter ? '<small class="voll">nach Elfmeterschießen ' + p.elfmeter.heim + ":" + p.elfmeter.gast + "</small>" : "") +
      (torschuetzen.length ? '<small class="voll">⚽ ' + torschuetzen.join(" · ") + "</small>" : "") + "</div>";
  }
  html += "</div>";

  // Persönliche Auswertung für jeden Menschen
  spiel.teams.forEach((team, i) => {
    if (!team.mensch) return;
    const p = partieVon(i);
    if (!p) {
      if (!spiel.finale) html += '<div class="kasten persoenlich remis"><h3>' + sicher(team.name) + "</h3><p>😴 Du hattest diesen Spieltag spielfrei.</p></div>";
      return;
    }
    const eigene = p.heim === i ? p.toreHeim : p.toreGast;
    const fremde = p.heim === i ? p.toreGast : p.toreHeim;
    const sieger = siegerVon(p);
    let satz = sieger === i ? textBauen(TEXTE.sieg, {}) : sieger === null ? textBauen(TEXTE.unentschieden, {}) : textBauen(TEXTE.niederlage, {});
    if (sieger === i && eigene - fremde >= 3) satz = TEXTE.hoherSieg;
    if (sieger !== i && sieger !== null && fremde - eigene >= 3) satz = TEXTE.hoheNiederlage;
    let platzText = "";
    if (!spiel.finale) {
      const vorher = spiel.tabelleVorher.indexOf(i) + 1;
      const jetzt = tab.findIndex((z) => z.team === i) + 1;
      if (jetzt < vorher) platzText = "⬆️ Du kletterst von Platz " + vorher + " auf Platz " + jetzt + "!";
      else if (jetzt > vorher) platzText = "⬇️ Du rutschst von Platz " + vorher + " auf Platz " + jetzt + ".";
      else platzText = "➡️ Du bleibst auf Platz " + jetzt + ".";
      if (spiel.runde === 1) platzText = "Du stehst auf Platz " + jetzt + ".";
    }
    html += '<div class="kasten persoenlich ' + (sieger === i ? "sieg" : sieger === null ? "remis" : "niederlage") + '">' +
      "<h3>" + sicher(team.name) + "</h3><p>" + satz + "</p>" + (platzText ? "<p><b>" + platzText + "</b></p>" : "") + "</div>";
  });

  // Verletzte fürs nächste Spiel
  const verletzt = Object.keys(spiel.status).filter((id) => spiel.status[id].verletztFuer === spiel.runde + 1 && besitzerVon(id) >= 0);
  if (verletzt.length) {
    html += '<p class="leise">🤕 Verletzt im nächsten Spiel: ' + verletzt.map((id) => sicher(ALLE_SPIELER[id].name) + " (" + sicher(spiel.teams[besitzerVon(id)].name) + ")").join(", ") + "</p>";
  }

  html += '<div class="zwei-spalten"><div>' + tabelleHtml(tab) + "</div><div>" + scorerHtml() + "</div></div>";

  const knopf = spiel.finale ? '<button class="knopf haupt" data-aktion="zumPokal">🏆 Zur Pokalübergabe</button>'
    : spiel.runde >= spiel.spielplan.length ? '<button class="knopf haupt" data-aktion="naechsteRunde">🏆 Zum Finale!</button>'
    : '<button class="knopf haupt" data-aktion="naechsteRunde">Weiter zu Spieltag ' + (spiel.runde + 1) + " ▶</button>";
  return html + '<div class="knopfreihe">' + knopf + "</div></section>";
};

function tabelleHtml(tab) {
  const vorher = spiel.tabelleVorher || [];
  return '<h3>Tabelle</h3><div class="tabelle-rahmen"><table class="tabelle"><thead><tr><th>#</th><th></th><th>Team</th><th>Sp</th><th>S-U-N</th><th>Tore</th><th>Pkt</th></tr></thead><tbody>' +
    tab.map((z, platz) => {
      const alt = vorher.indexOf(z.team);
      const pfeil = alt < 0 || spiel.runde === 1 ? "" : alt > platz ? '<span class="hoch">▲</span>' : alt < platz ? '<span class="runter">▼</span>' : '<span class="gleich">●</span>';
      return '<tr class="' + (spiel.teams[z.team].mensch ? "mensch" : "") + '"><td>' + (platz + 1) + "</td><td>" + pfeil + "</td><td class=\"team-spalte\">" + teamName(z.team) +
        "</td><td>" + z.spiele + "</td><td>" + z.s + "-" + z.u + "-" + z.n + "</td><td>" + z.tore + ":" + z.gegentore + "</td><td><b>" + z.punkte + "</b></td></tr>";
    }).join("") + "</tbody></table></div>";
}

function scorerHtml() {
  const liste = scorerListe().slice(0, 10);
  if (!liste.length) return "<h3>Scorerliste</h3><p class=\"leise\">Noch keine Tore.</p>";
  return '<h3>Scorerliste</h3><div class="tabelle-rahmen"><table class="tabelle"><thead><tr><th>Spieler</th><th>Team</th><th title="Tore">⚽</th><th title="Vorlagen">👟</th><th>Pkt</th></tr></thead><tbody>' +
    liste.map((s) => "<tr><td class=\"team-spalte\">" + flagge(ALLE_SPIELER[s.id].land) + " " + sicher(ALLE_SPIELER[s.id].name) + "</td><td class=\"team-spalte\">" + (s.team >= 0 ? teamName(s.team) : "–") +
      "</td><td>" + s.tore + "</td><td>" + s.vorlagen + "</td><td><b>" + s.punkte + "</b></td></tr>").join("") +
    "</tbody></table></div><p class=\"leise\">Tor = 1 Punkt, Vorlage = 1 Punkt</p>";
}

SEITEN.pokal = function () {
  const meister = spiel.meister;
  const top = scorerListe()[0];
  return '<section class="seite mitte pokal-seite">' +
    '<div class="konfetti" aria-hidden="true">' + "🎊🎉⚽🏆🎊🎉⚽".split("").filter((z) => z.trim()).map((z, i) => '<span style="--i:' + i + '">' + z + "</span>").join("") + "</div>" +
    '<img src="bilder/pokal.svg" alt="Pokal" class="pokal-bild">' +
    "<h2>" + teamName(meister) + "</h2>" +
    '<p class="gross-text">ist Meister des Liga-Simulators!</p>' +
    (top ? "<p>👑 Torschützenkönig: <b>" + sicher(ALLE_SPIELER[top.id].name) + "</b> mit " + top.tore + " Toren und " + top.vorlagen + " Vorlagen</p>" : "") +
    tabelleHtml(tabelle()) +
    '<div class="knopfreihe"><button class="knopf haupt" data-aktion="neuesSpielJa">⚽ Neue Saison</button></div></section>';
};

SEITEN.einstellungen = function () {
  let felder = "";
  for (const name in EINSTELLUNGEN_LISTE) {
    const e = EINSTELLUNGEN_LISTE[name];
    felder += '<label class="einstellung"><span>' + e.text + '</span><input type="number" id="einst-' + name + '" min="' + e.min + '" max="' + e.max + '" value="' + EINST[name] + '"></label>';
  }
  return '<section class="seite"><h2>⚙️ Einstellungen</h2>' +
    '<p class="leise">Hier stellt ihr die Spielregeln ein. Änderungen gelten sofort, auch im laufenden Spiel.</p>' +
    '<div class="einstellungen">' + felder + "</div>" + meldungHtml() +
    '<div class="knopfreihe"><button class="knopf" data-aktion="einstellungenStandard">Standardwerte</button>' +
    '<button class="knopf haupt" data-aktion="einstellungenSpeichern">Speichern & zurück</button></div></section>';
};


// ---------------------------------------------------------------------
// ANZEIGEN
// ---------------------------------------------------------------------
let seiteVorEinstellungen = "start";

function zeige() {
  document.getElementById("app").innerHTML = kopfHtml() + '<main class="inhalt">' + SEITEN[ui.seite]() + "</main>";
  if (spiel && !["start", "einrichten", "einstellungen"].includes(ui.seite)) {
    spiel.phase = ui.seite;
    spielSpeichern();
  }
  const suche = document.getElementById("suche");
  if (suche) suche.focus();
}

function gehe(seite) {
  ui.seite = seite;
  ui.meldung = "";
  zeige();
  window.scrollTo(0, 0);
}


// ---------------------------------------------------------------------
// ABLAUF: wer ist als Nächstes dran?
// ---------------------------------------------------------------------
// Nächster Mensch, der in dieser Runde aufstellen muss – oder alle Spiele starten
function naechsterMensch() {
  const liste = menschenDieserRunde();
  const position = liste.indexOf(spiel.aktuell);
  if (position + 1 < liste.length) {
    spiel.aktuell = liste[position + 1];
    gehe("uebergabe");
  } else {
    spieltagSpielen();
    ui.spielNr = 0;
    tickerStarten();
  }
}

function tickerStarten() {
  clearTimeout(ui.tickerUhr);
  ui.tickerIndex = 0;
  ui.inHalbzeit = false;
  ui.pauseRest = 0;
  ui.wechselWarteschlange = [];
  ui.wechselAktiv = null;
  ui.wechselDialog = null;
  gehe("spiele");
  tickerWeiter();
}

// Plant den nächsten Ticker-Schritt (in der Halbzeit jede Sekunde)
function tickerWeiter() {
  clearTimeout(ui.tickerUhr);
  if (ui.wechselDialog) return; // die Uhr steht, solange jemand wechselt
  const partie = aktuellePartie();
  if (ui.inHalbzeit) ui.tickerUhr = setTimeout(tickerSchritt, 1000);
  else if (ui.tickerIndex < partie.ereignisse.length) ui.tickerUhr = setTimeout(tickerSchritt, tickerPause());
}

// Jede Halbzeit dauert etwa die Hälfte der eingestellten Ticker-Zeit
function tickerPause() {
  const partie = aktuellePartie();
  const halbzeitIndex = partie.ereignisse.findIndex((e) => e.typ === "halbzeit");
  const anzahl = ui.tickerIndex <= halbzeitIndex ? halbzeitIndex + 1 : partie.ereignisse.length - halbzeitIndex - 1;
  return (EINST.tickerSekunden * 500) / Math.max(1, anzahl);
}

function tickerSchritt() {
  const partie = aktuellePartie();
  if (ui.inHalbzeit) {
    const vorher = ui.wechselAktiv;
    if (ui.pauseRest > 0) ui.pauseRest--;
    if (ui.wechselAktiv !== null) {
      ui.wechselRest--;
      if (ui.wechselRest <= 0) naechstesWechselFenster();
    }
    if (ui.wechselAktiv === null && ui.pauseRest <= 0) halbzeitBeenden(partie);
    // Hat sich nur die Sekundenzahl geändert, wird nur sie neu geschrieben.
    // So bleibt der Knopf stehen und ein Tippen geht nicht verloren.
    if (ui.inHalbzeit && vorher === ui.wechselAktiv && ui.seite === "spiele") {
      const zahl = document.querySelector(".countdown b");
      if (zahl) zahl.textContent = ui.wechselRest;
      const tafel = document.querySelector(".tafel-minute");
      if (tafel && ui.wechselAktiv === null) tafel.textContent = "⏸️ Halbzeitpause – weiter in " + ui.pauseRest + " Sek.";
      tickerWeiter();
      return;
    }
  } else {
    ui.tickerIndex++;
    const letztes = partie.ereignisse[ui.tickerIndex - 1];
    if (letztes && letztes.typ === "halbzeit") halbzeitBeginnen(partie);
  }
  if (ui.seite === "spiele") zeige();
  tickerWeiter();
}

// Halbzeitpause beginnt: Menschen dürfen wechseln – erst Heim, dann Gast
function halbzeitBeginnen(partie) {
  ui.inHalbzeit = true;
  ui.pauseRest = EINST.halbzeitSekunden;
  // Nur solange die 2. Halbzeit noch nicht gerechnet ist (z. B. nicht nach dem Neuladen)
  ui.wechselWarteschlange = partie.haelfte < 2 ? [partie.heim, partie.gast].filter((t) => spiel.teams[t].mensch) : [];
  naechstesWechselFenster();
}

function naechstesWechselFenster() {
  ui.wechselAktiv = ui.wechselWarteschlange.length ? ui.wechselWarteschlange.shift() : null;
  ui.wechselRest = EINST.wechselSekunden;
}

// Halbzeitpause vorbei: jetzt erst wird die 2. Halbzeit gerechnet (mit den Wechseln)
function halbzeitBeenden(partie) {
  ui.inHalbzeit = false;
  ui.wechselAktiv = null;
  ui.wechselDialog = null;
  ui.wechselWarteschlange = [];
  ui.pauseRest = 0;
  if (partie.haelfte < 2) halbzeitSimulieren(partie, 2);
}

function aufstellungBeginnen() {
  ui.auswahl = [];
  ui.kapitaen = null;
  ui.tippsOffen = false;
  ui.tauschKarte = null;
  const team = spiel.teams[spiel.aktuell];
  const ziehenMoeglich = !spiel.finale && spiel.runde > 1;
  if (ziehenMoeglich && (team.hand.length < EINST.maxHand || team.hand.length >= EINST.tauschAb)) gehe("ziehen");
  else if (partieVon(spiel.aktuell)) gehe("aufstellen");
  else naechsterMensch(); // spielfrei und nichts zu ziehen
}

// Eine Karte zur Hand des aktuellen Menschen hinzufügen
function karteAufnehmen(id) {
  const fehler = karteDarfAufgenommenWerden(id);
  if (fehler) { ui.meldung = "⚠️ " + fehler; zeige(); return false; }
  spiel.teams[spiel.aktuell].hand.push(id);
  ui.meldung = "✅ " + sicher(ALLE_SPIELER[id].name) + " ist jetzt in deinem Team!";
  return true;
}


// ---------------------------------------------------------------------
// AKTIONEN – was bei einem Klick passiert
// ---------------------------------------------------------------------
const AKTIONEN = {
  zumStart() { clearTimeout(ui.tickerUhr); ui.neuBestaetigen = false; gehe("start"); },
  fortsetzen() {
    ui.auswahl = []; ui.kapitaen = null;
    if (spiel.phase === "spiele") { ui.spielNr = 0; tickerStarten(); return; }
    if (spiel.phase === "bestaetigen") spiel.phase = "aufstellen";
    gehe(spiel.phase || "vorschau");
  },
  neuesSpiel() {
    if (spiel) { ui.neuBestaetigen = true; zeige(); } else gehe("einrichten");
  },
  neuesSpielJa() { spielLoeschen(); ui.neuBestaetigen = false; gehe("einrichten"); },
  neuesSpielNein() { ui.neuBestaetigen = false; zeige(); },
  level(wert) {
    // Namen merken, damit sie beim Neuzeichnen nicht verloren gehen
    const namen = [0, 1, 2, 3, 4].map((i) => document.getElementById("name" + i).value);
    EINST.computerLevel = Number(wert);
    einstellungenSpeichern();
    zeige();
    namen.forEach((n, i) => { document.getElementById("name" + i).value = n; });
  },
  einrichtenFertig() {
    const namen = [0, 1, 2, 3, 4].map((i) => document.getElementById("name" + i).value.trim()).filter((n) => n);
    if (!namen.length) { ui.meldung = "Bitte mindestens einen Namen eintragen."; zeige(); return; }
    neuesSpiel(namen);
    spiel.aktuell = 0;
    gehe("startkarten");
  },
  karteNehmen(id) {
    if (ui.seite === "startkarten") {
      karteAufnehmen(id);
      zeige();
    } else if (ui.seite === "ziehen") {
      const team = spiel.teams[spiel.aktuell];
      if (ui.tauschKarte) {
        if (!karteAufnehmen(id)) return;
        team.hand = team.hand.filter((k) => k !== ui.tauschKarte);
        status(ui.tauschKarte).inFolge = 0;
        ui.meldung = "🔄 Getauscht: " + sicher(ALLE_SPIELER[ui.tauschKarte].name) + " geht, " + sicher(ALLE_SPIELER[id].name) + " kommt!";
        ui.tauschKarte = null;
        team.getauscht = true;
      } else {
        if (!karteAufnehmen(id)) return;
        team.gezogen = true;
      }
      zeige();
    }
  },
  karteEntfernen(id) {
    const team = spiel.teams[spiel.aktuell];
    team.hand = team.hand.filter((k) => k !== id);
    if (team.heimat && !team.hand.some((k) => ALLE_SPIELER[k].land === team.heimat)) team.heimat = null;
    ui.meldung = "";
    zeige();
  },
  heimat(land) { spiel.teams[spiel.aktuell].heimat = land; zeige(); },
  startkartenFertig() {
    const naechster = spiel.teams.findIndex((t, i) => t.mensch && i > spiel.aktuell);
    if (naechster >= 0) {
      spiel.aktuell = naechster;
      gehe("startkarten");
    } else {
      computerStartkarten();
      spielplanErstellen();
      spiel.runde = 1;
      rundeVorbereiten();
      gehe("vorschau");
    }
  },
  vorschauWeiter() {
    const liste = menschenDieserRunde();
    if (!liste.length) { spieltagSpielen(); ui.spielNr = 0; tickerStarten(); return; }
    spiel.aktuell = liste[0];
    gehe("uebergabe");
  },
  ichBins() { aufstellungBeginnen(); },
  nichtZiehen() { spiel.teams[spiel.aktuell].gezogen = true; ui.meldung = ""; zeige(); },
  tauschWaehlen(id) { ui.tauschKarte = id; ui.meldung = ""; zeige(); },
  tauschAbbrechen() { ui.tauschKarte = null; ui.meldung = ""; zeige(); },
  zurAufstellung() {
    if (partieVon(spiel.aktuell)) gehe("aufstellen");
    else naechsterMensch(); // spielfrei: kein Aufstellen nötig
  },
  waehlen(id) {
    if (istVerletzt(id)) { ui.meldung = "🤕 " + sicher(ALLE_SPIELER[id].name) + " ist verletzt und kann heute nicht spielen."; zeige(); return; }
    const n = Math.min(teamGroesse(spiel.runde), verfuegbareSpieler(spiel.aktuell).length);
    ui.meldung = "";
    if (ui.auswahl.includes(id)) {
      ui.auswahl = ui.auswahl.filter((k) => k !== id);
      if (ui.kapitaen === id) ui.kapitaen = null;
    } else if (ui.auswahl.length < n) {
      ui.auswahl.push(id);
    } else {
      ui.meldung = "Du hast schon " + n + " Spieler. Tippe erst einen ausgewählten Spieler an, um ihn auf die Bank zu setzen.";
    }
    zeige();
  },
  kapitaen(id) { ui.kapitaen = id; zeige(); },
  tipps() { ui.tippsOffen = !ui.tippsOffen; zeige(); },
  vorschlag() {
    const v = besteAufstellung(spiel.aktuell);
    ui.auswahl = v.ids;
    ui.kapitaen = v.kapitaen;
    zeige();
  },
  aufstellungFertig() { gehe("bestaetigen"); },
  aendern() { gehe("aufstellen"); },
  soSpielen() {
    aufstellungSpeichern(spiel.aktuell, [...ui.auswahl], ui.kapitaen);
    naechsterMensch();
  },
  ueberspringen() {
    const partie = aktuellePartie();
    const halbzeitIndex = partie.ereignisse.findIndex((e) => e.typ === "halbzeit");
    if (!ui.inHalbzeit && ui.tickerIndex <= halbzeitIndex) {
      // In der 1. Halbzeit: direkt zur Halbzeit springen – wechseln bleibt möglich
      ui.tickerIndex = halbzeitIndex + 1;
      halbzeitBeginnen(partie);
      ui.pauseRest = 0;
    }
    if (ui.wechselAktiv === null) {
      // Niemand darf (mehr) wechseln → bis zum Abpfiff springen
      halbzeitBeenden(partie);
      ui.tickerIndex = partie.ereignisse.length;
    }
    zeige();
    tickerWeiter();
  },
  wechselStarten() {
    ui.wechselDialog = { team: ui.wechselAktiv, raus: null, rein: null };
    tickerWeiter(); // hält die Uhr an
    zeige();
  },
  wechselRaus(id) { ui.wechselDialog.raus = id; zeige(); },
  wechselRein(id) { ui.wechselDialog.rein = id; zeige(); },
  wechselBestaetigen() {
    const d = ui.wechselDialog;
    spielerWechseln(aktuellePartie(), d.team, d.raus, d.rein);
    ui.wechselDialog = null;
    naechstesWechselFenster();
    zeige();
    tickerWeiter();
  },
  wechselAbbrechen() {
    ui.wechselDialog = null;
    naechstesWechselFenster();
    zeige();
    tickerWeiter();
  },
  keinWechsel() { naechstesWechselFenster(); zeige(); },
  naechstesSpiel() { ui.spielNr++; tickerStarten(); },
  zurAuswertung() {
    spieltagAbschliessen(); // fehlende 2. Halbzeiten rechnen, Müdigkeit zählen
    gehe("auswertung");
  },
  naechsteRunde() {
    if (spiel.runde >= spiel.spielplan.length) {
      // Saison vorbei → Finale Platz 1 gegen Platz 2
      const tab = tabelle();
      spiel.finale = [tab[0].team, tab[1].team];
    }
    spiel.runde++;
    rundeVorbereiten();
    gehe("vorschau");
  },
  zumPokal() {
    spiel.meister = siegerVon(spiel.runden[spiel.runde].partien[0]);
    gehe("pokal");
  },
  einstellungen() {
    clearTimeout(ui.tickerUhr);
    if (ui.seite !== "einstellungen") seiteVorEinstellungen = ui.seite;
    gehe("einstellungen");
  },
  einstellungenSpeichern() {
    for (const name in EINSTELLUNGEN_LISTE) {
      const e = EINSTELLUNGEN_LISTE[name];
      const wert = Number(document.getElementById("einst-" + name).value);
      EINST[name] = Math.min(e.max, Math.max(e.min, isNaN(wert) ? e.wert : wert));
    }
    einstellungenSpeichern();
    if (seiteVorEinstellungen === "spiele") { tickerStarten(); return; }
    gehe(seiteVorEinstellungen);
  },
  einstellungenStandard() { einstellungenZuruecksetzen(); ui.meldung = "Standardwerte geladen."; zeige(); },
};


// ---------------------------------------------------------------------
// START
// ---------------------------------------------------------------------
document.addEventListener("click", (ereignis) => {
  const element = ereignis.target.closest("[data-aktion]");
  if (!element || element.disabled) return;
  AKTIONEN[element.dataset.aktion](element.dataset.wert);
});

document.addEventListener("input", (ereignis) => {
  if (ereignis.target.id === "suche") vorschlaegeAktualisieren();
});

// Enter im Suchfeld = ersten Vorschlag nehmen
document.addEventListener("keydown", (ereignis) => {
  if (ereignis.key === "Enter" && ereignis.target.id === "suche") {
    const erster = document.querySelector(".vorschlag");
    if (erster) erster.click();
  }
});

spielLaden();
zeige();
