const NOMBRE_CACHE = "atempo-v1";

const ARCHIVOS_PRINCIPALES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/base.css",
  "./css/inicio.css",
  "./css/fichas.css",
  "./css/formularios.css",
  "./css/calendario.css",
  "./css/menu.css",
  "./css/guia.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/actividades.js",
  "./js/formulario-actividades.js",
  "./js/calendario.js",
  "./js/menu.js",
  "./js/guia.js",
  "./Branding/logos/SVG/logo oscuro.svg",
  "./Branding/logos/PNG/icono-192.png",
  "./Branding/logos/PNG/icono-512.png"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then(function (cache) {
      return cache.addAll(ARCHIVOS_PRINCIPALES);
    })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombresCache) {
      const cachesAntiguas = nombresCache.filter(function (nombreCache) {
        return nombreCache !== NOMBRE_CACHE;
      });

      return Promise.all(
        cachesAntiguas.map(function (nombreCache) {
          return caches.delete(nombreCache);
        })
      );
    })
  );
});

self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") {
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then(function (respuestaGuardada) {
      if (respuestaGuardada) {
        return respuestaGuardada;
      }

      return fetch(evento.request).then(function (respuestaInternet) {
        const copiaRespuesta = respuestaInternet.clone();

        caches.open(NOMBRE_CACHE).then(function (cache) {
          cache.put(evento.request, copiaRespuesta);
        });

        return respuestaInternet;
      });
    })
  );
});
