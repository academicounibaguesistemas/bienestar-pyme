/**
 * router.js
 * Navegacion tipo SPA muy simple entre las vistas de la aplicacion,
 * sin depender de ningun framework. Cada vista es una <section>
 * con clase .view dentro de #content, identificada por su id.
 */

const Router = {
  vistaActual: "dash",

  titulos: {
    dash: "Tablero de indicadores",
    enc: "Encuestas de bienestar",
    rep: "Reportes y alertas",
    cfg: "Configuración",
  },

  /** Cambia de vista, actualiza el titulo y resalta el enlace activo del sidebar. */
  navegar(vista) {
    this.vistaActual = vista;

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(vista).classList.add("active");

    document.querySelectorAll(".sidebar__link[data-view]").forEach(link => {
      link.classList.toggle("active", link.dataset.view === vista);
    });

    document.getElementById("titulo").textContent = this.titulos[vista] || "";

    // Dispara el render especifico de cada modulo la primera vez que se muestra.
    if (vista === "dash") Dashboard.render();
    if (vista === "enc") Encuestas.render();
    if (vista === "rep") Reportes.render();
    if (vista === "cfg") Configuracion.render();

    Router.cerrarMenuMovil();
  },

  /** Abre/cierra el sidebar en vista movil. */
  toggleMenuMovil() {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("overlay").classList.toggle("active");
  },

  cerrarMenuMovil() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  },
};
