/**
 * reportes.js
 * Logica del modulo "Reportes y alertas": pinta el reporte consolidado
 * de la empresa (calculado dinamicamente por Indicadores a partir de las
 * encuestas guardadas en localStorage) y genera un PDF de ese panel
 * usando html2pdf.js (libreria ligera cargada via CDN en index.html).
 * El desglose por area, cargo o antiguedad se implementara en un
 * proximo sprint, cuando la plataforma explote los campos de
 * clasificacion que ya se guardan en cada encuesta (ver data.js).
 */

const Reportes = {
  render() {
    const panel = document.getElementById("panelReporte");
    if (!panel) return;

    const info = Indicadores.calcularIndicadoresActuales();
    const alertas = Alertas.generar();

    panel.innerHTML = `
      <h3>Reporte consolidado de la empresa</h3>
      <div class="grid-kpis">
        ${this.kpiHTML("Índice de bienestar", info.kpis.bienestar)}
        ${this.kpiHTML("Clima organizacional", info.kpis.clima)}
        ${this.kpiHTML("Productividad", info.kpis.productividad)}
        ${this.kpiHTML("Riesgo psicosocial", info.kpis.riesgo)}
      </div>

      <p class="text-muted mt-md">
        ${info.hayDatosReales
          ? `${info.totalEncuestas} encuesta(s) registrada(s) · última actualización: ${fechaLarga(new Date(info.fechaActualizacion))}`
          : "Aún no se han registrado encuestas · mostrando datos de demostración."}
      </p>

      <h3 class="mt-md">Alertas activas</h3>
      <table id="tAlertReporte">
        <thead><tr><th>Área</th><th>Indicador</th><th>Estado</th></tr></thead>
        <tbody>
          ${alertas.length
            ? alertas.map(a => `
                <tr>
                  <td>${a.area}</td>
                  <td>${a.indicador}</td>
                  <td>${badgeHTML(a.estado)}</td>
                </tr>
              `).join("")
            : `<tr><td colspan="3" class="text-muted">Sin alertas activas.</td></tr>`}
        </tbody>
      </table>
    `;
  },

  /** Genera el marcado de una tarjeta KPI reutilizando la clase ".kpi" del Sprint 2. */
  kpiHTML(etiqueta, kpi) {
    return `
      <div class="kpi">
        <div class="kpi__label">${etiqueta}</div>
        <div class="kpi__value">${kpi.valor}${kpi.sufijo || ""}</div>
        <div class="kpi__delta ${kpi.tendencia}">${kpi.tendencia === "up" ? "▲ " : "▼ "}${kpi.delta}</div>
      </div>
    `;
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
