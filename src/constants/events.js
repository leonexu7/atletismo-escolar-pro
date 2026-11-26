/**
 * Catálogo Oficial de Pruebas de Atletismo Nivel Primaria
 * Juegos Deportivos Nacionales Escolares de la Educación Básica (CONDEBA / FMAA)
 */

export const EVENT_TYPES = {
  TRACK: 'pista',
  RELAY: 'relevo',
  FIELD: 'campo'
};

export const FIELD_SUBTYPES = {
  JUMP: 'salto',
  THROW: 'lanzamiento'
};

export const OFFICIAL_EVENTS = [
  // --- PRUEBAS DE PISTA (VELOCIDAD Y MEDIO FONDO) ---
  {
    id: 'pista_75m',
    name: '75 Metros Planos',
    shortName: '75m',
    type: EVENT_TYPES.TRACK,
    category: 'Velocidad',
    unit: 'segundos',
    format: 'ss.xx',
    description: 'Carrera de velocidad pura en carril propio asignado (1 a 8).',
    requiresLanes: true,
    maxAttempts: 1,
    icon: 'Flame',
    color: 'from-amber-500 to-red-600',
    applicableGenders: ['M', 'F']
  },
  {
    id: 'pista_150m',
    name: '150 Metros Planos',
    shortName: '150m',
    type: EVENT_TYPES.TRACK,
    category: 'Velocidad Prolongada',
    unit: 'segundos',
    format: 'ss.xx',
    description: 'Velocidad con curva en carril propio asignado.',
    requiresLanes: true,
    maxAttempts: 1,
    icon: 'Zap',
    color: 'from-orange-500 to-red-500',
    applicableGenders: ['M', 'F']
  },
  {
    id: 'pista_300m',
    name: '300 Metros Planos',
    shortName: '300m',
    type: EVENT_TYPES.TRACK,
    category: 'Velocidad y Resistencia',
    unit: 'segundos / minutos',
    format: 'mm:ss.xx',
    description: 'Prueba de resistencia a la velocidad. Salida escalonada.',
    requiresLanes: true,
    maxAttempts: 1,
    icon: 'Activity',
    color: 'from-purple-500 to-indigo-600',
    applicableGenders: ['M', 'F']
  },
  {
    id: 'pista_600m',
    name: '600 Metros Planos',
    shortName: '600m',
    type: EVENT_TYPES.TRACK,
    category: 'Medio Fondo',
    unit: 'minutos',
    format: 'mm:ss.xx',
    description: 'Medio fondo escolar. Salida escalonada con rotura de carril libre.',
    requiresLanes: false,
    maxAttempts: 1,
    icon: 'Timer',
    color: 'from-blue-500 to-cyan-600',
    applicableGenders: ['M', 'F']
  },

  // --- PRUEBAS DE RELEVOS (EQUIPOS) ---
  {
    id: 'relevo_4x75m_varonil',
    name: 'Relevo 4x75m Varonil',
    shortName: '4x75m Var',
    type: EVENT_TYPES.RELAY,
    category: 'Relevos',
    unit: 'segundos',
    format: 'ss.xx',
    description: 'Equipo de 4 corredores varones de la misma escuela + 1 suplente.',
    requiresLanes: true,
    maxAttempts: 1,
    teamMembersCount: 4,
    icon: 'Users',
    color: 'from-blue-600 to-sky-700',
    applicableGenders: ['M']
  },
  {
    id: 'relevo_4x75m_femenil',
    name: 'Relevo 4x75m Femenil',
    shortName: '4x75m Fem',
    type: EVENT_TYPES.RELAY,
    category: 'Relevos',
    unit: 'segundos',
    format: 'ss.xx',
    description: 'Equipo de 4 corredoras mujeres de la misma escuela + 1 suplente.',
    requiresLanes: true,
    maxAttempts: 1,
    teamMembersCount: 4,
    icon: 'Users',
    color: 'from-pink-500 to-rose-600',
    applicableGenders: ['F']
  },
  {
    id: 'relevo_4x75m_mixto',
    name: 'Relevo Combinado / Mixto 4x75m',
    shortName: '4x75m Mixto',
    type: EVENT_TYPES.RELAY,
    category: 'Relevos Mixtos',
    unit: 'segundos',
    format: 'ss.xx',
    description: 'Equipo de 4 corredores: 2 varones y 2 mujeres (orden oficial alternado V-F-V-F).',
    requiresLanes: true,
    maxAttempts: 1,
    teamMembersCount: 4,
    icon: 'Sparkles',
    color: 'from-emerald-500 to-teal-600',
    applicableGenders: ['MIXED']
  },

  // --- PRUEBAS DE CAMPO (CONCURSOS - 3 INTENTOS, GANA LA MEJOR MARCA) ---
  {
    id: 'campo_longitud',
    name: 'Salto de Longitud',
    shortName: 'Longitud',
    type: EVENT_TYPES.FIELD,
    subType: FIELD_SUBTYPES.JUMP,
    category: 'Saltos',
    unit: 'metros',
    format: 'm.cm',
    spec: 'Fosa de arena reglamentaria, tabla de batida.',
    maxAttempts: 3,
    scoringRule: 'Mejor marca válida de los 3 intentos. Desempate por 2ª y 3ª mejor marca.',
    icon: 'MoveRight',
    color: 'from-emerald-600 to-green-700',
    applicableGenders: ['M', 'F']
  },
  {
    id: 'campo_bala',
    name: 'Impulso de Bala',
    shortName: 'Bala',
    type: EVENT_TYPES.FIELD,
    subType: FIELD_SUBTYPES.THROW,
    category: 'Lanzamientos',
    unit: 'metros',
    format: 'm.cm',
    spec: 'Bala reglamentaria escolar de 6 libras (2.72 kg).',
    maxAttempts: 3,
    scoringRule: 'Mejor marca válida de los 3 intentos. Desempate por 2ª y 3ª mejor marca.',
    icon: 'CircleDot',
    color: 'from-slate-600 to-zinc-800',
    applicableGenders: ['M', 'F']
  },
  {
    id: 'campo_disco',
    name: 'Lanzamiento de Disco',
    shortName: 'Disco',
    type: EVENT_TYPES.FIELD,
    subType: FIELD_SUBTYPES.THROW,
    category: 'Lanzamientos',
    unit: 'metros',
    format: 'm.cm',
    spec: 'Disco de caucho escolar de 600 gramos.',
    maxAttempts: 3,
    scoringRule: 'Mejor marca válida de los 3 intentos. Desempate por 2ª y 3ª mejor marca.',
    icon: 'Disc',
    color: 'from-amber-600 to-yellow-700',
    applicableGenders: ['M', 'F']
  },
  {
    id: 'campo_pelota',
    name: 'Lanzamiento de Pelota',
    shortName: 'Pelota',
    type: EVENT_TYPES.FIELD,
    subType: FIELD_SUBTYPES.THROW,
    category: 'Lanzamientos',
    unit: 'metros',
    format: 'm.cm',
    spec: 'Pelota de béisbol oficial #5 (142 gramos).',
    maxAttempts: 3,
    scoringRule: 'Mejor marca válida de los 3 intentos. Desempate por 2ª y 3ª mejor marca.',
    icon: 'Baseball',
    color: 'from-teal-600 to-cyan-700',
    applicableGenders: ['M', 'F']
  }
];

export function getEventById(eventId) {
  return OFFICIAL_EVENTS.find(e => e.id === eventId) || null;
}

export function isFieldEvent(eventId) {
  const ev = getEventById(eventId);
  return ev?.type === EVENT_TYPES.FIELD;
}

export function isTrackEvent(eventId) {
  const ev = getEventById(eventId);
  return ev?.type === EVENT_TYPES.TRACK || ev?.type === EVENT_TYPES.RELAY;
}

export function isRelayEvent(eventId) {
  const ev = getEventById(eventId);
  return ev?.type === EVENT_TYPES.RELAY;
}
