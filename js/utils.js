js/utils.js/**
 * utils.js
 * Funciones de apoyo reutilizables en toda la aplicacion.
 */

/** Devuelve la clase de badge segun el estado ("ok" | "warn" | "danger"). */
function claseBadge(estado) {
  return { ok: "badge-ok", warn: "badge-warn", danger: "badge-danger" }[estado] || "badge-ok";
}

/** Devuelve la etiqueta legible de un estado. */
function etiquetaEstado(estado) {
  return { ok: "Optimo", warn: "Atencion", danger: "Critico" }[estado] || estado;
}

/** Formatea la fecha actual en espanol, ej. "13 de julio de 2026". */
function fechaLarga(date = new Date()) {
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/** Devuelve las iniciales de un nombre/correo para usarlas en un avatar. */
function iniciales(texto) {
  const base = texto.includes("@") ? texto.split("@")[0] : texto;
  return base.split(/[.s]/).filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase();
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
