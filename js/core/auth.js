/**
 * auth.js
 * Autenticacion del prototipo (modo demostracion: cualquier
 * credencial es valida). Controla el paso entre la pantalla de
 * login y el shell de la aplicacion, y la sesion en localStorage.
 */

const Auth = {
  /** Maneja el submit del formulario de login. */
  iniciarSesion(event) {
    event.preventDefault();
    const correoInput = document.getElementById("loginUser");
    const rolInput = document.getElementById("loginRol");
    const correo = correoInput.value.trim() || "admin@pyme.co";
    const rol = rolInput.value;

    DataStore.guardarSesion({ correo, rol, ingreso: new Date().toISOString() });
    Auth.mostrarApp();
  },

  /** Cierra la sesion actual y vuelve a la pantalla de login. */
  cerrarSesion() {
    DataStore.limpiarSesion();
    document.getElementById("app").classList.remove("active");
    document.getElementById("login").classList.remove("hidden");
  },

  /** Si ya existe una sesion guardada, entra directo a la app. */
  restaurarSesion() {
    const sesion = DataStore.getSesion();
    if (sesion) {
      Auth.mostrarApp();
    }
  },

  /** Oculta el login, muestra el shell de la app y pinta los datos de usuario/empresa. */
  mostrarApp() {
    const sesion = DataStore.getSesion() || { correo: "admin@pyme.co", rol: "Administrador" };
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.add("active");

    const empresa = DataStore.getEmpresa();
    document.getElementById("empinfo").textContent =
      `${empresa.nombre} · ${empresa.ciudad} · ${empresa.colaboradores} colaboradores`;
    document.getElementById("fecha").textContent = fechaLarga();

    document.getElementById("userAvatar").textContent = iniciales(sesion.correo);
    document.getElementById("userNombre").textContent = sesion.correo;
    document.getElementById("userRol").textContent = sesion.rol;

    Router.navegar("dash");
  },
};
