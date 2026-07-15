/**
 * utils.js
 * Funciones de apoyo reutilizables en toda la aplicacion.
 */

/** Devuelve la clase de badge segun el estado ("ok" | "warn" | "danger"). */
function claseBadge(estado) {
  return { ok: "badge-ok", warn: "badge-warn", danger: "badge-danger" }[estado] || "badge-ok";
}

/** Devuelve la etiqueta legible de un estado. */
function etiquetaEstado(estado) {
  return { ok: "Óptimo", warn: "Atención", danger: "Crítico" }[estado] || estado;
}

/**
 * Genera el marcado de un badge de estado completo (clase + etiqueta).
 * Centraliza un fragmento que antes se repetia igual en dashboard.js y reportes.js.
 */
function badgeHTML(estado) {
  return `<span class="badge ${claseBadge(estado)}">${etiquetaEstado(estado)}</span>`;
}

/**
  * Badge de estado activo/inactivo (usuarios y periodos de medicion), reutilizando ".badge" y claseBadge() ya existentes. A diferencia de badgeHTML() (pensado para el semaforo ok/warn/danger de indicadores, con etiquetas "Optimo/Atencion/Critico"), este badge es especifico para el estado Activo/Inactivo de un registro administrativo.
   */
function estadoActivoHTML(activo) {
  return `<span class="badge ${claseBadge(activo ? "ok" : "danger")}">${activo ? "Activo" : "Inactivo"}</span>`;
}

/** Formatea la fecha actual en espanol, ej. "13 de julio de 2026". */
function fechaLarga(date = new Date()) {
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/** Devuelve las iniciales de un nombre/correo para usarlas en un avatar. */
function iniciales(texto) {
  const base = texto.includes("@") ? texto.split("@")[0] : texto;
  return base.split(/[.\s]+/).filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}  

/** Determina el estado (ok/warn/danger) de un indicador segun umbrales. */
function estadoPorValor(valor, umbralBueno = 75, umbralMedio = 65) {
  if (valor >= umbralBueno) return "ok";
  if (valor >= umbralMedio) return "warn";
  return "danger";
}

/** Lee una variable CSS definida en :root. */
function cssVar(nombre) {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
}

/** Muestra una notificacion tipo toast en la esquina inferior derecha. */
function mostrarToast(mensaje, tipo = "success") {
  const contenedor = document.getElementById("toast-container");
  if (!contenedor) return;
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/** Crea un elemento con clase y contenido de forma abreviada. */
function crearElemento(tag, className, html) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (html !== undefined) el.innerHTML = html;
  return el;
}


/* ---------- Sprint 6: semaforo y tendencia entre periodos ---------- */

/**
* Determina el estado tipo semaforo (ok/warn/danger) de un indicador a
* partir de rangos configurables. "invertido" se usa para indicadores
* donde un valor mas alto es peor (ej. riesgo psicosocial): en ese caso
* se evalua sobre (100 - valor) antes de compararlo con los umbrales.
*/
function estadoSemaforo(valor, invertido = false, umbralExcelente = 75, umbralAceptable = 60) {
  const v = invertido ? 100 - valor : valor;
  if (v >= umbralExcelente) return "ok";
  if (v >= umbralAceptable) return "warn";
  return "danger";
}

/** Texto con emoji para el estado tipo semaforo (distinto de etiquetaEstado, usado en los badges generales). */
function textoEstadoSemaforo(estado) {
  return { ok: "🟢 Estado: Excelente", warn: "🟡 Estado: Aceptable", danger: "🔴 Estado: Crítico" }[estado] || estado;
}

/**
* Badge completo tipo semaforo (emoji + "Estado: ..."), reutilizando la
* clase ".badge" y claseBadge() ya existentes: no agrega estilos nuevos.
*/
function semaforoHTML(valor, invertido = false, umbralExcelente = 75, umbralAceptable = 60) {
  const estado = estadoSemaforo(valor, invertido, umbralExcelente, umbralAceptable);
  return '<span class="badge ' + claseBadge(estado) + '">' + textoEstadoSemaforo(estado) + '</span>';
}

/**
* Estado (ok/warn/danger) de una variacion entre periodos: verde si
* mejora, rojo si empeora, amarillo si no hay cambio. "invertido" se usa
* para indicadores donde subir es peor (ej. riesgo psicosocial).
*/
function estadoTendencia(diferencia, invertido = false) {
  const dif = invertido ? -diferencia : diferencia;
  if (dif > 0) return "ok";
  if (dif < 0) return "danger";
  return "warn";
}

/** Flecha de tendencia segun el signo de la diferencia (independiente de si es buena o mala). */
function flechaTendencia(diferencia) {
  if (diferencia > 0) return "↑";
  if (diferencia < 0) return "↓";
  return "→";
}

/** Texto legible para el estado de una tendencia entre periodos. */
function textoTendenciaEstado(estado) {
  return { ok: "Mejora", warn: "Sin cambios", danger: "Empeora" }[estado] || estado;
}

/** Badge de tendencia (flecha + texto), reutilizando la clase ".badge" existente. */
function tendenciaHTML(estado, flecha) {
  return '<span class="badge ' + claseBadge(estado) + '">' + flecha + ' ' + textoTendenciaEstado(estado) + '</span>';
}
