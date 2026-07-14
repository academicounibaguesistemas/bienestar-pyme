/**
 * charts.js
 * Inicializacion de las graficas de Chart.js usadas en el tablero.
 * Centraliza la paleta de colores (leida desde las variables CSS)
 * para que todas las graficas luzcan consistentes con el resto
 * de la interfaz. Los datos de las graficas de linea (evolucion) y de
 * dona (riesgo) se calculan dinamicamente (ver indicadores.js) a partir
 * de las encuestas guardadas en localStorage. Desde el Sprint 4A, la
 * grafica de barras tambien es dinamica: usa IndicadoresPorArea para
 * mostrar el bienestar real de cada area que ya tiene encuestas
 * respondidas (las areas sin respuestas no se muestran); mientras no
 * exista ninguna encuesta real, se usa BIENESTAR_POR_AREA (datos de
 * demostracion definidos en data.js) para que el prototipo no se vea
 * vacio.
 */

const Charts = {
  instancias: {},

  /** Paleta ciclica reutilizada por las graficas de barras y dona. */
  paleta() {
    return [cssVar("--color-primary"), cssVar("--color-success"), cssVar("--color-warning"), cssVar("--color-danger")];
  },

  /** Grafica de lineas: evolucion de bienestar y productividad. */
  renderLineChart() {
    const ctx = document.getElementById("chLine");
    if (!ctx) return;
    if (this.instancias.line) this.instancias.line.destroy();

    const serie = SerieHistorica.calcular();

    this.instancias.line = new Chart(ctx, {
      type: "line",
      data: {
        labels: serie.labels,
        datasets: [
          {
            label: "Bienestar",
            data: serie.bienestar,
            borderColor: cssVar("--color-primary"),
            backgroundColor: "rgba(37,99,235,0.08)",
            tension: 0.35,
            fill: true,
          },
          {
            label: "Productividad",
            data: serie.productividad,
            borderColor: cssVar("--color-success"),
            backgroundColor: "rgba(22,163,74,0.06)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { suggestedMin: 50, suggestedMax: 100 } },
      },
    });
  },

  /**
   * Grafica de barras: bienestar por area. Usa los indicadores reales
   * por area (Sprint 4A) cuando ya existen encuestas respondidas; solo
   * aparecen las areas que efectivamente tienen respuestas. Mientras no
   * exista ninguna encuesta real, muestra los datos de demostracion.
   */
  renderBarChart() {
    const ctx = document.getElementById("chBar");
    if (!ctx) return;
    if (this.instancias.bar) this.instancias.bar.destroy();

    const porArea = IndicadoresPorArea.calcular();
    const datos = porArea.length
      ? Object.fromEntries(porArea.map(a => [a.area, a.bienestar]))
      : BIENESTAR_POR_AREA;

    const paleta = this.paleta();

    this.instancias.bar = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(datos),
        datasets: [{
          data: Object.values(datos),
          backgroundColor: Object.keys(datos).map((_, i) => paleta[i % paleta.length]),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { suggestedMin: 0, suggestedMax: 100 } },
      },
    });
  },

  /** Grafica de dona: distribucion del riesgo psicosocial. */
  renderDonutChart() {
    const ctx = document.getElementById("chDon");
    if (!ctx) return;
    if (this.instancias.donut) this.instancias.donut.destroy();

    const distribucion = DistribucionRiesgo.calcular();

    this.instancias.donut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(distribucion),
        datasets: [{
          data: Object.values(distribucion),
          backgroundColor: [cssVar("--color-success"), cssVar("--color-warning")],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        cutout: "65%",
      },
    });
  },

  renderTodas() {
    this.renderLineChart();
    this.renderBarChart();
    this.renderDonutChart();
  },
};
