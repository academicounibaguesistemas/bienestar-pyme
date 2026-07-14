/**
 * indicadores.js
 * Motor de calculo centralizado de BienEstar PYME. A partir de las
 * encuestas guardadas en localStorage (ver DataStore.getEncuestasGuardadas),
 * calcula los 4 indicadores generales de la empresa, la tendencia frente al
 * periodo anterior, la serie historica para la grafica de lineas, la
 * distribucion del riesgo para la grafica de dona y las alertas automaticas.
 *
 * Formulas utilizadas (todas sobre una escala de 0 a 100):
 * - Cada respuesta Likert (1 a 5) se convierte a escala 0-100 con
 *   escala100(v) = (v - 1) / 4 * 100.
 * - Indice de bienestar = promedio de las 5 preguntas de la encuesta.
 * - Clima organizacional = promedio de las preguntas 2 (ambiente y
 *   respeto) y 4 (reconocimiento).
 * - Productividad = promedio de las preguntas 1 (energia) y 3
 *   (carga de trabajo manejable).
 * - Riesgo psicosocial = 100 - promedio de las preguntas 3 (carga
 *   manejable) y 5 (equilibrio vida/trabajo): a
 *   menor carga manejable y menor equilibrio,
 *   mayor riesgo.
 *
 * Mientras no existan encuestas guardadas, se usan los valores de
 * demostracion (KPIS_DASHBOARD, SERIE_*, RIESGO_PSICOSOCIAL, definidos en
 * data.js) para que el prototipo no se vea vacio. En cuanto exista al menos
 * una encuesta real, esos valores de demostracion dejan de utilizarse.
 *
 * Sprint 4A agrega el desglose real por area (IndicadoresPorArea), el
 * ranking ejecutivo de areas (RankingAreas) y las alertas por area
 * (AlertasPorArea), todo calculado a partir del campo "area" que ya
 * captura la encuesta (ver data.js). Mientras un area no tenga encuestas
 * registradas, simplemente no aparece en estos calculos: no se simula
 * informacion por area bajo ninguna circunstancia. Las encuestas
 * registradas antes del Sprint 3 (que no guardaron area) tampoco se
 * incluyen en el desglose por area, para no mostrar una area "vacia".
 *
 * Sprint 4B extiende el mismo patron a los campos "cargo" y "antiguedad"
 * que tambien captura la encuesta: agrega el desglose real por cargo
 * (IndicadoresPorCargo) y por antiguedad (IndicadoresPorAntiguedad), su
 * respectivo ranking ejecutivo (RankingCargos y RankingAntiguedad) y un
 * generador de hallazgos automaticos (HallazgosPrincipales) que redacta
 * frases simples a partir de esos rankings, sin usar inteligencia
 * artificial. Aplican las mismas reglas que en Sprint 4A: un cargo o un
 * grupo de antiguedad sin encuestas reales nunca aparece en estos calculos.
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
   * Devuelve el elemento de la lista con el valor mas alto ("max") o mas
   * bajo ("min") de "campo". Centraliza la logica de ranking reutilizada
   * por RankingCargos y RankingAntiguedad (Sprint 4B) para no repetir el
   * mismo reduce() en cada modulo.
   */
  extremo(lista, campo, modo = "max") {
    return lista.reduce((seleccionado, actual) => {
      if (modo === "min") return actual[campo] < seleccionado[campo] ? actual : seleccionado;
      return actual[campo] > seleccionado[campo] ? actual : seleccionado;
    });
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
   * devuelve la lista de alertas activas. Vease tambien AlertasPorArea
   * para las alertas desagregadas por area (Sprint 4A).
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

/* ---------- Indicadores desagregados por area (Sprint 4A) ---------- */

const IndicadoresPorArea = {
  /**
   * Agrupa las encuestas guardadas por el campo "area" (tal como lo
   * selecciono el colaborador al responder) y calcula los 4 indicadores
   * para cada area que tenga al menos una encuesta real. Las areas sin
   * respuestas registradas no se incluyen, y las encuestas antiguas que
   * no capturaron area (previas al Sprint 3) se ignoran en este calculo:
   * nunca se simula informacion por area. Devuelve un arreglo ordenado
   * de mayor a menor bienestar.
   */
  calcular() {
    const encuestas = DataStore.getEncuestasGuardadas().filter(e => !!e.area);
    if (!encuestas.length) return [];

    const grupos = {};
    encuestas.forEach(e => {
      if (!grupos[e.area]) grupos[e.area] = [];
      grupos[e.area].push(e);
    });

    return Object.keys(grupos)
      .map(area => ({
        area,
        totalEncuestas: grupos[area].length,
        ...Indicadores.calcularDesdeEncuestas(grupos[area]),
      }))
      .sort((a, b) => b.bienestar - a.bienestar);
  },
};

/* ---------- Ranking ejecutivo de areas (Sprint 4A) ---------- */

const RankingAreas = {
  /**
   * Devuelve el area destacada en cada uno de los 4 indicadores
   * (mayor bienestar, menor bienestar, mayor riesgo psicosocial y
   * mejor productividad), o null si todavia no hay ninguna encuesta
   * con area registrada.
   */
  calcular() {
    const porArea = IndicadoresPorArea.calcular();
    if (!porArea.length) return null;

    const mejorEn = campo => porArea.reduce((mejor, actual) => (actual[campo] > mejor[campo] ? actual : mejor));
    const peorEn = campo => porArea.reduce((peor, actual) => (actual[campo] < peor[campo] ? actual : peor));

    return {
      mayorBienestar: mejorEn("bienestar"),
      menorBienestar: peorEn("bienestar"),
      mayorRiesgo: mejorEn("riesgo"),
      mejorProductividad: mejorEn("productividad"),
    };
  },
};

/* ---------- Alertas por area (Sprint 4A) ---------- */

const AlertasPorArea = {
  /**
   * Evalua, para cada area con encuestas reales, si el bienestar es
   * inferior a 70 o el riesgo psicosocial es superior a 80 (los mismos
   * umbrales usados por Alertas para la empresa). Devuelve la lista de
   * alertas activas por area; vacio si ninguna area supera los umbrales
   * o si aun no hay encuestas con area registrada.
   */
  generar() {
    const alertas = [];
    IndicadoresPorArea.calcular().forEach(a => {
      if (a.bienestar < 70) {
        alertas.push({ area: a.area, indicador: `Bienestar de ${a.area} en ${a.bienestar}`, estado: "warn" });
      }
      if (a.riesgo > 80) {
        alertas.push({ area: a.area, indicador: `Riesgo psicosocial de ${a.area} en ${a.riesgo}%`, estado: "danger" });
      }
    });
    return alertas;
  },
};

/* ---------- Indicadores desagregados por cargo (Sprint 4B) ---------- */

const IndicadoresPorCargo = {
  /**
   * Agrupa las encuestas guardadas por el campo "cargo" (seleccionado
   * por el colaborador al responder) y calcula los 4 indicadores para
   * cada cargo que tenga al menos una encuesta real, reutilizando
   * Indicadores.calcularDesdeEncuestas (igual que IndicadoresPorArea).
   * Los cargos sin respuestas registradas no se incluyen. Devuelve un
   * arreglo ordenado de mayor a menor bienestar.
   */
  calcular() {
    const encuestas = DataStore.getEncuestasGuardadas().filter(e => !!e.cargo);
    if (!encuestas.length) return [];

    const grupos = {};
    encuestas.forEach(e => {
      if (!grupos[e.cargo]) grupos[e.cargo] = [];
      grupos[e.cargo].push(e);
    });

    return Object.keys(grupos)
      .map(cargo => ({
        cargo,
        totalEncuestas: grupos[cargo].length,
        ...Indicadores.calcularDesdeEncuestas(grupos[cargo]),
      }))
      .sort((a, b) => b.bienestar - a.bienestar);
  },
};

/* ---------- Ranking ejecutivo de cargos (Sprint 4B) ---------- */

const RankingCargos = {
  /**
   * Devuelve el cargo destacado en cada indicador (mayor bienestar,
   * menor bienestar, mayor riesgo psicosocial, mejor productividad y
   * menor productividad), reutilizando Indicadores.extremo. Devuelve
   * null si todavia no hay ninguna encuesta con cargo registrado.
   */
  calcular() {
    const porCargo = IndicadoresPorCargo.calcular();
    if (!porCargo.length) return null;

    return {
      mayorBienestar: Indicadores.extremo(porCargo, "bienestar", "max"),
      menorBienestar: Indicadores.extremo(porCargo, "bienestar", "min"),
      mayorRiesgo: Indicadores.extremo(porCargo, "riesgo", "max"),
      mejorProductividad: Indicadores.extremo(porCargo, "productividad", "max"),
      menorProductividad: Indicadores.extremo(porCargo, "productividad", "min"),
    };
  },
};

/* ---------- Indicadores desagregados por antiguedad (Sprint 4B) ---------- */

const IndicadoresPorAntiguedad = {
  /**
   * Igual que IndicadoresPorCargo, pero agrupando por el campo
   * "antiguedad". A diferencia del desglose por area/cargo (ordenado por
   * bienestar), aqui se ordena segun el orden cronologico definido en
   * ANTIGUEDAD_ENCUESTA (ver data.js), de menor a mayor tiempo en la
   * empresa, para que la tabla de Reportes se lea de forma progresiva.
   */
  calcular() {
    const encuestas = DataStore.getEncuestasGuardadas().filter(e => !!e.antiguedad);
    if (!encuestas.length) return [];

    const grupos = {};
    encuestas.forEach(e => {
      if (!grupos[e.antiguedad]) grupos[e.antiguedad] = [];
      grupos[e.antiguedad].push(e);
    });

    return Object.keys(grupos)
      .map(antiguedad => ({
        antiguedad,
        totalEncuestas: grupos[antiguedad].length,
        ...Indicadores.calcularDesdeEncuestas(grupos[antiguedad]),
      }))
      .sort((a, b) => ANTIGUEDAD_ENCUESTA.indexOf(a.antiguedad) - ANTIGUEDAD_ENCUESTA.indexOf(b.antiguedad));
  },
};

/* ---------- Ranking ejecutivo por antiguedad (Sprint 4B) ---------- */

const RankingAntiguedad = {
  /**
   * Igual que RankingCargos, pero para los grupos de antiguedad. Devuelve
   * null si todavia no hay ninguna encuesta con antiguedad registrada.
   */
  calcular() {
    const porAntiguedad = IndicadoresPorAntiguedad.calcular();
    if (!porAntiguedad.length) return null;

    return {
      mayorBienestar: Indicadores.extremo(porAntiguedad, "bienestar", "max"),
      menorBienestar: Indicadores.extremo(porAntiguedad, "bienestar", "min"),
      mayorRiesgo: Indicadores.extremo(porAntiguedad, "riesgo", "max"),
      mejorProductividad: Indicadores.extremo(porAntiguedad, "productividad", "max"),
      menorProductividad: Indicadores.extremo(porAntiguedad, "productividad", "min"),
    };
  },
};

/* ---------- Hallazgos automaticos por cargo y antiguedad (Sprint 4B) ---------- */

const HallazgosPrincipales = {
  /**
   * Redacta frases sencillas a partir de RankingCargos y
   * RankingAntiguedad mediante reglas simples (sin inteligencia
   * artificial): solo leen los indicadores ya calculados y eligen el
   * texto segun sus valores. Devuelve un arreglo de frases; vacio si aun
   * no hay encuestas con cargo ni con antiguedad registrados.
   */
  generar() {
    const frases = [];
    const rankingCargos = RankingCargos.calcular();
    const rankingAntiguedad = RankingAntiguedad.calcular();

    if (rankingCargos) {
      frases.push(
        `El mayor nivel de bienestar se presenta en el cargo "${rankingCargos.mayorBienestar.cargo}" (${rankingCargos.mayorBienestar.bienestar} pts).`
      );
      frases.push(
        `El mayor riesgo psicosocial se concentra en el cargo "${rankingCargos.mayorRiesgo.cargo}" (${rankingCargos.mayorRiesgo.riesgo}%).`
      );
    }

    if (rankingAntiguedad) {
      const porAntiguedad = IndicadoresPorAntiguedad.calcular();
      const mayorAntiguedad = porAntiguedad[porAntiguedad.length - 1];
      const nivelBienestar =
        mayorAntiguedad.bienestar >= 75 ? "un bienestar alto" : mayorAntiguedad.bienestar >= 65 ? "un bienestar moderado" : "un bienestar bajo";
      frases.push(
        `Los colaboradores con mayor antigüedad ("${mayorAntiguedad.antiguedad}") presentan ${nivelBienestar} (${mayorAntiguedad.bienestar} pts) y un riesgo psicosocial de ${mayorAntiguedad.riesgo}%.`
      );
    }

    if (rankingCargos || rankingAntiguedad) {
      const candidatos = [];
      if (rankingCargos) {
        candidatos.push({ etiqueta: `el cargo "${rankingCargos.menorProductividad.cargo}"`, valor: rankingCargos.menorProductividad.productividad });
      }
      if (rankingAntiguedad) {
        candidatos.push({
          etiqueta: `el grupo de antigüedad "${rankingAntiguedad.menorProductividad.antiguedad}"`,
          valor: rankingAntiguedad.menorProductividad.productividad,
        });
      }
      const menor = candidatos.reduce((peor, actual) => (actual.valor < peor.valor ? actual : peor));
      frases.push(`El grupo con menor productividad corresponde a ${menor.etiqueta} (${menor.valor} pts).`);
    }

    return frases;
  },
};
