// =====================================================================
// TEXTE – Bausteine für Live-Ticker, Spielberichte und Auswertungen
// =====================================================================
// Platzhalter in geschweiften Klammern werden im Spiel ersetzt:
//   {spieler} {vorlage} {team} {gegner} {torwart} {stadt}
// Mehr Abwechslung? Einfach weitere Sätze in die Listen schreiben!
// =====================================================================

const TEXTE = {
  anpfiff: [
    "Anpfiff in {stadt}! Die Fans sind laut, es kann losgehen!",
    "Der Ball rollt in {stadt}! Wer holt sich heute die drei Punkte?",
    "Los geht's! {stadt} bebt vor Vorfreude.",
  ],
  halbzeit: [
    "Halbzeit! Kurz durchschnaufen, Wasser trinken.",
    "Pause! Die Trainer haben jetzt viel zu erklären.",
  ],
  abpfiff: [
    "Abpfiff! Das Spiel ist aus.",
    "Schluss, aus, vorbei! Der Schiedsrichter pfeift ab.",
  ],

  // Tore, je nach Art des Tores
  tor: {
    schuss: [
      "TOOOR! {spieler} schießt flach ins Eck!",
      "TOOOR! {spieler} zieht ab und der Ball zappelt im Netz!",
      "TOOOR! Eiskalt! {spieler} lässt {torwart} keine Chance!",
    ],
    kopfball: [
      "TOOOR! {spieler} steigt am höchsten und köpft ein!",
      "TOOOR! Kopfball {spieler} – unhaltbar!",
    ],
    fernschuss: [
      "TOOOR! Was für ein Hammer aus 25 Metern von {spieler}!",
      "TOOOR! {spieler} probiert es aus der Distanz – und trifft in den Winkel!",
    ],
    elfmeter: [
      "Elfmeter! {spieler} läuft an … TOOOR! Sicher verwandelt!",
      "Strafstoß für {team}! {spieler} bleibt cool – TOOOR!",
    ],
    freistoss: [
      "Freistoß … {spieler} zirkelt ihn über die Mauer – TOOOR!",
      "TOOOR! Direkter Freistoß von {spieler}, {torwart} fliegt vergeblich!",
    ],
    fallrueckzieher: [
      "WAHNSINN! FALLRÜCKZIEHER von {spieler}! TOOOR! Das ist das Tor des Jahres!",
      "UNGLAUBLICH! {spieler} mit dem Fallrückzieher – TOOOR! Das Stadion steht Kopf!",
    ],
  },
  vorlage: [
    "Die Vorlage kam von {vorlage}.",
    "Toller Pass von {vorlage}!",
    "{vorlage} hat das super vorbereitet.",
    "Starke Flanke von {vorlage}!",
  ],

  // Was sonst noch so passiert
  chance: [
    "Riesenchance für {team}! {spieler} trifft nur den Pfosten!",
    "{spieler} schießt knapp vorbei – das war eng!",
    "{spieler} läuft allein aufs Tor zu … und verzieht!",
    "Latte! {spieler} hat Pech.",
  ],
  parade: [
    "Glanzparade von {torwart}! Der Schuss von {spieler} war schon drin!",
    "{torwart} fischt den Ball aus dem Winkel!",
    "Was für ein Reflex von {torwart}!",
  ],
  gelb: [
    "Gelbe Karte für {spieler} nach einem Foul.",
    "{spieler} sieht Gelb – das war zu hart.",
  ],
  verletzung: [
    "Oh nein! {spieler} bleibt liegen und muss behandelt werden. Er fällt im nächsten Spiel aus. 🤕",
    "{spieler} humpelt vom Platz. Verletzt! Nächstes Spiel ohne ihn. 🤕",
  ],
  notTorwart: [
    "{team} hat keinen Torwart! {spieler} muss die Handschuhe anziehen …",
  ],

  // Auswertung für die Spielteilnehmer nach jedem Spiel
  sieg: [
    "🎉 JAAA! Was für ein Sieg! Deine Mannschaft hat alles gegeben!",
    "🏆 Gewonnen! Die Fans singen deinen Namen!",
    "🔥 Sieg! Deine Aufstellung war genau richtig!",
  ],
  unentschieden: [
    "🤝 Unentschieden. Ein Punkt ist besser als keiner!",
    "😅 Remis! Das war ein enges Ding.",
  ],
  niederlage: [
    "😢 Verloren … Kopf hoch, nächste Woche wird zurückgeschlagen!",
    "💪 Niederlage. Aber aus Fehlern lernt man – probier eine neue Aufstellung!",
  ],
  hoherSieg: "🤩 KANTERSIEG! Das war eine Show!",
  hoheNiederlage: "😱 Autsch, das tat weh. Vielleicht mal den Torwart wechseln?",
};

// Zufälligen Satz aus einer Liste nehmen und Platzhalter ersetzen
function textBauen(liste, werte) {
  let satz = liste[Math.floor(Math.random() * liste.length)];
  for (const name in werte) {
    satz = satz.split("{" + name + "}").join(werte[name]);
  }
  return satz;
}
