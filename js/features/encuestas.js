/**
 * encuestas.js
 * Logica del modulo "Encuestas de bienestar": genera el
 * formulario tipo Likert a partir de PREGUNTAS_ENCUESTA, controla
 * la barra de progreso y guarda la respuesta en localStorage.
 */

const Encuestas = {
  render() {
    const form = document.getElementById("formEncuesta");
    if (!form || form.dataset.listo) return; // Solo se genera una vez.

    form.innerHTML = PREGUNTAS_ENCUESTA.map((pregunta, i) => `
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

    // Los listeners se agregan aqui (en JS) en lugar de con onchange="" en el
    // marcado, para mantener el HTML libre de comportamiento inline.
    form.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener("change", () => this.actualizarProgreso());
    });

    form.dataset.listo = "true";
    this.actualizarProgreso();
  },

  /** Calcula cuantas preguntas ya tienen respuesta y actualiza la barra de progreso. */
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

  /** Envia la encuesta: valida que este completa, la guarda y muestra confirmacion. */
  enviar(event) {
    event.preventDefault();
    const { respondidas, total } = this.actualizarProgreso();

    if (respondidas < total) {
      mostrarToast("Responde todas las preguntas antes de enviar.", "error");
      return;
    }

    const respuestas = PREGUNTAS_ENCUESTA.map((_, i) =>
      Number(document.querySelector(`input[name="p${i}"]:checked`).value)
    );

    DataStore.guardarRespuestaEncuesta(respuestas);
    mostrarToast("Respuesta enviada correctamente. ¡Gracias por tu retroalimentacion!");

    document.getElementById("formEncuesta").reset();
    this.actualizarProgreso();
  },
};
