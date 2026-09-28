const NOMBRE_CACHE = "atempo-v14";

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
  "./css/instalacion.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/actividades.js",
  "./js/formulario-actividades.js",
  "./js/calendario.js",
  "./js/menu.js",
  "./js/guia.js",
  "./js/instalacion.js",
  "./js/navegacion.js",
  "./Branding/logos/SVG/logo oscuro.svg",
  "./Branding/logos/SVG/simbolo solo.svg",
  "./Branding/logos/SVG/fabicon.svg",
  "./Branding/logos/PNG/simbolo-180.png",
  "./Branding/logos/PNG/simbolo-192.png",
  "./Branding/logos/PNG/simbolo-512.png",
  "./Branding/iconos/SVG/bebe.svg",
  "./Branding/iconos/SVG/catequesis.svg",
  "./Branding/iconos/SVG/cumplea%C3%B1os.svg",
  "./Branding/iconos/SVG/dentista.svg",
  "./Branding/iconos/SVG/dia.svg",
  "./Branding/iconos/SVG/futbol.svg",
  "./Branding/iconos/SVG/guia.svg",
  "./Branding/iconos/SVG/gym.svg",
  "./Branding/iconos/SVG/hora.svg",
  "./Branding/iconos/SVG/mama.svg",
  "./Branding/iconos/SVG/medico.svg",
  "./Branding/iconos/SVG/musica.svg",
  "./Branding/iconos/SVG/personalizado.svg",
  "./Branding/iconos/SVG/ni%C3%B1o.svg",
  "./Branding/iconos/SVG/notificaciones.svg",
  "./Branding/iconos/SVG/pael.svg",
  "./Branding/iconos/SVG/papa.svg",
  "./Branding/iconos/SVG/peluqueria.svg",
  "./Branding/iconos/SVG/recordatorio.svg",
  "./Branding/iconos/SVG/recurrente.svg",
  "./Branding/iconos/SVG/tarea.svg"
];

self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then(function (cache) {
      return cache.addAll(ARCHIVOS_PRINCIPALES);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys()
      .then(function (nombresCache) {
        const cachesAntiguas = nombresCache.filter(function (nombreCache) {
          return nombreCache !== NOMBRE_CACHE;
        });

        return Promise.all(
          cachesAntiguas.map(function (nombreCache) {
            return caches.delete(nombreCache);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") {
    return;
  }

  evento.respondWith(
    fetch(evento.request)
      .then(function (respuestaInternet) {
        const copiaRespuesta = respuestaInternet.clone();

        if (respuestaInternet.ok || respuestaInternet.type === "opaque") {
          caches.open(NOMBRE_CACHE).then(function (cache) {
            cache.put(evento.request, copiaRespuesta);
          });
        }

        return respuestaInternet;
      })
      .catch(function () {
        return caches.match(evento.request).then(function (respuestaGuardada) {
          if (respuestaGuardada) {
            return respuestaGuardada;
          }

          if (evento.request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return Response.error();
        });
      })
  );
});

self.addEventListener("notificationclick", function (evento) {
  evento.notification.close();

  evento.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (ventanasAbiertas) {
        for (const ventana of ventanasAbiertas) {
          if (ventana.url.startsWith(self.registration.scope)) {
            return ventana.focus();
          }
        }

        return self.clients.openWindow("./");
      })
  );
});
