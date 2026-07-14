/**
* analisis.js
* Sprint 6: capa de analisis ejecutivo para la toma de decisiones.
* Reutiliza el motor de calculo de indicadores.js (Indicadores,
* RankingAreas) y los helpers de semaforo/tendencia de utils.js. No
* vuelve a calcular nada que ya exista: solo compone la comparacion
* entre periodos, el resumen ejecutivo y los hallazgos + recomendaciones
* automaticas (reglas simples sobre datos ya calculados, sin
* inteligencia artificial).
*/

/* ---------- Comparacion entre el periodo activo y el anterior ---------- */

const TendenciaPeriodos = {
  /**
   * Agrupa las encuestas guardadas que ya tengan un periodo asignado
   * (ver DataStore.guardarRespuestaEncuesta) por el nombre de ese
   * periodo, respetando el orden cronologico en que los periodos
   * fueron creados (DataStore.getPeriodos()). Los periodos sin
   * encuestas reales no se incluyen.
   */
  agruparPorPeriodo() {
    const encuestas = DataStore.getEncuestasGuardadas().filter(e => !!e.periodo);
    return DataStore.getPeriodos()
      .map(p => ({ nombre: p.nombre, encuestas: encuestas.filter(e => e.periodo === p.nombre) }))
      .filter(g => g.encuestas.length > 0);
  },

  /**
   * Compara los indicadores (reutilizando Indicadores.calcularDesdeEncuestas)
   * del periodo activo contra el periodo inmediatamente anterior con
   * encuestas reales. Devuelve null si aun no hay al menos dos periodos
   * con encuestas registradas.
   */
  calcular() {
    const grupos = this.agruparPorPeriodo();
    if (grupos.length < 2) return null;

    const actual = grupos[grupos.length - 1];
    const anterior = grupos[grupos.length - 2];
    const indActual = Indicadores.calcularDesdeEncuestas(actual.encuestas);
    const indAnterior = Indicadores.calcularDesdeEncuestas(anterior.encuestas);

    const comparar = (campo, invertido = false) => {
      const absoluta = indActual[campo] - indAnterior[campo];
      const porcentual = indAnterior[campo] ? Math.round((absoluta / indAnterior[campo]) * 1000) / 10 : 0;
      return {
        actual: indActual[campo],
        anterior: indAnterior[campo],
        absoluta,
        porcentual,
        flecha: flechaTendencia(absoluta),
        estado: estadoTendencia(absoluta, invertido),
      };
    };

    return {
      periodoActual: actual.nombre,
      periodoAnterior: anterior.nombre,
      bienestar: comparar("bienestar"),
      clima: comparar("clima"),
      productividad: comparar("productividad"),
      riesgo: comparar("riesgo", true),
    };
  },
};

/* ---------- Resumen ejecutivo ---------- */

const ResumenEjecutivo = {
  /**
   * Compone el resumen ejecutivo exclusivamente con datos ya calculados
   * por Indicadores.calcularIndicadoresActuales, RankingAreas.calcular y
   * TendenciaPeriodos.calcular: no repite ningun calculo.
   */
  calcular() {
    const info = Indicadores.calcularIndicadoresActuales();
    const rankingArea = RankingAreas.calcular();

    return {
      hayDatosReales: info.hayDatosReales,
      kpis: info.kpis,
      totalEncuestas: info.totalEncuestas,
      fechaActualizacion: info.fechaActualizacion,
      areaMayorBienestar: rankingArea ? rankingArea.mayorBienestar : null,
      areaMayorRiesgo: rankingArea ? rankingArea.mayorRiesgo : null,
      tendencia: TendenciaPeriodos.calcular(),
    };
  },
};

/* ---------- Hallazgos y recomendaciones automaticas (motor de reglas) ---------- */

const HallazgosSistema = {
  /**
   * Cada regla lee la comparacion entre periodos (TendenciaPeriodos) ya
   * calculada y, si se cumple la condicion, agrega su hallazgo con las
   * recomendaciones asociadas. Son reglas simples sobre datos reales,
   * sin inteligencia artificial.
   */
  reglas: [
    {
      cumple: t => !!t && t.bienestar.absoluta < 0,
      generar: t => ({
        texto: "El bienestar disminuyó " + Math.abs(t.bienestar.porcentual) + "% respecto al período anterior (" + t.periodoAnterior + " → " + t.periodoActual + ").",
        recomendaciones: ["Implementar actividades de bienestar.", "Revisar cargas laborales.", "Realizar seguimiento mensual."],
      }),
    },
    {
      cumple: t => !!t && t.bienestar.absoluta > 0,
      generar: t => ({
        texto: "El bienestar mejoró " + Math.abs(t.bienestar.porcentual) + "% respecto al período anterior (" + t.periodoAnterior + " → " + t.periodoActual + ").",
        recomendaciones: ["Mantener las actividades de bienestar vigentes.", "Reconocer y replicar las buenas prácticas del período."],
      }),
    },
    {
      cumple: t => !!t && t.riesgo.absoluta > 0,
      generar: t => ({
        texto: "El riesgo psicosocial aumentó " + Math.abs(t.riesgo.porcentual) + "% respecto al período anterior.",
        recomendaciones: ["Intervenir el área crítica.", "Revisar cargas laborales.", "Fortalecer liderazgo.", "Realizar seguimiento mensual."],
      }),
    },
    {
      cumple: t => !!t && t.riesgo.absoluta < 0,
      generar: t => ({
        texto: "El riesgo psicosocial disminuyó " + Math.abs(t.riesgo.porcentual) + "% respecto al período anterior.",
        recomendaciones: ["Mantener el seguimiento mensual del riesgo psicosocial."],
      }),
    },
    {
      cumple: t => !!t && t.productividad.absoluta > 0,
      generar: t => ({
        texto: "La productividad mejoró " + Math.abs(t.productividad.porcentual) + "% respecto al período anterior.",
        recomendaciones: ["Reconocer a los equipos con mejor desempeño.", "Documentar y replicar las buenas prácticas."],
      }),
    },
    {
      cumple: t => !!t && t.productividad.absoluta < 0,
      generar: t => ({
        texto: "La productividad disminuyó " + Math.abs(t.productividad.porcentual) + "% respecto al período anterior.",
        recomendaciones: ["Revisar cargas laborales.", "Fortalecer liderazgo.", "Realizar seguimiento mensual."],
      }),
    },
    {
      cumple: t => !!t && t.clima.absoluta === 0,
      generar: t => ({
        texto: "El clima organizacional permanece estable respecto al período anterior (" + t.periodoAnterior + " → " + t.periodoActual + ").",
        recomendaciones: ["Continuar el monitoreo periódico del clima organizacional."],
      }),
    },
  ],

  /**
   * Hallazgo adicional sobre el area con menor desempeño (menor
   * bienestar), reutilizando RankingAreas.calcular. Es independiente de
   * si hay comparacion entre periodos.
   */
  hallazgoAreaMenorDesempeno() {
    const ranking = RankingAreas.calcular();
    if (!ranking) return null;
    return {
      texto: "El área \"" + ranking.menorBienestar.area + "\" presenta el menor desempeño (" + ranking.menorBienestar.bienestar + " pts de bienestar).",
      recomendaciones: ["Intervenir el área crítica.", "Fortalecer liderazgo.", "Revisar cargas laborales.", "Realizar seguimiento mensual."],
    };
  },

  /** Genera la lista final de hallazgos + recomendaciones a partir de las reglas anteriores. */
  generar() {
    const tendencia = TendenciaPeriodos.calcular();
    const hallazgos = this.reglas.filter(r => r.cumple(tendencia)).map(r => r.generar(tendencia));

    const areaMenor = this.hallazgoAreaMenorDesempeno();
    if (areaMenor) hallazgos.push(areaMenor);

    return hallazgos;
  },
};
