// =====================================================================
// EINSTELLUNGEN – alle Spielregeln, die ihr verändern könnt
// =====================================================================
// Jede Einstellung hat:
//   wert  = Standardwert
//   text  = Beschriftung auf der Einstellungsseite
//   min / max = erlaubter Bereich
// Die Einstellungsseite im Spiel wird automatisch aus dieser Liste gebaut.
// Neue Regel? Hier eine Zeile ergänzen und im Code EINST.name benutzen.
// =====================================================================

const EINSTELLUNGEN_LISTE = {
  startKarten:        { wert: 6,  min: 3, max: 11, text: "Startkarten pro Spieler (X)" },
  maxHand:            { wert: 14, min: 5, max: 20, text: "Maximale Handkarten (y)" },
  teamKlein:          { wert: 5,  min: 3, max: 11, text: "Teamgröße am Anfang (b)" },
  teamMittelAb:       { wert: 4,  min: 1, max: 34, text: "Ab Runde … größeres Team (d)" },
  teamMittel:         { wert: 7,  min: 3, max: 11, text: "Größeres Team (e)" },
  teamGrossAb:        { wert: 8,  min: 1, max: 34, text: "Ab Runde … volles Team (f)" },
  teamGross:          { wert: 11, min: 3, max: 11, text: "Volles Team (g)" },
  tauschAb:           { wert: 8,  min: 1, max: 20, text: "Tauschen erlaubt ab … Handkarten (h)" },
  muedeAb:            { wert: 4,  min: 2, max: 10, text: "Müde ab dem … Spiel in Folge (i)" },
  verletzungAlle:     { wert: 4,  min: 0, max: 20, text: "Zufallsverletzung alle … Runden (j, 0 = aus)" },
  tippWarnungAb:      { wert: 3,  min: 1, max: 10, text: "Tipp warnt nach … Spielen in Folge (k)" },
  spieltage:          { wert: 14, min: 2, max: 34, text: "Spieltage pro Saison" },
  tageZwischen:       { wert: 7,  min: 1, max: 14, text: "Tage zwischen zwei Spieltagen" },
  computerLevel:      { wert: 2,  min: 1, max: 3,  text: "Computer-Level (1 leicht, 2 mittel, 3 schwer)" },
  kapitaenBonus:      { wert: 10, min: 0, max: 50, text: "Kapitän-Bonus in %" },
  heimBonus:          { wert: 5,  min: 0, max: 30, text: "Heimvorteil in %" },
  heimatBonus:        { wert: 10, min: 0, max: 30, text: "Bonus im eigenen Land / Vereinsland in %" },
  feiertagMalus:      { wert: 50, min: 0, max: 100, text: "Feiertag am Spieltag: Abzug in %" },
  feiertagDanachMalus:{ wert: 20, min: 0, max: 100, text: "Tag nach dem Feiertag: Abzug in %" },
  tickerSekunden:     { wert: 20, min: 3, max: 90, text: "Dauer des Live-Tickers in Sekunden" },
};

// EINST enthält die aktuell gültigen Werte, z. B. EINST.startKarten
let EINST = {};

function einstellungenLaden() {
  // Erst alle Standardwerte nehmen …
  for (const name in EINSTELLUNGEN_LISTE) {
    EINST[name] = EINSTELLUNGEN_LISTE[name].wert;
  }
  // … dann gespeicherte Werte darüberlegen (falls vorhanden)
  try {
    const gespeichert = JSON.parse(localStorage.getItem("liga-einstellungen") || "{}");
    for (const name in gespeichert) {
      if (name in EINST) EINST[name] = gespeichert[name];
    }
  } catch (fehler) {
    // Speicher nicht verfügbar (z. B. privates Fenster) – dann eben Standardwerte
  }
}

function einstellungenSpeichern() {
  try {
    localStorage.setItem("liga-einstellungen", JSON.stringify(EINST));
  } catch (fehler) {}
}

function einstellungenZuruecksetzen() {
  try { localStorage.removeItem("liga-einstellungen"); } catch (fehler) {}
  einstellungenLaden();
}

// Wie viele Spieler braucht man in Runde r?
function teamGroesse(runde) {
  if (runde >= EINST.teamGrossAb) return EINST.teamGross;
  if (runde >= EINST.teamMittelAb) return EINST.teamMittel;
  return EINST.teamKlein;
}

einstellungenLaden();
