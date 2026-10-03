// Portada: entrada cinematográfica y recorrido por los módulos y sus apartados.
//
// 1. Recorrido (siempre). La página se lee por tramos: cada módulo tiene un
//    tramo principal y uno por apartado (Calendario, Progreso…). Cada tramo
//    tiene su capa en el teléfono (data-capa). Al llegar a un tramo, el
//    teléfono hace un "toque" donde la app tiene ese botón —el de módulos
//    para cambiar de módulo, la pestaña del apartado para entrar a él— y
//    pasa a esa pantalla con su video. Al cambiar de módulo cambian también
//    el color, la palabra gigante del fondo y las tarjetas flotantes.
// 2. Efectos (si cargó GSAP y no se pidió reducir movimiento): el título se
//    enfoca al abrir; al bajar se disuelve mientras el teléfono sube girando
//    en 3D; el teléfono se inclina con el ratón; los textos entran
//    desenfocados; las cifras cuentan; el cierre se enfoca al llegar.
//
// Sin GSAP o con "reducir movimiento", todo queda en su sitio y legible.
(function () {
  var rec = document.querySelector(".recorrido");
  if (!rec) return;

  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var g = !reducir && window.gsap && window.ScrollTrigger ? window.gsap : null;
  if (g) {
    g.registerPlugin(window.ScrollTrigger);
    document.body.classList.add("con-gsap");
  }

  // ---------------------------------------------------------------- tienda
  // El botón grande de la App Store: con el ID publicado, se enciende.
  var tienda = document.querySelector("[data-tienda]");
  if (tienda && window.ONECORE && ONECORE.APP_STORE_ID) {
    tienda.href = "https://apps.apple.com/app/id" + ONECORE.APP_STORE_ID;
    tienda.classList.remove("apagado");
    var arriba = tienda.querySelector("[data-tienda-arriba]");
    if (arriba) arriba.textContent = "Descárgala en la";
  }

  // ------------------------------------------------------------- recorrido
  var tramos = Array.prototype.slice.call(rec.querySelectorAll(".tramo"));
  var orden = tramos.map(function (t) { return t.dataset.capa; });
  var capas = {};
  rec.querySelectorAll(".capa").forEach(function (c) {
    capas[c.dataset.capa] = c;
    // Lo que se ve mientras el video carga (o siempre, sin movimiento): en un
    // apartado, su pantalla final; en un módulo, su póster.
    var v = c.querySelector("video");
    var fondo = (reducir && c.dataset.final) || (v && v.getAttribute("poster"));
    if (fondo) c.style.backgroundImage = "url(" + fondo + ")";
    if (reducir && c.dataset.final && v) v.style.visibility = "hidden";
  });
  var toque = rec.querySelector(".toque");
  var indice = rec.querySelector(".indice-modulos");
  var insignias = rec.querySelectorAll(".insignia");
  var palabra = rec.querySelector(".palabra-fondo");
  var activa = null;      // capa a la vista
  var modulo = null;      // módulo de esa capa
  var pendiente = null;

  // Íconos de línea (24×24) para las tarjetas: los emojis no se dibujan
  // igual en todos lados (en Safari de iPhone salían como cuadros).
  var I = {
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    hecho: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9"/>',
    campana: '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 3 8.5 3 8.5H3S6 15.5 6 9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
    fuego: '<path d="M12 2.5c1 4 6 6 6 11.5a6 6 0 0 1-12 0c0-3 1.8-5 3-6 0 2 1 3 2.2 3C11.2 7 10.2 5.3 12 2.5z"/>',
    gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    sube: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    equipo: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.6 14.3A5 5 0 0 1 21.5 19"/>',
    ticket: '<path d="M5 3h14v18l-2.3-1.6L14.3 21 12 19.4 9.7 21l-2.4-1.6L5 21z"/><path d="M9 8h6M9 12h6"/>',
    barras: '<path d="M5 20V11M11 20V5M17 20v-7M2 20h20"/>',
    trofeo: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3.5 3.5 0 0 0 3.6 4M16 6h3.5a3.5 3.5 0 0 1-3.6 4M12 13v4M8 21h8M10 17h4"/>',
    pesa: '<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>'
  };
  function icono(n) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[n] + "</svg>";
  }

  // Lo que "pasa" en cada módulo, en las dos tarjetas de vidrio.
  var momentos = {
    inicio:     [["calendario", "Junta con diseño", "Hoy · 16:00"], ["sol", "7 pendientes hoy", "2 de alta prioridad"]],
    pendientes: [["hecho", "Pagar la tarjeta", "Hecho"], ["campana", "Te avisamos", "30 min antes"]],
    habitos:    [["fuego", "Racha de 7 días", "Meditar"], ["gota", "5 de 8 vasos", "Tomar agua"]],
    proyectos:  [["sube", "Mudanza al 60%", "Faltan 15 días"], ["equipo", "Espacio compartido", "Con tu equipo"]],
    finanzas:   [["ticket", "Ticket leído", "$96.40 · Oxxo"], ["barras", "Balance del mes", "+$15,938"]],
    ejercicio:  [["trofeo", "Nuevo récord", "Press de banca"], ["pesa", "2 de 3 sesiones", "Esta semana"]]
  };

  function modDe(capa) { return capas[capa] ? capas[capa].dataset.modulo : capa; }
  function video(capa) { return capas[capa] && capas[capa].querySelector("video"); }

  function cargar(capa) {
    var v = video(capa);
    if (!v || v.getAttribute("src")) return v;
    v.setAttribute("src", v.dataset.src);
    v.preload = "auto";
    return v;
  }

  function reproducir(capa) {
    if (reducir) return;
    var v = cargar(capa);
    if (!v) return;
    try { v.currentTime = 0; } catch (e) {}
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  function pausar(capa) {
    var v = video(capa);
    if (v && !v.paused) v.pause();
  }

  // Lo que depende del módulo: color, índice, palabra, tarjetas, pasos.
  function marcarModulo(mod) {
    document.body.dataset.mod = mod;
    rec.dataset.activo = mod;
    rec.querySelectorAll(".paso").forEach(function (p) {
      p.classList.toggle("activo", p.dataset.modulo === mod);
    });
    if (indice) indice.querySelectorAll("a").forEach(function (a) {
      a.classList.toggle("activo", a.dataset.modulo === mod);
    });
    if (palabra) {
      var nombre = (rec.querySelector('.paso[data-modulo="' + mod + '"] .antetitulo') || {}).textContent || "";
      if (g) {
        g.to(palabra, { autoAlpha: 0, scale: 0.96, duration: 0.25, ease: "power2.in", overwrite: true, onComplete: function () {
          palabra.textContent = nombre;
          g.to(palabra, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power3.out" });
        } });
      } else {
        palabra.textContent = nombre;
      }
    }
    contarInsignias(mod);
  }

  // Lo que depende de la capa: la pestaña marcada.
  function marcarPestana(capa) {
    rec.querySelectorAll(".pestanas button").forEach(function (b) {
      b.classList.toggle("activa", b.dataset.ir === capa);
    });
  }

  function contarInsignias(mod) {
    var m = momentos[mod];
    if (!m) return;
    insignias.forEach(function (el, i) {
      var d = m[i];
      el.querySelector(".ico").innerHTML = icono(d[0]);
      el.querySelector("b").textContent = d[1];
      el.querySelector("i").textContent = d[2];
    });
    if (g) {
      g.fromTo(insignias,
        { y: 34, scale: 0.8, rotation: function (i) { return i ? 8 : -8; }, autoAlpha: 0 },
        { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 0.9, ease: "back.out(1.6)", stagger: 0.14, delay: 0.25, overwrite: true });
    }
  }

  function activar(capa, tramo) {
    if (!capas[capa] || capa === activa) return;
    var antes = activa;
    var mod = modDe(capa);
    activa = capa;
    if (mod !== modulo) { modulo = mod; marcarModulo(mod); }
    marcarPestana(capa);
    if (antes) rec.classList.toggle("atras", orden.indexOf(capa) < orden.indexOf(antes));

    // El toque cae donde la app tiene el botón: el de módulos al cambiar de
    // módulo; la pestaña del apartado al entrar a uno. Volver al principal de
    // un módulo es tocar su primera pestaña.
    clearTimeout(pendiente);
    var x = "11.5%";
    if (antes && modDe(antes) === mod) {
      x = tramo && tramo.dataset.toque ? tramo.dataset.toque + "%" : "21.7%";
    }
    if (antes && !reducir && toque) {
      toque.style.left = x;
      toque.classList.remove("pulsa");
      void toque.offsetWidth;
      toque.classList.add("pulsa");
    }
    pendiente = setTimeout(function () {
      Object.keys(capas).forEach(function (m) {
        var c = capas[m];
        if (m === capa) {
          c.classList.remove("sale");
          c.classList.add("activa");
        } else if (c.classList.contains("activa")) {
          c.classList.remove("activa");
          c.classList.add("sale");
          pausar(m);
          setTimeout(function () { c.classList.remove("sale"); }, 600);
        }
      });
      reproducir(capa);
      var sig = orden[orden.indexOf(capa) + 1];
      if (sig && !reducir) cargar(sig);
    }, antes && !reducir ? 220 : 0);
  }

  // La franja de lectura: el centro en escritorio; en el celular, la parte de
  // abajo, que es lo que queda libre bajo el teléfono.
  var celular = window.matchMedia("(max-width: 860px)");
  var observador = null;
  function observar() {
    if (observador) observador.disconnect();
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) activar(e.target.dataset.capa, e.target);
      });
    }, { rootMargin: celular.matches ? "-88% 0px -11% 0px" : "-45% 0px -45% 0px" });
    tramos.forEach(function (t) { observador.observe(t); });
  }
  observar();
  if (celular.addEventListener) celular.addEventListener("change", observar);

  // Mientras el recorrido ocupa la pantalla: índice y palabra visibles, video
  // en marcha. Fuera de él, todo en pausa.
  new IntersectionObserver(function (entradas) {
    var dentro = entradas[0].isIntersecting;
    if (indice) indice.classList.toggle("visible", dentro);
    document.body.classList.toggle("en-recorrido", dentro);
    if (dentro) reproducir(activa); else pausar(activa);
  }, { rootMargin: "-50% 0px -50% 0px" }).observe(rec);

  function irA(capa, modulo) {
    var destino = capa ? rec.querySelector('.tramo[data-capa="' + capa + '"]')
                       : document.getElementById(modulo);
    if (destino) destino.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "center" });
  }
  if (indice) indice.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    irA(a.dataset.modulo);
  });
  rec.addEventListener("click", function (e) {
    var b = e.target.closest(".pestanas button");
    if (b) irA(b.dataset.ir);
  });

  activar(orden[0], tramos[0]);

  if (!g) return;

  // --------------------------------------------------------------- efectos
  var ST = window.ScrollTrigger;
  var movil = celular.matches;

  // Entrada: el título se enfoca y la segunda línea se revela.
  g.fromTo(".linea-1",
    { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 },
    { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, duration: 1.7, ease: "expo.out", delay: 0.15 });
  g.fromTo(".linea-2",
    { clipPath: "inset(-20% 100% -20% -5%)" },
    { clipPath: "inset(-20% -5% -20% -5%)", duration: 1.4, ease: "power4.inOut", delay: 0.75, clearProps: "clipPath" });
  g.from(".cine .antetitulo, .cine .entrada, .acciones-cine > *, .cine .sigue", {
    autoAlpha: 0, y: 26, filter: "blur(10px)", duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 1.0
  });

  // Al bajar: el título se agranda y se disuelve.
  g.to(".cine-texto", {
    scale: 1.14, filter: "blur(16px)", autoAlpha: 0, ease: "none",
    scrollTrigger: { trigger: ".cine", start: "top top", end: "bottom top", scrub: true }
  });
  g.to(".cine .sigue", {
    autoAlpha: 0, y: 20, ease: "none",
    scrollTrigger: { trigger: ".cine", start: "top top", end: "25% top", scrub: true }
  });
  g.to(".rejilla-fondo", {
    scale: 1.3, autoAlpha: 0, ease: "none",
    scrollTrigger: { trigger: ".cine", start: "top top", end: "bottom top", scrub: true }
  });

  // …mientras el teléfono sube girando hasta su lugar.
  g.fromTo(".entrada-telefono",
    { y: movil ? 120 : 220, z: -300, rotationX: 48, rotationY: -24, scale: 0.7, autoAlpha: 0 },
    { y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1, autoAlpha: 1, ease: "power2.out",
      scrollTrigger: { trigger: rec, start: "top 98%", end: movil ? "top 10%" : "top 5%", scrub: 1 } });

  // Los textos de cada módulo entran desenfocados, uno tras otro.
  rec.querySelectorAll(".tramo").forEach(function (t) {
    g.from(t.querySelectorAll(".antetitulo, h2, .pestanas, li, .etiqueta, h3, p"), {
      autoAlpha: 0, y: 34, filter: "blur(10px)", duration: 0.95, ease: "power3.out", stagger: 0.08,
      scrollTrigger: { trigger: t, start: movil ? "top 92%" : "top 74%", toggleActions: "play none none reverse" }
    });
  });

  // La palabra del fondo se desplaza un poco al bajar: da profundidad.
  g.fromTo(".palabra-fondo", { yPercent: 8 }, {
    yPercent: -8, ease: "none",
    scrollTrigger: { trigger: rec, start: "top bottom", end: "bottom top", scrub: true }
  });

  // El teléfono se inclina siguiendo el ratón, con un brillo que lo sigue.
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var telefono = rec.querySelector(".telefono");
    var pantalla = rec.querySelector(".pantalla");
    var cuadro = 0;
    window.addEventListener("mousemove", function (e) {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(function () {
        var x = (e.clientX / innerWidth - 0.5) * 2;
        var y = (e.clientY / innerHeight - 0.5) * 2;
        g.to(telefono, { rotationY: x * 11, rotationX: -y * 9, duration: 1.2, ease: "power3.out" });
        var r = pantalla.getBoundingClientRect();
        pantalla.style.setProperty("--mx", (e.clientX - r.left) + "px");
        pantalla.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  // Las cifras cuentan al aparecer.
  document.querySelectorAll(".cifras strong").forEach(function (el) {
    var hasta = Number(el.dataset.hasta) || 0;
    var desde = hasta === 0 ? 9 : 0;
    var obj = { n: desde };
    el.textContent = desde;
    g.to(obj, {
      n: hasta, duration: 1.6, ease: "expo.out",
      onUpdate: function () { el.textContent = Math.round(obj.n); },
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    });
  });
  g.from(".conectado .bloque", {
    autoAlpha: 0, y: 40, scale: 0.94, duration: 0.9, ease: "back.out(1.4)", stagger: 0.1,
    scrollTrigger: { trigger: ".conectado", start: "top 80%" }
  });

  // El cierre se enfoca al llegar.
  g.fromTo(".cierre-cine",
    { scale: 0.86, filter: "blur(24px)", autoAlpha: 0 },
    { scale: 1, filter: "blur(0px)", autoAlpha: 1, ease: "power2.out",
      scrollTrigger: { trigger: ".cierre", start: "top 90%", end: "top 45%", scrub: 1 } });

  // Los videos cambian el alto de la página al cargar: recalcular.
  window.addEventListener("load", function () { ST.refresh(); });
})();
