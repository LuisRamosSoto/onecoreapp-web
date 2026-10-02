// OneCore — lo que comparten todas las páginas.
//
// Lo que cambia con el lanzamiento está arriba, en un solo sitio:
//   APP_STORE_ID  el número de la app en la App Store (sale al publicarla).
//   TESTFLIGHT    el enlace público de la beta en TestFlight.
// Con ellos vacíos, los botones dicen "Próximamente" y la beta no se ofrece.
var ONECORE = {
  APP_STORE_ID: "",
  TESTFLIGHT: "",
  // La clave pública de Supabase (la misma que lleva la app). Solo puede
  // llamar a la lista de espera: nada más es escribible sin sesión.
  SUPABASE_URL: "https://wligyeuybpczdwuonyxq.supabase.co",
  SUPABASE_KEY: "sb_publishable_ctiErPCRL6unzunGZADlAA_OTcvD722"
};

(function () {
  // Botones de la App Store: con el ID, enlazan a la ficha; sin él, se quedan
  // en "Próximamente en la App Store" y no son pulsables.
  var tienda = ONECORE.APP_STORE_ID
    ? "https://apps.apple.com/app/id" + ONECORE.APP_STORE_ID : "";
  document.querySelectorAll("[data-app-store]").forEach(function (el) {
    if (!tienda) return;
    el.textContent = "Descargar en la App Store";
    el.setAttribute("href", tienda);
    el.classList.remove("apagado");
  });

  // La beta, solo si hay enlace.
  document.querySelectorAll("[data-beta]").forEach(function (el) {
    if (!ONECORE.TESTFLIGHT) { el.style.display = "none"; return; }
    el.setAttribute("href", ONECORE.TESTFLIGHT);
  });

  // Lista de espera.
  document.querySelectorAll("form[data-lista]").forEach(function (form) {
    var aviso = form.querySelector("[data-aviso]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // Campo trampa: invisible para las personas, lo rellenan los bots.
      if (form.querySelector("[name=sitio]").value) return;
      var correo = form.querySelector("[name=correo]").value.trim();
      var beta = !!(form.querySelector("[name=beta]") || {}).checked;
      var boton = form.querySelector("button");
      boton.disabled = true;
      aviso.textContent = "Guardando…";
      fetch(ONECORE.SUPABASE_URL + "/rest/v1/rpc/unirse_a_lista_de_espera", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ONECORE.SUPABASE_KEY,
          "Authorization": "Bearer " + ONECORE.SUPABASE_KEY
        },
        body: JSON.stringify({ p_correo: correo, p_origen: location.pathname, p_beta: beta })
      }).then(function (r) {
        if (r.ok) {
          form.reset();
          aviso.textContent = beta
            ? "¡Listo! Te escribiremos para la beta y cuando salga."
            : "¡Listo! Te avisaremos cuando OneCore salga.";
          return;
        }
        return r.text().then(function (t) {
          aviso.textContent = t.indexOf("CORREO_NO_VALIDO") >= 0
            ? "Revisa el correo: no parece válido."
            : "No se pudo guardar ahora. Inténtalo en un rato.";
        });
      }).catch(function () {
        aviso.textContent = "Sin conexión. Inténtalo de nuevo.";
      }).finally(function () { boton.disabled = false; });
    });
  });
})();
