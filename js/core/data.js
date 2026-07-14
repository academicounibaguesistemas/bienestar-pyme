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
  USUARIOS: "bp_usuarios",
  AREAS: "bp_areas",
  PERIODOS: "bp_periodos",
};

/*
 * Lista fija de areas usada como semilla inicial de la gestion dinamica de
 * areas (Configuracion). A partir del Sprint de administracion, las areas
 * que ve la encuesta ya no vienen de una lista fija en el codigo, sino de
 * DataStore.getAreas(); este arreglo solo se usa una vez, la primera vez que
 * se ejecuta la aplicacion, para poblar esa lista dinamica en localStorage.
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

const PREGUNTAS_ENCUESTA = [
  "Me siento con energía durante mi jornada laboral.",
  "Percibo un buen ambiente y respeto en mi equipo.",
  "Mi carga de trabajo es manejable.",
  "Recibo reconocimiento por mi trabajo.",
  "Puedo equilibrar mi vida personal y laboral.",
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

/* Datos por defecto de la empresa. Incluye los campos administrativos
 * agregados en el modulo de Configuracion (NIT, sector, responsable, etc.).
 * getEmpresa() combina estos valores con lo guardado en localStorage, de
 * modo que una empresa guardada antes de agregar estos campos los reciba
 * igual con su valor por defecto (sin romper datos existentes). */
const EMPRESA_DEFAULT = {
  nombre: "Empresa demo",
  nit: "",
  sector: "",
  ciudad: "Ibagué",
  colaboradores: 48,
  responsable: "",
  correo: "",
  telefono: "",
  logo: "",
  periodicidad: "Mensual",
};

/* Usuario administrador de ejemplo, para que la tabla de Gestion de
 * usuarios no aparezca vacia en la primera carga del prototipo. */
const USUARIOS_DEFAULT = [
  { id: 1, nombre: "Administrador del sistema", correo: "admin@pyme.co", rol: "Administrador", estado: "Activo" },
];

/* ---------- Acceso a localStorage (con valores por defecto) ---------- */

const DataStore = {
  getEmpresa() {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPRESA);
    const guardada = raw ? JSON.parse(raw) : {};
    return { ...EMPRESA_DEFAULT, ...guardada };
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
   * clasificacion (area, cargo, antiguedad), el periodo de medicion activo
   * en el momento de la respuesta, y las respuestas de bienestar.
   * `datos` tiene la forma { area, cargo, antiguedad, respuestas }.
   */
  guardarRespuestaEncuesta(datos) {
    const lista = this.getEncuestasGuardadas();
    const periodoActivo = this.getPeriodoActivo();
    lista.push({
      fecha: new Date().toISOString(),
      area: datos.area,
      cargo: datos.cargo,
      antiguedad: datos.antiguedad,
      periodo: periodoActivo ? periodoActivo.nombre : null,
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

  /* ---------- Gestion de usuarios (administracion simulada) ---------- */

  getUsuarios() {
    const raw = localStorage.getItem(STORAGE_KEYS.USUARIOS);
    if (!raw) {
      this.guardarUsuarios(USUARIOS_DEFAULT);
      return [...USUARIOS_DEFAULT];
    }
    return JSON.parse(raw);
  },

  guardarUsuarios(lista) {
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(lista));
  },

  /** Agrega un usuario nuevo con estado "Activo" por defecto. No implica autenticacion real. */
  agregarUsuario(usuario) {
    const lista = this.getUsuarios();
    lista.push({ id: Date.now(), estado: "Activo", ...usuario });
    this.guardarUsuarios(lista);
    return lista;
  },

  actualizarUsuario(id, datos) {
    const lista = this.getUsuarios().map(u => (u.id === id ? { ...u, ...datos } : u));
    this.guardarUsuarios(lista);
    return lista;
  },

  /** Alterna el estado Activo/Inactivo de un usuario (no elimina el registro). */
  cambiarEstadoUsuario(id) {
    const lista = this.getUsuarios().map(u =>
      u.id === id ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" } : u
    );
    this.guardarUsuarios(lista);
    return lista;
  },

  /* ---------- Gestion de areas (reemplaza la lista fija AREAS_ENCUESTA) ---------- */

  /** Devuelve las areas configuradas. La primera vez, las inicializa con AREAS_ENCUESTA. */
  getAreas() {
    const raw = localStorage.getItem(STORAGE_KEYS.AREAS);
    if (!raw) {
      const semilla = AREAS_ENCUESTA.map((nombre, i) => ({ id: i + 1, nombre }));
      this.guardarAreas(semilla);
      return semilla;
    }
    return JSON.parse(raw);
  },

  guardarAreas(lista) {
    localStorage.setItem(STORAGE_KEYS.AREAS, JSON.stringify(lista));
  },

  agregarArea(nombre) {
    const lista = this.getAreas();
    lista.push({ id: Date.now(), nombre });
    this.guardarAreas(lista);
    return lista;
  },

  actualizarArea(id, nombre) {
    const lista = this.getAreas().map(a => (a.id === id ? { ...a, nombre } : a));
    this.guardarAreas(lista);
    return lista;
  },

  eliminarArea(id) {
    const lista = this.getAreas().filter(a => a.id !== id);
    this.guardarAreas(lista);
    return lista;
  },

  /* ---------- Periodos de medicion ---------- */

  getPeriodos() {
    const raw = localStorage.getItem(STORAGE_KEYS.PERIODOS);
    return raw ? JSON.parse(raw) : [];
  },

  guardarPeriodos(lista) {
    localStorage.setItem(STORAGE_KEYS.PERIODOS, JSON.stringify(lista));
  },

  /** Crea un periodo nuevo. Si es el primero que se crea, queda activo automaticamente. */
  agregarPeriodo(nombre) {
    const lista = this.getPeriodos();
    const esPrimero = lista.length === 0;
    lista.push({ id: Date.now(), nombre, activo: esPrimero });
    this.guardarPeriodos(lista);
    return lista;
  },

  /** Marca un periodo como activo y desactiva los demas (solo puede haber uno activo). */
  activarPeriodo(id) {
    const lista = this.getPeriodos().map(p => ({ ...p, activo: p.id === id }));
    this.guardarPeriodos(lista);
    return lista;
  },

  eliminarPeriodo(id) {
    const lista = this.getPeriodos().filter(p => p.id !== id);
    this.guardarPeriodos(lista);
    return lista;
  },

  /** Devuelve el periodo de medicion activo, o null si no se ha creado/activado ninguno. */
  getPeriodoActivo() {
    return this.getPeriodos().find(p => p.activo) || null;
  },
};
