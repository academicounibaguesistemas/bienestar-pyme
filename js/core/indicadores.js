/**
 * indicadores.js
 * Motor de calculo centralizado de BienEstar PYME. A partir de las
 * encuestas guardadas en localStorage (ver DataStore.getEncuestasGuardadas),
 * calcula los 4 indicadores generales de la empresa, la tendencia frente al
 * periodo anterior, la serie historica para la grafica de lineas, la
 * distribucion del riesgo para la grafica de dona y las alertas automaticas.
 *
 * Formulas utilizadas (todas sobre una escala de 0 a 100):
 *   - Cada respuesta Likert (1 a 5) se convierte a escala 0-100 con
 *     escala100(v) = (v - 1) / 4 * 100.
 *   - Indice de bienestar   = promedio de las 5 preguntas de la encuesta.
 *   - Clima organizacional  = promedio de las preguntas 2 (ambiente y
 *                              respeto) y 4 (reconocimiento).
 *   - Productividad         = promedio de las preguntas 1 (energia) y 3
 *                              (carga de trabajo manejable).
 *   - Riesgo psicosocial    = 100 - promedio de las preguntas 3 (carga
 *                              manejable) y 5 (equilibrio vida/trabajo): a
 *                              menor carga manejable y menor equilibrio,
 *                              mayor riesgo.
 *
 * Mientras no existan encuestas guardadas, se usan los valores de
 * demostracion (KPIS_DASHBOARD, SERIE_*, RIESGO_PSICOSOCIAL, definidos en
 * data.js) para que el prototipo no se vea vacio. En cuanto exista al menos
 * una encuesta real, esos valores de demostracion dejan de utilizarse.
 */

const Indicadores = {
  /** Convierte una respuesta Likert (1-5) a escala 0-100. */
  aEscala100(valorLikert) {
    return ((valorLikert - 1) / 4) * 100;
  },

  /**
   * Calcula los 4 indicadores a partir de un arreglo de encuestas
   * ({ respuestas: number[5] }). Devuelve null si no hay encuestas.
   */
  calcularDesdeEncuestas(encuestas) {
    if (!encuestas.length) return null;

    const promediosPregunta = [0, 1, 2, 3, 4].map(i => {
      const valores = encuestas.map(e => e.respuestas[i]);
      return valores.reduce((a, b) => a + b, 0) / valores.length;
    });

    const bienestar = Math.round(
      this.aEscala100(promediosPregunta.reduce((a, b) => a + b, 0) / promediosPregunta.length)
    );
    const clima = Math.round(this.aEscala100((promediosPregunta[1] + promediosPregunta[3]) / 2));
    const productividad = Math.round(this.aEscala100((promediosPregunta[0] + promediosPregunta[2]) / 2));
    const riesgo = Math.round(100 - this.aEscala100((promediosPregunta[2] + promediosPregunta[4]) / 2));

    return { bienestar, clima, productividad, riesgo };
  },

  /** Agrupa las encuestas guardadas por mes calendario (para tendencias e historicos). */
  agruparPorMes(encuestas) {
    const grupos = {};
    encuestas.forEach(e => {
      const fecha = new Date(e.fecha);
      const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      if (!grupos[clave]) grupos[clave] = { anio: fecha.getFullYear(), mes: fecha.getMonth(), encuestas: [] };
      grupos[clave].encuestas.push(e);
    });
    return Object.values(grupos).sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));
  },

  /** Texto y tendencia de la variacion entre dos valores del mismo indicador. */
  calcularVariacion(actual, anterior) {
    if (anterior === null || anterior === undefined) {
      return { texto: "Primera medición registrada", tendencia: "up" };
    }
    const diferencia = actual - anterior;
    const signo = diferencia >= 0 ? "+" : "";
    return {
      texto: `${signo}${diferencia} pts vs. período anterior`,
      tendencia: diferencia >= 0 ? "up" : "down",
    };
  },

  /**
   * Calcula los 4 KPIs del tablero/reportes con su variacion respecto al
   * periodo anterior, ademas de metadatos (total de encuestas y fecha de
   * la ultima respuesta registrada). Si no hay encuestas guardadas, usa
   * los valores de demostracion definidos en data.js.
   */
  calcularIndicadoresActuales() {
    const encuestas = DataStore.getEncuestasGuardadas();

    if (!encuestas.length) {
      return {
        hayDatosReales: false,
        totalEncuestas: 0,
        fechaActualizacion: null,
        kpis: KPIS_DASHBOARD,
      };
    }

    const grupos = this.agruparPorMes(encuestas);
    const actual = this.calcularDesdeEncuestas(grupos[grupos.length - 1].encuestas);
    const anterior = grupos.length > 1 ? this.calcularDesdeEncuestas(grupos[grupos.length - 2].encuestas) : null;

    const construirKpi = (valor, valorAnterior, sufijo = "") => {
      const variacion = this.calcularVariacion(valor, valorAnterior);
      return { valor, sufijo, delta: variacion.texto, tendencia: variacion.tendencia };
    };

    const ultimaFecha = encuestas.reduce((max, e) => (e.fecha > max ? e.fecha : max), encuestas[0].fecha);

    return {
      hayDatosReales: true,
      totalEncuestas: encuestas.length,
      fechaActualizacion: ultimaFecha,
      kpis: {
        bienestar: construirKpi(actual.bienestar, anterior && anterior.bienestar),
        clima: construirKpi(actual.clima, anterior && anterior.clima),
        productividad: construirKpi(actual.productividad, anterior && anterior.productividad),
        riesgo: construirKpi(actual.riesgo, anterior && anterior.riesgo, "%"),
      },
    };
  },
};

/* ---------- Serie historica para la grafica de evolucion (linea) ---------- */

const SerieHistorica = {
  nombresMes: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],

  /** Devuelve { labels, bienestar[], productividad[] } a partir de las encuestas guardadas. */
  calcular() {
    const encuestas = DataStore.getEncuestasGuardadas();
    if (!encuestas.length) {
      return { labels: SERIE_MESES, bienestar: SERIE_BIENESTAR, productividad: SERIE_PRODUCTIVIDAD };
    }

    const grupos = Indicadores.agruparPorMes(encuestas);
    return {
      labels: grupos.map(g => this.nombresMes[g.mes]),
      bienestar: grupos.map(g => Indicadores.calcularDesdeEncuestas(g.encuestas).bienestar),
      productividad: grupos.map(g => Indicadores.calcularDesdeEncuestas(g.encuestas).productividad),
    };
  },
};

/* ---------- Distribucion del riesgo psicosocial para la grafica de dona ---------- */

const DistribucionRiesgo = {
  /** Devuelve { "Controlado": n, "En atención": n } a partir del riesgo actual. */
  calcular() {
    const info = Indicadores.calcularIndicadoresActuales();
    if (!info.hayDatosReales) return RIESGO_PSICOSOCIAL;

    const riesgo = info.kpis.riesgo.valor;
    return { "Controlado": 100 - riesgo, "En atención": riesgo };
  },
};

/* ---------- Motor de alertas automaticas basado en reglas ---------- */

const Alertas = {
  reglas: [
    { campo: "bienestar", cumple: v => v < 70, indicador: v => `Bienestar general en ${v}`, estado: "warn" },
    { campo: "riesgo", cumple: v => v > 80, indicador: v => `Riesgo psicosocial en ${v}%`, estado: "danger" },
    { campo: "productividad", cumple: v => v < 75, indicador: v => `Productividad general en ${v}`, estado: "warn" },
  ],

  /**
   * Evalua las reglas sobre los indicadores actuales de la empresa y
   * devuelve la lista de alertas activas. Mientras no exista un modulo de
   * areas/colaboradores (Sprint 4), las alertas son de alcance general.
   */
  generar() {
    const info = Indicadores.calcularIndicadoresActuales();

    if (!info.hayDatosReales) {
      return ALERTAS_RECIENTES;
    }

    const alertas = [];
    this.reglas.forEach(regla => {
      const valor = info.kpis[regla.campo].valor;
      if (regla.cumple(valor)) {
        alertas.push({ area: "Empresa", indicador: regla.indicador(valor), estado: regla.estado });
      }
    });
    return alertas;
  },
};
