// =====================================================================
// SERVICE WORKER – damit das Spiel auch ohne Internet läuft
// =====================================================================
// Der Browser startet diese Datei im Hintergrund. Sie speichert alle
// Spieldateien in einem Zwischenspeicher ("Cache") auf dem Gerät.
//
// Regel: Mit Internet wird immer die neueste Datei geholt (und gespeichert).
//        Ohne Internet wird die gespeicherte Datei genommen.
// So kommen Updates automatisch an, sobald das Handy online ist.
// =====================================================================

const CACHE = "liga-simulator";

// Diese Dateien werden gleich beim ersten Besuch gespeichert
const DATEIEN = [
  "./",
  "index.html",
  "style.css",
  "manifest.json",
  "daten/laender.js",
  "daten/spielset.js",
  "daten/computer-pool.js",
  "js/einstellungen.js",
  "js/texte.js",
  "js/spiellogik.js",
  "js/app.js",
  "bilder/logo.svg",
  "bilder/pokal.svg",
  "bilder/vorlage.svg",
  "bilder/tor-schuss.svg",
  "bilder/tor-kopfball.svg",
  "bilder/tor-fallrueckzieher.svg",
  "bilder/tor-elfmeter.svg",
  "bilder/tor-freistoss.svg",
  "bilder/icon-192.png",
  "bilder/icon-512.png",
];

// Beim Installieren: alle Dateien speichern
self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener("activate", (ereignis) => {
  ereignis.waitUntil(self.clients.claim());
});

// Bei jeder Anfrage: erst Internet versuchen, sonst aus dem Speicher
self.addEventListener("fetch", (ereignis) => {
  if (ereignis.request.method !== "GET") return;
  ereignis.respondWith(
    fetch(ereignis.request)
      .then((antwort) => {
        // Kopie speichern (auch die Schriften von Google, damit sie offline da sind)
        const kopie = antwort.clone();
        caches.open(CACHE).then((cache) => cache.put(ereignis.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(ereignis.request, { ignoreSearch: true }))
  );
});
