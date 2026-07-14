/**
 * dashboard.js
 * Logica del modulo "Tablero de indicadores": pinta los KPIs
 * principales, la tabla de alertas recientes y dispara el render
 * de las graficas (delegado en charts.js).
 */

const Dashboard = {
  renderizado: false,

  render() {
    this.renderKpis();
    this.renderAlertas();
    Charts.renderTodas();
    this.renderizado = true;
  },

  renderKpis() {
    const k = KPIS_DASHBOARD;

    this.pintarKpi("k1", k.bienestar);
    this.pintarKpi("k2", k.clima);
    this.pintarKpi("k3", k.productividad);
    this.pintarKpi("k4", k.riesgo);
  },

  pintarKpi(idBase, kpi) {
    const valorEl = document.getElementById(idBase);
    const deltaEl = document.getElementById(idBase + "d");
    if (!valorEl || !deltaEl) return;

    valorEl.textContent = kpi.valor + (kpi.sufijo || "");
    deltaEl.textContent = (kpi.tendencia === "up" ? "▲ " : "▼ ") + kpi.delta;
    deltaEl.className = "kpi__delta " + kpi.tendencia;
  },

  renderAlertas() {
    const tbody = document.querySelector("#tAlert tbody");
    if (!tbody) return;

    tbody.innerHTML = ALERTAS_RECIENTES.map(a => `
      <tr>
        <td>${a.area}</td>
        <td>${a.indicador}</td>
        <td>${badgeHTML(a.estado)}</td>
      </tr>
    `).join("");
  },
};
