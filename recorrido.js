// Portada: el teléfono cambia de módulo según la sección que se está leyendo.
//
// Cada sección (.paso) tiene un data-modulo. Al entrar a la franja de lectura
// de la pantalla, el teléfono hace un "toque" en el botón de módulos de la app
// y, un instante después, desliza a la pantalla de ese módulo y reproduce su
// video. Hacia arriba, el deslizamiento va al revés.
//
// Los videos se cargan cuando hacen falta (y el siguiente se precarga). Con
// "reducir movimiento" no se reproduce nada: se queda el póster de cada uno.
(function () {
  var rec = document.querySelector(".recorrido");
  if (!rec) return;

  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var orden = Array.prototype.map.call(rec.querySelectorAll(".paso"), function (p) {
    return p.dataset.modulo;
  });
  var capas = {};
  rec.querySelectorAll(".capa").forEach(function (c) { capas[c.dataset.modulo] = c; });
  var toque = rec.querySelector(".toque");
  var indice = rec.querySelector(".indice-modulos");
  var activo = "inicio";
  var pendiente = null;

  function video(mod) { return capas[mod] && capas[mod].querySelector("video"); }

  function cargar(mod) {
    var v = video(mod);
    if (!v || v.getAttribute("src")) return v;
    v.setAttribute("src", v.dataset.src);
    v.preload = "auto";
    return v;
  }

  function reproducir(mod) {
    if (reducir) return;
    var v = cargar(mod);
    if (!v) return;
    try { v.currentTime = 0; } catch (e) {}
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  function pausar(mod) {
    var v = video(mod);
    if (v && !v.paused) v.pause();
  }

  function marcar(mod) {
    rec.dataset.activo = mod;
    rec.querySelectorAll(".paso").forEach(function (p) {
      p.classList.toggle("activo", p.dataset.modulo === mod);
    });
    if (indice) indice.querySelectorAll("a").forEach(function (a) {
      a.classList.toggle("activo", a.dataset.modulo === mod);
    });
  }

  function activar(mod) {
    if (!capas[mod] || mod === activo) return;
    var antes = activo;
    activo = mod;
    marcar(mod);
    rec.classList.toggle("atras", orden.indexOf(mod) < orden.indexOf(antes));

    // Primero el toque; la pantalla cambia cuando el "dedo" ya bajó.
    clearTimeout(pendiente);
    if (!reducir && toque) {
      toque.classList.remove("pulsa");
      void toque.offsetWidth;
      toque.classList.add("pulsa");
    }
    pendiente = setTimeout(function () {
      Object.keys(capas).forEach(function (m) {
        var c = capas[m];
        if (m === mod) {
          c.classList.remove("sale");
          c.classList.add("activa");
        } else if (c.classList.contains("activa")) {
          c.classList.remove("activa");
          c.classList.add("sale");
          pausar(m);
          setTimeout(function () { c.classList.remove("sale"); }, 600);
        }
      });
      reproducir(mod);
      // El que sigue, listo para cuando llegue.
      var sig = orden[orden.indexOf(mod) + 1];
      if (sig && !reducir) cargar(sig);
    }, reducir ? 0 : 220);
  }

  // La franja de lectura: el centro de la pantalla en escritorio; en el
  // celular, la parte de abajo, que es lo que queda libre bajo el teléfono.
  var celular = window.matchMedia("(max-width: 860px)");
  var observador = null;
  function observar() {
    if (observador) observador.disconnect();
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) activar(e.target.dataset.modulo);
      });
    }, { rootMargin: celular.matches ? "-62% 0px -30% 0px" : "-45% 0px -45% 0px" });
    rec.querySelectorAll(".paso").forEach(function (p) { observador.observe(p); });
  }
  observar();
  if (celular.addEventListener) celular.addEventListener("change", observar);

  // El índice se ve mientras el recorrido ocupa la pantalla. Fuera de él, el
  // video se pausa: no tiene caso reproducir lo que nadie ve.
  new IntersectionObserver(function (entradas) {
    var dentro = entradas[0].isIntersecting;
    if (indice) indice.classList.toggle("visible", dentro);
    if (dentro) reproducir(activo); else pausar(activo);
  }, { rootMargin: "-50% 0px -50% 0px" }).observe(rec);

  if (indice) indice.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    var destino = document.getElementById(a.dataset.modulo);
    if (!destino) return;
    e.preventDefault();
    destino.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "center" });
  });

  marcar(activo);
  reproducir(activo);
})();
