/**
 * dashboard.js
 * Logica del modulo "Tablero de indicadores": pinta los 4 KPIs
 * principales calculados dinamicamente por Indicadores (ver
 * indicadores.js) a partir de las encuestas guardadas en localStorage,
 * la fecha de la ultima actualizacion, la tabla de alertas automaticas
 * (Alertas.generar) y dispara el render de las graficas (delegado en
 * charts.js). Mientras no existan encuestas guardadas, se muestran los
 * valores de demostracion definidos en data.js.
 */

const Dashboard = {
  renderizado: false,

  render() {
    this.renderKpis();
    this.renderActualizacion();
    this.renderAlertas();
    Charts.renderTodas();
    this.renderizado = true;
  },

  renderKpis() {
    const { kpis } = Indicadores.calcularIndicadoresActuales();

    this.pintarKpi("k1", kpis.bienestar);
    this.pintarKpi("k2", kpis.clima);
    this.pintarKpi("k3", kpis.productividad);
    this.pintarKpi("k4", kpis.riesgo);
  },

  pintarKpi(idBase, kpi) {
    const valorEl = document.getElementById(idBase);
    const deltaEl = document.getElementById(idBase + "d");
    if (!valorEl || !deltaEl) return;

    valorEl.textContent = kpi.valor + (kpi.sufijo || "");
    deltaEl.textContent = (kpi.tendencia === "up" ? "▲ " : "▼ ") + kpi.delta;
    deltaEl.className = "kpi__delta " + kpi.tendencia;
  },

  /**
   * Muestra, debajo de los KPIs, el total de encuestas registradas y la
   * fecha de la mas reciente. El elemento se crea una sola vez (la
   * primera vez que se renderiza el tablero) reutilizando la clase
   * ".text-muted" ya existente, y en los siguientes renders solo se
   * actualiza su contenido.
   */
  renderActualizacion() {
    const grid = document.querySelector("#dash .grid-kpis");
    if (!grid) return;

    let nota = document.getElementById("dashActualizacion");
    if (!nota) {
      nota = crearElemento("p", "text-muted mt-md");
      nota.id = "dashActualizacion";
      grid.insertAdjacentElement("afterend", nota);
    }

    const info = Indicadores.calcularIndicadoresActuales();
    nota.textContent = info.hayDatosReales
      ? `${info.totalEncuestas} encuesta(s) registrada(s) · última actualización: ${fechaLarga(new Date(info.fechaActualizacion))}`
      : "Aún no se han registrado encuestas · mostrando datos de demostración.";
  },

  renderAlertas() {
    const tbody = document.querySelector("#tAlert tbody");
    if (!tbody) return;

    const alertas = Alertas.generar();
    tbody.innerHTML = alertas.length
      ? alertas.map(a => `
          <tr>
            <td>${a.area}</td>
            <td>${a.indicador}</td>
            <td>${badgeHTML(a.estado)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="3" class="text-muted">Sin alertas activas.</td></tr>`;
  },
};
