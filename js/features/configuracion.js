/**
* configuracion.js
* Logica del modulo de administracion "Configuracion", dividido en 4
* secciones: informacion de la empresa, gestion de usuarios (simulada,
* sin autenticacion real), gestion de areas (consumidas por la encuesta)
* y periodos de medicion. Todo se persiste unicamente en localStorage a
* traves de DataStore (js/core/data.js).
*/

const Configuracion = {
  editandoUsuarioId: null,
  editandoAreaId: null,

  /** Renderiza las 4 secciones. Se invoca cada vez que se entra a la vista "cfg". */
  render() {
    this.renderEmpresa();
    this.renderUsuarios();
    this.renderAreas();
    this.renderPeriodos();
  },

  /* ================= 1. Informacion de la empresa ================= */

  renderEmpresa() {
    const empresa = DataStore.getEmpresa();
    document.getElementById("cfgNombre").value = empresa.nombre;
    document.getElementById("cfgNit").value = empresa.nit;
    document.getElementById("cfgSector").value = empresa.sector;
    document.getElementById("cfgColaboradores").value = empresa.colaboradores;
    document.getElementById("cfgCiudad").value = empresa.ciudad;
    document.getElementById("cfgResponsable").value = empresa.responsable;
    document.getElementById("cfgCorreo").value = empresa.correo;
    document.getElementById("cfgTelefono").value = empresa.telefono;
    document.getElementById("cfgPeriodicidad").value = empresa.periodicidad;
    document.getElementById("cfgLogoUrl").value = empresa.logo || "";
    this.actualizarPreviewLogo(empresa);
  },

  /**
    * Simula el logo de la empresa: si hay una URL de imagen guardada la
  * muestra, y si no, dibuja un avatar circular con las iniciales del
  * nombre de la empresa (mismo recurso visual del avatar de usuario en
  * el sidebar, sin agregar componentes nuevos).
  */
  actualizarPreviewLogo(empresa) {
    const preview = document.getElementById("cfgLogoPreview");
    if (!preview) return;
    if (empresa.logo) {
      preview.innerHTML = `<img src="${empresa.logo}" alt="Logo de la empresa" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      preview.textContent = iniciales(empresa.nombre || "EP");
    }
  },

  guardarEmpresa(event) {
    event.preventDefault();

  const empresa = {
    ...DataStore.getEmpresa(),
    nombre: document.getElementById("cfgNombre").value.trim() || "Empresa demo",
    nit: document.getElementById("cfgNit").value.trim(),
    sector: document.getElementById("cfgSector").value.trim(),
    colaboradores: Number(document.getElementById("cfgColaboradores").value) || 0,
    ciudad: document.getElementById("cfgCiudad").value.trim(),
    responsable: document.getElementById("cfgResponsable").value.trim(),
    correo: document.getElementById("cfgCorreo").value.trim(),
    telefono: document.getElementById("cfgTelefono").value.trim(),
    periodicidad: document.getElementById("cfgPeriodicidad").value,
    logo: document.getElementById("cfgLogoUrl").value.trim(),
  };

  DataStore.guardarEmpresa(empresa);
    document.getElementById("empinfo").textContent =
      `${empresa.nombre} · ${empresa.ciudad} · ${empresa.colaboradores} colaboradores`;
    this.actualizarPreviewLogo(empresa);

  mostrarToast("Información de la empresa guardada correctamente.");
  },

  /* ================= 2. Gestion de usuarios ================= */

  renderUsuarios() {
    const usuarios = DataStore.getUsuarios();
    const panel = document.getElementById("panelUsuarios");
    if (!panel) return;

  const filas = usuarios.length
    ? usuarios.map(u => `
    <tr>
    <td>${u.nombre}</td>
    <td>${u.correo}</td>
    <td>${u.rol}</td>
    <td>${badgeHTML(u.estado === "Activo" ? "ok" : "danger")}</td>
    <td>
    <button type="button" class="btn btn-ghost btn-sm" data-editar-usuario="${u.id}">Editar</button>
    <button type="button" class="btn btn-ghost btn-sm" data-estado-usuario="${u.id}">${u.estado === "Activo" ? "Desactivar" : "Activar"}</button>
    </td>
    </tr>
    `).join("")
    : `<tr><td colspan="5" class="text-muted">Aún no hay usuarios registrados.</td></tr>`;

  panel.innerHTML = `
  <h3>Gestión de usuarios</h3>
  <table id="tUsuarios">
  <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
  </table>
  <form id="formUsuario" class="mt-md">
  <div class="field">
  <label for="usrNombre">Nombre</label>
  <input id="usrNombre" required>
  </div>
  <div class="field">
  <label for="usrCorreo">Correo</label>
  <input id="usrCorreo" type="email" required>
  </div>
  <div class="field">
  <label for="usrRol">Rol</label>
  <select id="usrRol">
  <option>Administrador</option>
  <option>Gerente / Líder</option>
  <option>Colaborador</option>
  </select>
  </div>
  <button type="submit" class="btn btn-primary" id="btnGuardarUsuario">Agregar usuario</button>
  </form>
  `;

  document.getElementById("formUsuario").addEventListener("submit", (e) => this.guardarUsuario(e));
    panel.querySelectorAll("[data-editar-usuario]").forEach(btn => {
      btn.addEventListener("click", () => this.editarUsuario(Number(btn.dataset.editarUsuario)));
    });
    panel.querySelectorAll("[data-estado-usuario]").forEach(btn => {
      btn.addEventListener("click", () => this.cambiarEstadoUsuario(Number(btn.dataset.estadoUsuario)));
    });
  },

  /**
    * Agrega un usuario nuevo o, si se esta editando, guarda los cambios sobre
  * el usuario existente. No permite guardar si ya existe otro usuario con
  * el mismo correo (comparacion sin distinguir mayusculas/minusculas).
  */
  guardarUsuario(event) {
    event.preventDefault();

    const nombre = document.getElementById("usrNombre").value.trim();
    const correo = document.getElementById("usrCorreo").value.trim();
    const rol = document.getElementById("usrRol").value;

  if (!nombre || !correo) {
    mostrarToast("Completa el nombre y el correo del usuario.", "error");
    return;
  }

  const correoDuplicado = DataStore.getUsuarios().some(u =>
    u.correo.trim().toLowerCase() === correo.toLowerCase() && u.id !== this.editandoUsuarioId
  );
    if (correoDuplicado) {
      mostrarToast("Ya existe un usuario con ese correo.", "error");
      return;
    }

  if (this.editandoUsuarioId) {
    DataStore.actualizarUsuario(this.editandoUsuarioId, { nombre, correo, rol });
    mostrarToast("Usuario actualizado correctamente.");
    this.editandoUsuarioId = null;
  } else {
    DataStore.agregarUsuario({ nombre, correo, rol });
    mostrarToast("Usuario agregado correctamente.");
  }

  this.renderUsuarios();
  },

  /** Carga los datos de un usuario existente en el formulario para editarlo. */
  editarUsuario(id) {
    const usuario = DataStore.getUsuarios().find(u => u.id === id);
    if (!usuario) return;

  this.editandoUsuarioId = id;
    document.getElementById("usrNombre").value = usuario.nombre;
    document.getElementById("usrCorreo").value = usuario.correo;
    document.getElementById("usrRol").value = usuario.rol;
    document.getElementById("btnGuardarUsuario").textContent = "Guardar cambios";
    document.getElementById("usrNombre").focus();
  },

  /** Activa/desactiva un usuario. No existe autenticacion real: es administracion simulada. */
  cambiarEstadoUsuario(id) {
    DataStore.cambiarEstadoUsuario(id);
    mostrarToast("Estado del usuario actualizado.");
    this.renderUsuarios();
  },

  /* ================= 3. Gestion de areas ================= */

  renderAreas() {
    const areas = DataStore.getAreas();
    const panel = document.getElementById("panelAreas");
    if (!panel) return;

  const filas = areas.length
    ? areas.map(a => `
    <tr>
    <td>${a.nombre}</td>
    <td>
    <button type="button" class="btn btn-ghost btn-sm" data-editar-area="${a.id}">Editar</button>
    <button type="button" class="btn btn-ghost btn-sm" data-eliminar-area="${a.id}">Eliminar</button>
    </td>
    </tr>
    `).join("")
    : `<tr><td colspan="2" class="text-muted">Aún no hay áreas registradas.</td></tr>`;

  panel.innerHTML = `
  <h3>Gestión de áreas</h3>
  <table id="tAreas">
  <thead><tr><th>Área</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
  </table>
  <form id="formArea" class="mt-md">
  <div class="field">
  <label for="areaNombre">Nombre del área</label>
  <input id="areaNombre" required>
  </div>
  <button type="submit" class="btn btn-primary" id="btnGuardarArea">Agregar área</button>
  </form>
  `;

  document.getElementById("formArea").addEventListener("submit", (e) => this.guardarArea(e));
    panel.querySelectorAll("[data-editar-area]").forEach(btn => {
      btn.addEventListener("click", () => this.editarArea(Number(btn.dataset.editarArea)));
    });
    panel.querySelectorAll("[data-eliminar-area]").forEach(btn => {
      btn.addEventListener("click", () => this.eliminarArea(Number(btn.dataset.eliminarArea)));
    });
  },

  /**
    * Las areas creadas aqui son las mismas que se ofrecen en el select de la
  * encuesta (sin listas fijas). No permite guardar si ya existe otra area
  * con el mismo nombre (comparacion sin distinguir mayusculas/minusculas),
  * y refleja el cambio de inmediato en el select de Encuestas.
  */
  guardarArea(event) {
    event.preventDefault();

  const nombre = document.getElementById("areaNombre").value.trim();
    if (!nombre) {
      mostrarToast("Escribe el nombre del área.", "error");
      return;
    }

  const nombreDuplicado = DataStore.getAreas().some(a =>
    a.nombre.trim().toLowerCase() === nombre.toLowerCase() && a.id !== this.editandoAreaId
  );
    if (nombreDuplicado) {
      mostrarToast("Ya existe un área con ese nombre.", "error");
      return;
    }

  if (this.editandoAreaId) {
    DataStore.actualizarArea(this.editandoAreaId, nombre);
    mostrarToast("Área actualizada correctamente.");
    this.editandoAreaId = null;
  } else {
    DataStore.agregarArea(nombre);
    mostrarToast("Área agregada correctamente.");
  }

  this.renderAreas();
    if (typeof Encuestas !== "undefined") Encuestas.actualizarSelectAreas();
  },

  editarArea(id) {
    const area = DataStore.getAreas().find(a => a.id === id);
    if (!area) return;

  this.editandoAreaId = id;
    document.getElementById("areaNombre").value = area.nombre;
    document.getElementById("btnGuardarArea").textContent = "Guardar cambios";
    document.getElementById("areaNombre").focus();
  },

  /** Elimina un area, previa confirmacion del usuario (accion irreversible). */
  eliminarArea(id) {
    if (!confirm("¿Seguro que deseas eliminar esta área? Esta acción no se puede deshacer.")) return;

  DataStore.eliminarArea(id);
    mostrarToast("Área eliminada correctamente.");
    this.renderAreas();
    if (typeof Encuestas !== "undefined") Encuestas.actualizarSelectAreas();
  },

  /* ================= 4. Periodos de medicion ================= */

  renderPeriodos() {
    const periodos = DataStore.getPeriodos();
    const panel = document.getElementById("panelPeriodos");
    if (!panel) return;

  const filas = periodos.length
    ? periodos.map(p => `
    <tr>
    <td>${p.nombre}</td>
    <td>${p.activo ? badgeHTML("ok") : '<span class="text-muted">Inactivo</span>'}</td>
    <td>
    ${p.activo ? "" : `<button type="button" class="btn btn-ghost btn-sm" data-activar-periodo="${p.id}">Activar</button>`}
    <button type="button" class="btn btn-ghost btn-sm" data-eliminar-periodo="${p.id}">Eliminar</button>
    </td>
    </tr>
    `).join("")
    : `<tr><td colspan="3" class="text-muted">Aún no hay períodos creados.</td></tr>`;

  panel.innerHTML = `
  <h3>Períodos de medición</h3>
  <table id="tPeriodos">
  <thead><tr><th>Período</th><th>Estado</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
  </table>
  <form id="formPeriodo" class="mt-md">
  <div class="field">
  <label for="periodoNombre">Nombre del período</label>
  <input id="periodoNombre" placeholder="Ej. Enero 2027" required>
  </div>
  <button type="submit" class="btn btn-primary">Crear período</button>
  </form>
  `;

  document.getElementById("formPeriodo").addEventListener("submit", (e) => this.guardarPeriodo(e));
    panel.querySelectorAll("[data-activar-periodo]").forEach(btn => {
      btn.addEventListener("click", () => this.activarPeriodo(Number(btn.dataset.activarPeriodo)));
    });
    panel.querySelectorAll("[data-eliminar-periodo]").forEach(btn => {
      btn.addEventListener("click", () => this.eliminarPeriodo(Number(btn.dataset.eliminarPeriodo)));
    });
  },

  /**
    * El primer periodo creado queda activo automaticamente (ver
  * DataStore.agregarPeriodo). No permite crear un periodo con el mismo
  * nombre de otro ya existente (comparacion sin distinguir
  * mayusculas/minusculas).
  */
  guardarPeriodo(event) {
    event.preventDefault();

  const nombre = document.getElementById("periodoNombre").value.trim();
    if (!nombre) {
      mostrarToast("Escribe el nombre del período.", "error");
      return;
    }

  const nombreDuplicado = DataStore.getPeriodos().some(p => p.nombre.trim().toLowerCase() === nombre.toLowerCase());
    if (nombreDuplicado) {
      mostrarToast("Ya existe un período con ese nombre.", "error");
      return;
    }

    DataStore.agregarPeriodo(nombre);
    mostrarToast("Período creado correctamente.");
    document.getElementById("formPeriodo").reset();
    this.renderPeriodos();
  },

  /** Cada encuesta nueva quedara asociada a este periodo (ver DataStore.guardarRespuestaEncuesta). */
  activarPeriodo(id) {
    DataStore.activarPeriodo(id);
    mostrarToast("Período activo actualizado.");
    this.renderPeriodos();
  },

  /** Elimina un periodo, previa confirmacion del usuario (accion irreversible). */
  eliminarPeriodo(id) {
    if (!confirm("¿Seguro que deseas eliminar este período? Esta acción no se puede deshacer.")) return;

  DataStore.eliminarPeriodo(id);
    mostrarToast("Período eliminado correctamente.");
    this.renderPeriodos();
  },
};
