/**
 * encuestas.js
 * Logica del modulo "Encuestas de bienestar": genera las preguntas de
 * clasificacion del colaborador (area, cargo, antiguedad) y el
 * formulario tipo Likert a partir de PREGUNTAS_ENCUESTA, controla
 * la barra de progreso y guarda la respuesta en localStorage.
 */

const Encuestas = {
  render() {
    const form = document.getElementById("formEncuesta");
    if (!form || form.dataset.listo) return; // Solo se genera una vez.

    const preguntasHTML = PREGUNTAS_ENCUESTA.map((pregunta, i) => `
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
    `).join("");

    form.innerHTML = this.camposClasificacionHTML() + preguntasHTML;

    // Los listeners se agregan aqui (en JS) en lugar de con onchange="" en el
    // marcado, para mantener el HTML libre de comportamiento inline.
    form.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener("change", () => this.actualizarProgreso());
    });

    form.dataset.listo = "true";
    this.actualizarProgreso();
  },

  /**
   * Genera los 3 campos de clasificacion del colaborador (area, cargo,
   * antiguedad) que se muestran antes de las preguntas de bienestar.
   * Reutiliza la misma clase ".field" usada en el resto de formularios
   * de la aplicacion, sin agregar estilos nuevos.
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
    return (
      campo("encArea", "Área del colaborador", AREAS_ENCUESTA) +
      campo("encCargo", "Cargo", CARGOS_ENCUESTA) +
      campo("encAntiguedad", "Antigüedad en la empresa", ANTIGUEDAD_ENCUESTA)
    );
  },

  /** Calcula cuantas preguntas de bienestar ya tienen respuesta y actualiza la barra de progreso. */
  actualizarProgreso() {
    const total = PREGUNTAS_ENCUESTA.length;
    let respondidas = 0;
    for (let i = 0; i < total; i++) {
      if (document.querySelector(`input[name="p${i}"]:checked`)) respondidas++;
    }
    const pct = Math.round((respondidas / total) * 100);
    const fill = document.getElementById("encuestaProgreso");
    if (fill) fill.style.width = pct + "%";
    const label = document.getElementById("encuestaProgresoLabel");
    if (label) label.textContent = `${respondidas} de ${total} preguntas respondidas`;
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
    mostrarToast("Respuesta enviada correctamente. ¡Gracias por tu retroalimentacion!");

    document.getElementById("formEncuesta").reset();
    this.actualizarProgreso();
  },
};
