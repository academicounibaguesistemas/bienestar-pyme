/**
 * indicadores.js
 * Motor de calculo centralizado de BienEstar PYME. A partir de las
 * encuestas guardadas en localStorage (ver DataStore.getEncuestasGuardadas),
 * calcula los 4 indicadores generales de la empresa, la tendencia frente al
 * periodo anterior, la serie historica para la grafica de lineas, la
 * distribucion del riesgo para la grafica de dona y las alertas automaticas.
 *
 * Sprint 7: la encuesta paso de 5 preguntas sueltas a 24 preguntas
 * organizadas en 6 dimensiones (ver DIMENSIONES_ENCUESTA en data.js:
 * Bienestar personal, Clima organizacional, Carga laboral, Liderazgo,
 * Desarrollo laboral y Equilibrio vida-trabajo). El calculo ahora es:
 * - Cada respuesta Likert (1 a 5) se convierte a escala 0-100 con
 *   aEscala100(v) = (v - 1) / 4 * 100.
 * - Puntaje de cada dimension = aEscala100 del promedio de sus 4 preguntas.
 * - Índice general de bienestar = promedio de las 6 dimensiones.
 * - Clima organizacional = puntaje de la dimension homonima.
 * - Productividad = promedio de Bienestar personal y Carga laboral
 *   (analogo a la formula anterior, que combinaba energia + carga
 *   manejable, ahora a nivel de dimension en vez de pregunta suelta).
 * - Riesgo psicosocial = 100 - promedio de Carga laboral y Equilibrio
 *   vida-trabajo (misma logica que antes: a menor carga manejable y menor
 *   equilibrio, mayor riesgo).
 *
 * Mientras no existan encuestas guardadas, se usan los valores de
 * demostracion (KPIS_DASHBOARD, DIMENSIONES_DEMO, SERIE_*, RIESGO_PSICOSOCIAL,
 * definidos en data.js) para que el prototipo no se vea vacio. En cuanto
 * exista al menos una encuesta real (con las 24 respuestas actuales), esos
 * valores de demostracion dejan de utilizarse.
 *
 * Sprint 4A agrega el desglose real por area (IndicadoresPorArea), el
 * ranking ejecutivo de areas (RankingAreas) y las alertas por area
 * (AlertasPorArea), todo calculado a partir del campo "area" que ya
 * captura la encuesta (ver data.js). Mientras un area no tenga encuestas
 * registradas, simplemente no aparece en estos calculos: no se simula
 * informacion por area bajo ninguna circunstancia.
 *
 * Sprint 4B extiende el mismo patron a los campos "cargo" y "antiguedad"
 * que tambien captura la encuesta: agrega el desglose real por cargo
 * (IndicadoresPorCargo) y por antiguedad (IndicadoresPorAntiguedad), su
 * respectivo ranking ejecutivo (RankingCargos y RankingAntiguedad) y un
 * generador de hallazgos automaticos (HallazgosPrincipales) que redacta
 * frases simples a partir de esos rankings, sin usar inteligencia
 * artificial. Aplican las mismas reglas que en Sprint 4A.
 */

const Indicadores = {
    /** Convierte una respuesta Likert (1-5) a escala 0-100. */
    aEscala100(valorLikert) {
          return ((valorLikert - 1) / 4) * 100;
    },

    /**
         * Calcula los 4 indicadores y el desglose por dimension a partir de un
     * arreglo de encuestas ({ respuestas: number[24] }). Devuelve null si no
     * hay encuestas.
     */
    calcularDesdeEncuestas(encuestas) {
          if (!encuestas.length) return null;

      const totalPreguntas = PREGUNTAS_ENCUESTA.length;
          const promediosPregunta = Array.from({ length: totalPreguntas }, (_, i) => {
                  const valores = encuestas.map(e => e.respuestas[i]);
                  return valores.reduce((a, b) => a + b, 0) / valores.length;
          });

      // Puntaje 0-100 de cada una de las 6 dimensiones (promedio de sus 4 preguntas).
      const dimensiones = {};
          let cursor = 0;
          DIMENSIONES_ENCUESTA.forEach(dim => {
                  const valoresDim = promediosPregunta.slice(cursor, cursor + dim.preguntas.length);
                  const promedioDim = valoresDim.reduce((a, b) => a + b, 0) / valoresDim.length;
                  dimensiones[dim.id] = Math.round(this.aEscala100(promedioDim));
                  cursor += dim.preguntas.length;
          });

      const idsDimensiones = DIMENSIONES_ENCUESTA.map(d => d.id);
          const bienestar = Math.round(
                  idsDimensiones.reduce((suma, id) => suma + dimensiones[id], 0) / idsDimensiones.length
                );
          const clima = dimensiones.climaOrganizacional;
          const productividad = Math.round((dimensiones.bienestarPersonal + dimensiones.cargaLaboral) / 2);
          const riesgo = Math.round(100 - (dimensiones.cargaLaboral + dimensiones.equilibrioVidaTrabajo) / 2);

      return { bienestar, clima, productividad, riesgo, dimensiones };
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
     * periodo anterior, el desglose por dimension del periodo actual, ademas
     * de metadatos (total de encuestas y fecha de la ultima respuesta
     * registrada). Si no hay encuestas guardadas, usa los valores de
     * demostracion definidos en data.js.
     */
    calcularIndicadoresActuales() {
          const encuestas = DataStore.getEncuestasGuardadas();

      if (!encuestas.length) {
              return {
                        hayDatosReales: false,
                        totalEncuestas: 0,
                        fechaActualizacion: null,
                        kpis: KPIS_DASHBOARD,
                        dimensiones: DIMENSIONES_DEMO,
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
              dimensiones: actual.dimensiones,
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
      { campo: "bienestar", invertido: false, indicador: v => `Bienestar general en ${v}` },
      { campo: "riesgo", invertido: true, indicador: v => `Riesgo psicosocial en ${v}%` },
      { campo: "productividad", invertido: false, indicador: v => `Productividad general en ${v}` },
        ],

    /**
         * Evalua los indicadores actuales de la empresa con la misma logica de
     * clasificacion tipo semaforo usada en el resto del sistema
     * (estadoSemaforo, ver utils.js) y devuelve la lista de alertas activas:
     * unicamente los indicadores que no estan en estado "ok". Vease tambien
     * AlertasPorArea para las alertas desagregadas por area (Sprint 4A).
     */
    generar() {
          const info = Indicadores.calcularIndicadoresActuales();

      if (!info.hayDatosReales) {
              return ALERTAS_RECIENTES;
      }

      const alertas = [];
          this.reglas.forEach(regla => {
                  const valor = info.kpis[regla.campo].valor;
                  const estado = estadoSemaforo(valor, regla.invertido);
                  if (estado !== "ok") {
                            alertas.push({ area: "Empresa", indicador: regla.indicador(valor), estado });
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
         * Evalua, para cada area con encuestas reales, el bienestar y el
     * riesgo psicosocial con la misma logica de semaforo usada en el
     * resto del sistema (estadoSemaforo, ver utils.js), en vez de un
     * segundo conjunto de umbrales fijos. Devuelve la lista de alertas
     * activas por area; vacio si ninguna area sale de un estado "ok" o
     * si aun no hay encuestas con area registrada.
     */
    generar() {
          const alertas = [];
          IndicadoresPorArea.calcular().forEach(a => {
                  const estadoBienestar = estadoSemaforo(a.bienestar);
                  if (estadoBienestar !== "ok") {
                            alertas.push({ area: a.area, indicador: `Bienestar de ${a.area} en ${a.bienestar}`, estado: estadoBienestar });
                  }

                                                      const estadoRiesgo = estadoSemaforo(a.riesgo, true);
                  if (estadoRiesgo !== "ok") {
                            alertas.push({ area: a.area, indicador: `Riesgo psicosocial de ${a.area} en ${a.riesgo}%`, estado: estadoRiesgo });
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

/* ---------- Resumen de las 6 dimensiones (Sprint 7) ---------- */

const DimensionesResumen = {
    /**
         * Devuelve el puntaje actual (real o demo) de cada una de las 6
     * dimensiones junto con su nombre legible y su estado tipo semaforo
     * (estadoSemaforo, ver utils.js), ademas de la dimension con mejor y
     * con peor desempeño. Reutilizado por Reportes ("Resultados por
     * dimensión") y por HallazgosSistema (ver analisis.js).
     */
    calcular() {
          const { dimensiones, hayDatosReales } = Indicadores.calcularIndicadoresActuales();

      const lista = DIMENSIONES_ENCUESTA.map(dim => ({
              id: dim.id,
              nombre: dim.nombre,
              puntaje: dimensiones[dim.id],
              estado: estadoSemaforo(dimensiones[dim.id]),
      }));

      return {
              hayDatosReales,
              lista,
              mejor: Indicadores.extremo(lista, "puntaje", "max"),
              peor: Indicadores.extremo(lista, "puntaje", "min"),
      };
    },
};
