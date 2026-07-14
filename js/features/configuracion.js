/**
 * configuracion.js
 * Logica del modulo "Configuracion": carga y guarda los datos
 * generales de la empresa en localStorage.
 */

const Configuracion = {
  render() {
    const empresa = DataStore.getEmpresa();
    document.getElementById("cfgNombre").value = empresa.nombre;
    document.getElementById("cfgColaboradores").value = empresa.colaboradores;
    document.getElementById("cfgPeriodicidad").value = empresa.periodicidad;
  },

  guardar(event) {
    event.preventDefault();

    const empresa = {
      ...DataStore.getEmpresa(),
      nombre: document.getElementById("cfgNombre").value.trim() || "Empresa demo",
      colaboradores: Number(document.getElementById("cfgColaboradores").value) || 0,
      periodicidad: document.getElementById("cfgPeriodicidad").value,
    };

    DataStore.guardarEmpresa(empresa);
    document.getElementById("empinfo").textContent =
      `${empresa.nombre} · ${empresa.ciudad} · ${empresa.colaboradores} colaboradores`;

    mostrarToast("Configuración guardada correctamente.");
  },
};
