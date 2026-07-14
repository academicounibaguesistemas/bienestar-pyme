/**
 * reportes.js
 * Logica del modulo "Reportes y alertas": pinta la tabla
 * consolidada por area y genera un PDF de esa tabla usando
 * html2pdf.js (libreria ligera cargada via CDN en index.html).
 */

const Reportes = {
  render() {
    const tbody = document.querySelector("#tReporte tbody");
    if (!tbody) return;

    tbody.innerHTML = REPORTE_AREAS.map(r => `
      <tr>
        <td>${r.area}</td>
        <td>${r.bienestar}</td>
        <td>${r.clima}</td>
        <td>${r.productividad}</td>
        <td>${r.rotacion}%</td>
        <td><span class="badge ${claseBadge(r.estado)}">${etiquetaEstado(r.estado)}</span></td>
      </tr>
    `).join("");
  },

  /** Exporta el panel del reporte consolidado a un archivo PDF. */
  exportarPDF() {
    const elemento = document.getElementById("panelReporte");
    if (!elemento || typeof html2pdf === "undefined") {
      mostrarToast("No fue posible generar el PDF.", "error");
      return;
    }

    const empresa = DataStore.getEmpresa();
    const opciones = {
      margin: 12,
      filename: `reporte-bienestar-${empresa.nombre.replace(/\s+/g, "_").toLowerCase()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    mostrarToast("Generando PDF...");
    html2pdf().set(opciones).from(elemento).save();
  },
};
