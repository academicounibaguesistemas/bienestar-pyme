/**
 * app.js
 * Punto de entrada de BienEstar PYME. Se ejecuta al cargar la
 * pagina, restaura la sesion si existe y conecta los eventos
 * globales (login, logout, navegacion, menu movil).
 */

document.addEventListener("DOMContentLoaded", () => {
  // Formulario de login.
  document.getElementById("loginForm").addEventListener("submit", Auth.iniciarSesion);

  // Navegacion del sidebar (data-view en cada enlace).
  document.querySelectorAll(".sidebar__link[data-view]").forEach(link => {
    link.addEventListener("click", () => Router.navegar(link.dataset.view));
  });

  document.getElementById("btnLogout").addEventListener("click", Auth.cerrarSesion);
  document.getElementById("menuToggle").addEventListener("click", Router.toggleMenuMovil);
  document.getElementById("overlay").addEventListener("click", Router.cerrarMenuMovil);

  // Formularios de los modulos.
  document.getElementById("formEncuesta").addEventListener("submit", e => Encuestas.enviar(e));
  document.getElementById("formConfiguracion").addEventListener("submit", e => Configuracion.guardarEmpresa(e));
  document.getElementById("btnExportarPDF").addEventListener("click", () => Reportes.exportarPDF());

  // Si ya habia una sesion iniciada (localStorage), entra directo al tablero.
  Auth.restaurarSesion();
});
