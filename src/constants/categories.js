/**
 * Categorías y Ramas Oficiales para Atletismo Escolar (Nivel Primaria)
 */

export const GENDERS = [
  { id: 'M', label: 'Varonil', shortLabel: 'Var', icon: 'User' },
  { id: 'F', label: 'Femenil', shortLabel: 'Fem', icon: 'UserCheck' },
  { id: 'MIXED', label: 'Combinado / Mixto', shortLabel: 'Mixto', icon: 'Users' }
];

export const SCHOOL_CATEGORIES = [
  {
    id: 'infantil_mayor',
    name: 'Infantil Mayor (5°-6° Primaria)',
    shortName: '5°-6° Primaria',
    grades: ['5', '6'],
    ageRange: '11 - 12 años',
    description: 'Categoría oficial de los Juegos Deportivos Nacionales Escolares CONDEBA.',
    isDefault: true
  },
  {
    id: 'infantil_menor',
    name: 'Infantil Menor (3°-4° Primaria)',
    shortName: '3°-4° Primaria',
    grades: ['3', '4'],
    ageRange: '8 - 10 años',
    description: 'Categoría formativa escolar para alumnos de 3º y 4º de primaria.'
  },
  {
    id: 'primaria_abierta',
    name: 'Primaria General (Abierta)',
    shortName: 'Primaria Libre',
    grades: ['1', '2', '3', '4', '5', '6'],
    ageRange: 'Toda Primaria',
    description: 'Categoría unificada para torneos de zona escolar o intercolegiales abiertos.'
  }
];

export const PARTICIPATION_LIMITS = {
  MAX_INDIVIDUAL_EVENTS: 2, // Máximo 2 pruebas individuales por alumno
  MAX_RELAY_EVENTS: 2,      // Máximo 2 pruebas de equipo / relevos por alumno
  MAX_TOTAL_EVENTS: 4,      // Máximo 4 eventos en total (2 individuales + 2 equipos)
  ALLOW_OVERRIDE: true      // El admin puede ajustar o desactivar el límite si el torneo es libre
};

export function getCategoryById(categoryId) {
  return SCHOOL_CATEGORIES.find(c => c.id === categoryId) || SCHOOL_CATEGORIES[0];
}

export function getGenderLabel(genderId) {
  const g = GENDERS.find(item => item.id === genderId);
  return g ? g.label : genderId;
}
