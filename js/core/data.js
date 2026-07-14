/**
 * data.js
 * Capa de datos de BienEstar PYME.
 * Centraliza la información simulada (mock) y su persistencia en
 * localStorage. En una version de produccion este modulo se
 * sustituiria por llamadas a una API real, sin tener que tocar
 * el resto de la aplicación.
 */

const STORAGE_KEYS = {
  EMPRESA: "bp_empresa",
  ENCUESTAS: "bp_encuestas",
  SESION: "bp_sesion",
};

const AREAS = ["Administración", "Ventas", "Operaciones", "Servicio al cliente"];

const PREGUNTAS_ENCUESTA = [
  "Me siento con energía durante mi jornada laboral.",
  "Percibo un buen ambiente y respeto en mi equipo.",
  "Mi carga de trabajo es manejable.",
  "Recibo reconocimiento por mi trabajo.",
  "Puedo equilibrar mi vida personal y laboral.",
];

/*
 * Preguntas de clasificacion del colaborador que responde la encuesta.
 * Se almacenan junto con las respuestas de bienestar para que, en un
 * proximo sprint, el Dashboard y los Reportes puedan calcular
 * indicadores reales desagregados por area, cargo o antiguedad sin
 * necesidad de simular esa informacion.
 */
const AREAS_ENCUESTA = [
  "Administración",
  "Comercial",
  "Ventas",
  "Operaciones",
  "Servicio al Cliente",
  "Logística",
  "Otra",
];

const CARGOS_ENCUESTA = [
  "Operativo",
  "Administrativo",
  "Profesional",
  "Coordinador",
  "Directivo",
];

const ANTIGUEDAD_ENCUESTA = [
  "Menos de 1 año",
  "Entre 1 y 3 años",
  "Entre 3 y 5 años",
  "Más de 5 años",
];

/* Serie historica (mock) de bienestar y productividad para la grafica de lineas. */
const SERIE_MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
const SERIE_BIENESTAR = [68, 70, 69, 72, 74, 76];
const SERIE_PRODUCTIVIDAD = [71, 72, 74, 73, 76, 78];

/* Bienestar por area para la grafica de barras. */
const BIENESTAR_POR_AREA = { "Administración": 78, "Ventas": 69, "Operaciones": 64, "Servicio al cliente": 72 };

/* Distribucion del riesgo psicosocial para la grafica de dona. */
const RIESGO_PSICOSOCIAL = { "Controlado": 76, "En atención": 24 };

/* Reporte consolidado por area (modulo de Reportes y alertas). */
const REPORTE_AREAS = [
  { area: "Administración", bienestar: 78, clima: 75, productividad: 76, rotacion: 6, estado: "ok" },
  { area: "Ventas", bienestar: 69, clima: 75, productividad: 68, rotacion: 14, estado: "warn" },
  { area: "Operaciones", bienestar: 64, clima: 75, productividad: 63, rotacion: 18, estado: "danger" },
  { area: "Servicio al cliente", bienestar: 72, clima: 75, productividad: 71, rotacion: 11, estado: "warn" },
];

/* Alertas recientes mostradas en el tablero. */
const ALERTAS_RECIENTES = [
  { area: "Ventas", indicador: "Bienestar 69", estado: "warn" },
  { area: "Operaciones", indicador: "Bienestar 64", estado: "danger" },
  { area: "Servicio al cliente", indicador: "Bienestar 72", estado: "warn" },
];

/* KPIs principales del tablero. */
const KPIS_DASHBOARD = {
  bienestar: { valor: 76, delta: "+2 pts vs. mes anterior", tendencia: "up" },
  clima: { valor: 75, delta: "estable", tendencia: "up" },
  productividad: { valor: 78, delta: "+2 pts", tendencia: "up" },
  riesgo: { valor: 24, sufijo: "%", delta: "riesgo controlado", tendencia: "down" },
};

const EMPRESA_DEFAULT = {
  nombre: "Empresa demo",
  ciudad: "Ibagué",
  colaboradores: 48,
  periodicidad: "Mensual",
};

/* ---------- Acceso a localStorage (con valores por defecto) ---------- */

const DataStore = {
  getEmpresa() {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPRESA);
    return raw ? JSON.parse(raw) : { ...EMPRESA_DEFAULT };
  },

  guardarEmpresa(empresa) {
    localStorage.setItem(STORAGE_KEYS.EMPRESA, JSON.stringify(empresa));
  },

  getEncuestasGuardadas() {
    const raw = localStorage.getItem(STORAGE_KEYS.ENCUESTAS);
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * Guarda una respuesta de encuesta completa, incluyendo las preguntas de
   * clasificacion (area, cargo, antiguedad) y las respuestas de bienestar.
   * `datos` tiene la forma { area, cargo, antiguedad, respuestas }.
   */
  guardarRespuestaEncuesta(datos) {
    const lista = this.getEncuestasGuardadas();
    lista.push({
      fecha: new Date().toISOString(),
      area: datos.area,
      cargo: datos.cargo,
      antiguedad: datos.antiguedad,
      respuestas: datos.respuestas,
    });
    localStorage.setItem(STORAGE_KEYS.ENCUESTAS, JSON.stringify(lista));
    return lista;
  },

  guardarSesion(sesion) {
    localStorage.setItem(STORAGE_KEYS.SESION, JSON.stringify(sesion));
  },

  getSesion() {
    const raw = localStorage.getItem(STORAGE_KEYS.SESION);
    return raw ? JSON.parse(raw) : null;
  },

  limpiarSesion() {
    localStorage.removeItem(STORAGE_KEYS.SESION);
  },
};
