/**
 * reportes.js
 * Logica del modulo "Reportes y alertas": pinta el reporte consolidado
 * de la empresa (calculado dinamicamente por Indicadores a partir de las
 * encuestas guardadas en localStorage), el desglose real de indicadores
 * por area con su ranking ejecutivo (Sprint 4A, ver indicadores.js), las
 * alertas activas (generales y por area) y genera un PDF de ese panel
 * usando html2pdf.js (libreria ligera cargada via CDN en index.html).
 * El desglose por cargo o antiguedad queda para un proximo sprint.
 */

const Reportes = {
  render() {
    const panel = document.getElementById("panelReporte");
    if (!panel) return;

    const info = Indicadores.calcularIndicadoresActuales();
    const porArea = IndicadoresPorArea.calcular();
    const ranking = RankingAreas.calcular();
    const alertas = [...Alertas.generar(), ...AlertasPorArea.generar()];

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

      <h3 class="mt-md">Indicadores por área</h3>
      ${this.tablaAreasHTML(porArea)}
      ${ranking ? this.rankingHTML(ranking) : ""}

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

  /**
   * Tabla "Indicadores por Área" (Sprint 4A): una fila por cada area con
   * encuestas reales, ordenada de mayor a menor bienestar. Si aun no hay
   * ninguna encuesta con area registrada, muestra un mensaje en su lugar
   * en vez de simular informacion.
   */
  tablaAreasHTML(porArea) {
    if (!porArea.length) {
      return `<p class="text-muted">Aún no hay encuestas con área registrada para calcular indicadores por área.</p>`;
    }

    return `
      <table id="tAreas">
        <thead>
          <tr><th>Área</th><th>Encuestas</th><th>Bienestar</th><th>Clima</th><th>Productividad</th><th>Riesgo</th></tr>
        </thead>
        <tbody>
          ${porArea.map(a => `
            <tr>
              <td>${a.area}</td>
              <td>${a.totalEncuestas}</td>
              <td>${a.bienestar}</td>
              <td>${a.clima}</td>
              <td>${a.productividad}</td>
              <td>${a.riesgo}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  /**
   * Resumen ejecutivo con el area destacada en cada indicador (Sprint 4A),
   * reutilizando la misma tarjeta ".kpi" del resto del panel.
   */
  rankingHTML(ranking) {
    const tarjeta = (etiqueta, item, campo, sufijo = "") => `
      <div class="kpi">
        <div class="kpi__label">${etiqueta}</div>
        <div class="kpi__value">${item[campo]}${sufijo}</div>
        <div class="kpi__delta">${item.area}</div>
      </div>
    `;

    return `
      <div class="grid-kpis mt-md">
        ${tarjeta("Mayor bienestar", ranking.mayorBienestar, "bienestar")}
        ${tarjeta("Menor bienestar", ranking.menorBienestar, "bienestar")}
        ${tarjeta("Mayor riesgo psicosocial", ranking.mayorRiesgo, "riesgo", "%")}
        ${tarjeta("Mejor productividad", ranking.mejorProductividad, "productividad")}
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
