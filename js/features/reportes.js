/**
 * reportes.js
 * Logica del modulo "Reportes y alertas": pinta el reporte consolidado
 * de la empresa (calculado dinamicamente por Indicadores a partir de las
 * encuestas guardadas en localStorage), el desglose real de indicadores
 * por area, cargo y antiguedad con su ranking ejecutivo (Sprint 4A y
 * Sprint 4B, ver indicadores.js), el resumen de hallazgos principales
 * generado automaticamente (HallazgosPrincipales), las alertas activas
 * (generales y por area) y genera un PDF de ese panel usando html2pdf.js
 * (libreria ligera cargada via CDN en index.html).
 */

const Reportes = {
  render() {
    const panel = document.getElementById("panelReporte");
    if (!panel) return;

    const info = Indicadores.calcularIndicadoresActuales();
    const porArea = IndicadoresPorArea.calcular();
    const rankingArea = RankingAreas.calcular();
    const porCargo = IndicadoresPorCargo.calcular();
    const rankingCargo = RankingCargos.calcular();
    const porAntiguedad = IndicadoresPorAntiguedad.calcular();
    const rankingAntiguedad = RankingAntiguedad.calcular();
    const hallazgos = HallazgosPrincipales.generar();
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
      ${this.tablaIndicadoresHTML(porArea, "area", "Área", "tAreas", "Aún no hay encuestas con área registrada para calcular indicadores por área.")}
      ${rankingArea ? this.rankingIndicadoresHTML(rankingArea, "area") : ""}

      <h3 class="mt-md">Indicadores por Cargo</h3>
      ${this.tablaIndicadoresHTML(porCargo, "cargo", "Cargo", "tCargos", "Aún no hay encuestas con cargo registrado para calcular indicadores por cargo.")}
      ${rankingCargo ? this.rankingIndicadoresHTML(rankingCargo, "cargo") : ""}

      <h3 class="mt-md">Indicadores por Antigüedad</h3>
      ${this.tablaIndicadoresHTML(porAntiguedad, "antiguedad", "Antigüedad", "tAntiguedad", "Aún no hay encuestas con antigüedad registrada para calcular indicadores por antigüedad.")}
      ${rankingAntiguedad ? this.rankingIndicadoresHTML(rankingAntiguedad, "antiguedad") : ""}

      <h3 class="mt-md">Hallazgos principales</h3>
      ${this.hallazgosHTML(hallazgos)}

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
   * Tabla generica de "Indicadores por ..." (Sprint 4A/4B): una fila por
   * cada grupo (area, cargo o antiguedad) que ya tenga encuestas reales.
   * Reutilizada por las 3 secciones de desglose para no repetir el mismo
   * marcado de tabla tres veces. Si el grupo aun no tiene ninguna
   * encuesta registrada, muestra "mensajeVacio" en su lugar en vez de
   * simular informacion.
   */
  tablaIndicadoresHTML(lista, campo, etiquetaColumna, idTabla, mensajeVacio) {
    if (!lista.length) {
      return `<p class="text-muted">${mensajeVacio}</p>`;
    }

    return `
      <table id="${idTabla}">
        <thead>
          <tr><th>${etiquetaColumna}</th><th>Encuestas</th><th>Bienestar</th><th>Clima</th><th>Productividad</th><th>Riesgo</th></tr>
        </thead>
        <tbody>
          ${lista.map(item => `
            <tr>
              <td>${item[campo]}</td>
              <td>${item.totalEncuestas}</td>
              <td>${item.bienestar}</td>
              <td>${item.clima}</td>
              <td>${item.productividad}</td>
              <td>${item.riesgo}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  /**
   * Resumen ejecutivo generico con el grupo destacado en cada indicador
   * (Sprint 4A/4B), reutilizando la misma tarjeta ".kpi" del resto del
   * panel. "campo" indica el nombre del grupo (area, cargo o antiguedad)
   * dentro de cada elemento del ranking.
   */
  rankingIndicadoresHTML(ranking, campo) {
    const tarjeta = (etiqueta, item, indicador, sufijo = "") => `
      <div class="kpi">
        <div class="kpi__label">${etiqueta}</div>
        <div class="kpi__value">${item[indicador]}${sufijo}</div>
        <div class="kpi__delta">${item[campo]}</div>
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

  /**
   * Bloque "Hallazgos principales" (Sprint 4B): lista las frases
   * generadas automaticamente por HallazgosPrincipales a partir de los
   * rankings por cargo y antiguedad. Se pintan como parrafos simples,
   * sin agregar clases ni estilos nuevos.
   */
  hallazgosHTML(frases) {
    if (!frases.length) {
      return `<p class="text-muted">Aún no hay suficientes encuestas con cargo y antigüedad registrados para generar hallazgos.</p>`;
    }
    return frases.map(f => `<p>${f}</p>`).join("");
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
