/**
 * encuestas.js
 * Logica del modulo "Encuestas de bienestar": genera el formulario de
 * clasificacion del colaborador (area, cargo, antiguedad) y la encuesta
 * tipo Likert organizada por dimensiones (ver DIMENSIONES_ENCUESTA en
 * data.js), controla la barra de progreso y guarda la respuesta en
 * localStorage.
 *
 * Sprint 7: la encuesta ya no es una lista plana de preguntas, sino 6
 * tarjetas (una por dimension), cada una con su nombre, una breve
 * descripcion y sus 4 preguntas tipo Likert. La barra de progreso
 * muestra ademas el porcentaje completado y la seccion/dimension en la
 * que se encuentra el colaborador. El envio (enviar) sigue guardando un
 * unico arreglo plano de 24 respuestas (una por pregunta, en el mismo
 * orden que PREGUNTAS_ENCUESTA), para no romper el motor de indicadores
 * ni el formato ya guardado en localStorage.
 *
 * El campo Area ya no viene de una lista fija en el codigo: se consulta
 * dinamicamente con DataStore.getAreas(), que refleja lo administrado en
 * el modulo de Configuracion. El periodo de medicion activo se asocia
 * automaticamente a cada respuesta dentro de DataStore.guardarRespuestaEncuesta,
 * sin que este modulo deba encargarse de eso.
 */

const Encuestas = {
render() {
    this.renderIntro();
},

    /**
    * Pantalla de bienvenida: nombre de la empresa, objetivo de la encuesta,
    * tiempo estimado y confidencialidad. Se muestra cada vez que se entra
    * a la vista de Encuestas; el formulario (clasificacion + dimensiones)
    * solo se construye la primera vez que el colaborador hace clic en
    * "Comenzar encuesta" (ver iniciar()).
    */
    renderIntro() {
        const intro = document.getElementById("encuestaIntro");
        const progresoWrap = document.getElementById("encuestaProgresoWrap");
        const form = document.getElementById("formEncuesta");
        const btnEnviar = document.getElementById("btnEnviarEncuesta");
        const gracias = document.getElementById("encuestaGracias");
        if (!intro) return;

        const empresa = DataStore.getEmpresa();

        intro.innerHTML = `
        <div class="enc-intro">
        <div class="enc-intro__empresa">${empresa.nombre}</div>
        <h2>Encuesta de bienestar laboral</h2>
        <p class="enc-intro__objetivo">Esta encuesta busca conocer tu percepción sobre el bienestar, el clima y la carga laboral, con el fin de identificar oportunidades de mejora para todo el equipo.</p>
        <div class="enc-intro__meta">
        <div class="enc-intro__meta-item">Tiempo estimado: 3 a 5 minutos</div>
        <div class="enc-intro__meta-item">24 preguntas en 6 dimensiones</div>
        </div>
        <p class="enc-intro__confidencialidad">Tus respuestas son confidenciales y se analizan de forma agregada; los resultados individuales nunca se comparten.</p>
        <button type="button" class="btn btn-primary enc-btn-comenzar" id="btnComenzarEncuesta">Comenzar encuesta</button>
        </div>
        `;

        intro.classList.remove("hidden");
        if (progresoWrap) progresoWrap.classList.add("hidden");
        if (form) form.classList.add("hidden");
        if (btnEnviar) btnEnviar.classList.add("hidden");
        if (gracias) {
            gracias.classList.add("hidden");
            gracias.innerHTML = "";
        }

        document.getElementById("btnComenzarEncuesta").addEventListener("click", () => this.iniciar());
    },

    /**
    * Construye el formulario (clasificacion + dimensiones) la primera vez
    * que el colaborador hace clic en "Comenzar encuesta" y lo muestra,
    * ocultando la pantalla de bienvenida. Si el formulario ya se habia
    * construido antes (dataset.listo), no lo vuelve a generar para no
    * perder las respuestas que ya se hayan marcado.
    */
    iniciar() {
        const intro = document.getElementById("encuestaIntro");
        const progresoWrap = document.getElementById("encuestaProgresoWrap");
        const form = document.getElementById("formEncuesta");
        const btnEnviar = document.getElementById("btnEnviarEncuesta");

        intro.classList.add("hidden");
        if (progresoWrap) progresoWrap.classList.remove("hidden");
        form.classList.remove("hidden");
        if (btnEnviar) btnEnviar.classList.remove("hidden");

        if (!form.dataset.listo) {
            form.innerHTML = this.camposClasificacionHTML() + this.dimensionesHTML();

            // Los listeners se agregan aqui (en JS) en lugar de con onchange="" en el
            // marcado, para mantener el HTML libre de comportamiento inline.
            form.querySelectorAll('input[type="radio"]').forEach(input => {
                input.addEventListener("change", () => this.actualizarProgreso());
            });

            form.dataset.listo = "true";
        }

        this.actualizarProgreso();
    },
    

    /**
         * Genera los 3 campos de clasificacion del colaborador (area, cargo,
     * antiguedad) que se muestran antes de las preguntas de bienestar.
     * Reutiliza la misma clase ".field" usada en el resto de formularios
     * de la aplicacion, sin agregar estilos nuevos. Las areas se leen de
     * DataStore.getAreas() (administradas en Configuracion); cargo y
     * antiguedad siguen usando las listas fijas del modulo de datos.
     */
    camposClasificacionHTML() {
          const campo = (id, etiqueta, opciones) => `
                <div class="field">
                        <label for="${id}">${etiqueta}</label>
                                <select id="${id}" required>
                                          <option value="" disabled selected>Selecciona una opción...</option>
                                                    ${opciones.map(o => `<option value="${o}">${o}</option>`).join("")}
                                                            </select>
                                                                  </div>
                                                                      `;
          const nombresAreas = DataStore.getAreas().map(a => a.nombre);
          return (
                  campo("encArea", "Área del colaborador", nombresAreas) +
                  campo("encCargo", "Cargo", CARGOS_ENCUESTA) +
                  campo("encAntiguedad", "Antigüedad en la empresa", ANTIGUEDAD_ENCUESTA)
                );
    },

    /**
         * Sprint 7: genera una tarjeta (".card", igual que el resto de la
     * aplicacion) por cada una de las 6 dimensiones de DIMENSIONES_ENCUESTA,
     * con su nombre, su descripcion y sus 4 preguntas tipo Likert. El indice
     * global de cada pregunta (usado en el name="pN" de cada radio, igual
     * que antes) se calcula sumando las preguntas de las dimensiones
     * anteriores, para que la numeracion siga siendo 1 a 24 de forma
     * continua a lo largo de toda la encuesta.
     */
    dimensionesHTML() {
          let indiceGlobal = 0;
          return DIMENSIONES_ENCUESTA.map(dimension => {
                  const preguntasHTML = dimension.preguntas.map(pregunta => {
                            const i = indiceGlobal++;
                            return `
                                      <div class="likert-question">
                                                  <p>${i + 1}. ${pregunta}</p>
                                                              <div class="likert-options">
                                                                            ${[1, 2, 3, 4, 5].map(v => `
                                                                                            <label>
                                                                                                              <input type="radio" name="p${i}" value="${v}">
                                                                                                                                ${v}
                                                                                                                                                </label>
                                                                                                                                                              `).join("")}
                                                                                                                                                                          </div>
                                                                                                                                                                                    </div>
                                                                                                                                                                                            `;
                  }).join("");

                                                return `
                                                        <div class="card mt-md">
                                                                  <h3>${dimension.nombre}</h3>
                                                                            <p class="text-muted" style="margin-bottom:12px;">${dimension.descripcion}</p>
                                                                                      ${preguntasHTML}
                                                                                              </div>
                                                                                                    `;
          }).join("");
    },

    /**
         * Actualiza unicamente las opciones del select de area con las areas
     * configuradas actualmente en DataStore.getAreas(), sin reconstruir el
     * resto del formulario. Se invoca desde Configuracion al crear, editar
     * o eliminar un area, para que el cambio se refleje de inmediato sin
     * necesidad de recargar la pagina.
     */
    actualizarSelectAreas() {
          const select = document.getElementById("encArea");
          if (!select) return;

      const valorActual = select.value;
          const nombresAreas = DataStore.getAreas().map(a => a.nombre);

      select.innerHTML =
              '<option value="" disabled selected>Selecciona una opción...</option>' +
              nombresAreas.map(o => `<option value="${o}">${o}</option>`).join("");

      if (nombresAreas.includes(valorActual)) select.value = valorActual;
    },

    /**
         * Determina en que dimension (seccion) cae la siguiente pregunta sin
     * responder (o la ultima dimension, si ya se respondio todo), para
     * mostrarla en la barra de progreso. Devuelve { numero, nombre }, con
     * "numero" en base 1 (Sección 1 de 6, etc.).
     */
    seccionActual(respondidas, total) {
          const indice = Math.min(respondidas, total - 1);
          let cursor = 0;
          for (let d = 0; d < DIMENSIONES_ENCUESTA.length; d++) {
                  cursor += DIMENSIONES_ENCUESTA[d].preguntas.length;
                  if (indice < cursor) return { numero: d + 1, nombre: DIMENSIONES_ENCUESTA[d].nombre };
          }
          const ultima = DIMENSIONES_ENCUESTA[DIMENSIONES_ENCUESTA.length - 1];
          return { numero: DIMENSIONES_ENCUESTA.length, nombre: ultima.nombre };
    },

    /**
         * Calcula cuantas preguntas de bienestar ya tienen respuesta y
     * actualiza la barra de progreso con el porcentaje completado, el
     * detalle "X de 24 preguntas respondidas" y la sección/dimensión
     * actual (Sprint 7).
     */
    actualizarProgreso() {
          const total = PREGUNTAS_ENCUESTA.length;
          let respondidas = 0;
          for (let i = 0; i < total; i++) {
                  if (document.querySelector(`input[name="p${i}"]:checked`)) respondidas++;
          }
          const pct = Math.round((respondidas / total) * 100);

      const fill = document.getElementById("encuestaProgreso");
          if (fill) fill.style.width = pct + "%";

      const seccion = this.seccionActual(respondidas, total);
          const label = document.getElementById("encuestaProgresoLabel");
          if (label) {
                  label.textContent =
                            `${pct}% completado · ${respondidas} de ${total} preguntas respondidas · ` +
                            `Sección ${seccion.numero} de ${DIMENSIONES_ENCUESTA.length} · "${seccion.nombre}"`;
          }
          return { respondidas, total };
    },

    /** Envia la encuesta: valida que este completa (clasificacion + Likert), la guarda y muestra confirmacion. */
    enviar(event) {
          event.preventDefault();

      const area = document.getElementById("encArea").value;
          const cargo = document.getElementById("encCargo").value;
          const antiguedad = document.getElementById("encAntiguedad").value;

      if (!area || !cargo || !antiguedad) {
              mostrarToast("Selecciona tu área, cargo y antigüedad antes de enviar.", "error");
              return;
      }

      const { respondidas, total } = this.actualizarProgreso();
          if (respondidas < total) {
                  mostrarToast("Responde todas las preguntas antes de enviar.", "error");
                  return;
          }

      const respuestas = PREGUNTAS_ENCUESTA.map((_, i) =>
              Number(document.querySelector(`input[name="p${i}"]:checked`).value)
                                                    );

      DataStore.guardarRespuestaEncuesta({ area, cargo, antiguedad, respuestas });

      // Recalcula de inmediato el tablero y los reportes con la nueva
      // respuesta, sin necesidad de recargar la pagina.
      if (typeof Dashboard !== "undefined") Dashboard.render();
          if (typeof Reportes !== "undefined") Reportes.render();

      mostrarToast("Respuesta enviada correctamente. ¡Gracias por tu retroalimentación!");

      document.getElementById("formEncuesta").reset();
          this.actualizarProgreso();
    },
};
