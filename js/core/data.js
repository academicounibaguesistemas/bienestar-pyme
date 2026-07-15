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

/**
 * Sprint 7: la encuesta de bienestar se organiza por dimensiones (en vez de
 * una lista plana de preguntas) para que se vea como un instrumento
 * profesional de una plataforma SaaS. Cada dimension tiene un identificador
 * interno (usado por el motor de indicadores), un nombre y una descripcion
 * breve que se muestran en la tarjeta de la encuesta, y sus propias
 * preguntas tipo Likert (1 a 5). PREGUNTAS_ENCUESTA se sigue derivando mas
 * abajo automaticamente a partir de estas dimensiones, para que el resto
 * del codigo que solo necesita la lista plana (o su longitud total) siga
 * funcionando sin cambios.
 */
const DIMENSIONES_ENCUESTA = [
  {
        id: "bienestarPersonal",
        nombre: "Bienestar personal",
        descripcion: "Evalúa el estado físico y emocional del colaborador durante su jornada laboral.",
        preguntas: [
                "Me siento con energía durante mi jornada laboral.",
                "Mi estado de ánimo me permite desempeñar adecuadamente mi trabajo.",
                "Considero que mi salud física me permite cumplir mis funciones.",
                "Me siento motivado para asistir diariamente a mi trabajo.",
              ],
  },
  {
        id: "climaOrganizacional",
        nombre: "Clima organizacional",
        descripcion: "Evalúa las relaciones laborales y el ambiente de trabajo.",
        preguntas: [
                "Existe respeto entre los miembros de mi equipo.",
                "Me siento escuchado por mis superiores.",
                "Existe buena comunicación dentro de mi área.",
                "Considero que el ambiente laboral es agradable.",
              ],
  },
  {
        id: "cargaLaboral",
        nombre: "Carga laboral",
        descripcion: "Evalúa la percepción sobre la cantidad de trabajo y el nivel de presión.",
        preguntas: [
                "Mi carga de trabajo es adecuada.",
                "Dispongo del tiempo suficiente para cumplir mis actividades.",
                "Las responsabilidades asignadas son razonables.",
                "Puedo realizar mis labores sin sentir presión excesiva.",
              ],
  },
  {
        id: "liderazgo",
        nombre: "Liderazgo",
        descripcion: "Evalúa la percepción del liderazgo inmediato.",
        preguntas: [
                "Mi jefe brinda orientación cuando la necesito.",
                "Recibo retroalimentación sobre mi desempeño.",
                "Mi líder reconoce los logros del equipo.",
                "Confío en las decisiones de mi jefe inmediato.",
              ],
  },
  {
        id: "desarrolloLaboral",
        nombre: "Desarrollo laboral",
        descripcion: "Evalúa las oportunidades de crecimiento dentro de la empresa.",
        preguntas: [
                "Tengo oportunidades para aprender nuevas habilidades.",
                "La empresa promueve mi desarrollo profesional.",
                "Dispongo de las herramientas necesarias para realizar mi trabajo.",
                "Conozco claramente mis responsabilidades.",
              ],
  },
  {
        id: "equilibrioVidaTrabajo",
        nombre: "Equilibrio vida-trabajo",
        descripcion: "Evalúa la relación entre el trabajo y la vida personal.",
        preguntas: [
                "Puedo equilibrar mi vida personal y laboral.",
                "Mi trabajo respeta mis tiempos de descanso.",
                "Me siento satisfecho con mi calidad de vida.",
                "Recomendaría esta empresa como un buen lugar para trabajar.",
              ],
  },
  ];

/* Lista plana de las 24 preguntas, derivada de DIMENSIONES_ENCUESTA: se
 * mantiene por compatibilidad con el codigo que solo necesita el total de
 * preguntas o recorrerlas sin importar su dimension. */
const PREGUNTAS_ENCUESTA = DIMENSIONES_ENCUESTA.reduce((acc, dim) => acc.concat(dim.preguntas), []);

/* Valores de demostracion (0-100) por dimension, usados unicamente
 * mientras no existan encuestas reales guardadas (igual que KPIS_DASHBOARD),
 * para que las tarjetas de dimension del tablero y de reportes no se vean
 * vacias en la primera carga del prototipo. */
const DIMENSIONES_DEMO = {
    bienestarPersonal: 76,
    climaOrganizacional: 75,
    cargaLaboral: 70,
    liderazgo: 73,
    desarrolloLaboral: 71,
    equilibrioVidaTrabajo: 74,
};

/* Recomendacion automatica asociada a cada dimension (Sprint 7), mostrada
 * en Reportes junto al resultado de esa dimension. Son reglas simples y
 * fijas por dimension, sin inteligencia artificial. */
const RECOMENDACIONES_DIMENSION = {
    bienestarPersonal: "Promover pausas activas y programas de salud física y emocional para los colaboradores.",
    climaOrganizacional: "Fortalecer los espacios de comunicación, respeto y reconocimiento entre los equipos.",
    cargaLaboral: "Revisar la distribución de tareas y los tiempos asignados a cada actividad.",
    liderazgo: "Brindar retroalimentación frecuente y fortalecer las competencias de los líderes de equipo.",
    desarrolloLaboral: "Ampliar las oportunidades de capacitación y crecimiento profesional.",
    equilibrioVidaTrabajo: "Respetar los tiempos de descanso y promover la flexibilidad laboral.",
};

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

    /**
         * Devuelve las encuestas guardadas en localStorage. Sprint 7: la encuesta
     * paso de 5 a 24 preguntas (6 dimensiones x 4), por lo que las respuestas
     * guardadas con el formato anterior (arreglo de 5 respuestas) ya no son
     * compatibles con el motor de indicadores por dimension. Para que la
     * aplicacion nunca falle ni mezcle ambos formatos, aqui se filtran y solo
     * se devuelven las encuestas que ya tienen las 24 respuestas actuales; las
     * antiguas no se borran de localStorage, pero dejan de usarse en calculos.
     */
    getEncuestasGuardadas() {
          const raw = localStorage.getItem(STORAGE_KEYS.ENCUESTAS);
          const lista = raw ? JSON.parse(raw) : [];
          return lista.filter(e => Array.isArray(e.respuestas) && e.respuestas.length === PREGUNTAS_ENCUESTA.length);
    },

    /**
         * Guarda una respuesta de encuesta completa, incluyendo las preguntas de
     * clasificacion (area, cargo, antiguedad), el periodo de medicion activo
     * en el momento de la respuesta, y las respuestas de bienestar. Se lee y
     * escribe directamente sobre localStorage (sin pasar por
     * getEncuestasGuardadas) para conservar en el historial las encuestas
     * antiguas con formato de 5 preguntas, aunque ya no se usen en calculos.
     * `datos` tiene la forma { area, cargo, antiguedad, respuestas }.
     */
    guardarRespuestaEncuesta(datos) {
          const raw = localStorage.getItem(STORAGE_KEYS.ENCUESTAS);
          const lista = raw ? JSON.parse(raw) : [];
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
