/**
 * Utilidades para normalización y desduplicación de Escuelas Primarias
 * Solución para evitar que dos maestros de la misma escuela creen registros duplicados
 * debido a mayúsculas, acentos, abreviaturas (Esc. vs Escuela) o espacios.
 */

/**
 * Limpia y normaliza la Clave de Centro de Trabajo (CCT)
 * Ejemplo: " 21-epr 0123 z " -> "21EPR0123Z"
 */
export function cleanCCT(cct) {
  if (!cct || typeof cct !== 'string') return '';
  return cct.trim().toUpperCase().replace(/[\s\-_./]/g, '');
}

/**
 * Normaliza el nombre de la escuela eliminando acentos, mayúsculas, puntuación
 * y prefijos comunes (Esc., Escuela, Primaria, Colegio, Instituto).
 * Ejemplo: "Esc. Primaria Benito Juárez" -> "benito juarez"
 * Ejemplo: "PRIMARIA BENITO JUAREZ" -> "benito juarez"
 */
export function cleanSchoolName(name) {
  if (!name || typeof name !== 'string') return '';

  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\b(escuela|esc|primaria|prim|colegio|col|instituto|inst|general|centro|escolar|c\.e|ce)\b/gi, '') // Prefijos comunes
    .replace(/[^a-z0-9\s]/g, '') // Quitar puntuación
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta si una escuela candidata coincide con alguna ya registrada en el torneo.
 * 1. Prioridad Máxima: Coincidencia por Clave CCT (Identificador oficial único federal en México).
 * 2. Segunda Prioridad: Coincidencia por nombre normalizado sin prefijos ni acentos.
 * 
 * @param {Array} schools - Lista de escuelas registradas
 * @param {Object} candidate - { name, cct, zone, inspection }
 * @param {string} excludeId - ID de escuela a excluir (al editar la misma)
 * @returns {Object} { isMatch: boolean, matchType: 'cct'|'name'|null, matchedSchool: Object|null, message: string }
 */
export function findExistingSchoolMatch(schools = [], candidate = {}, excludeId = null) {
  if (!Array.isArray(schools) || schools.length === 0) {
    return { isMatch: false, matchType: null, matchedSchool: null, message: '' };
  }

  const candidateCCT = cleanCCT(candidate.cct);
  const candidateName = cleanSchoolName(candidate.name);

  // 1. Verificación por Clave de Centro de Trabajo (CCT)
  if (candidateCCT) {
    const matchedByCCT = schools.find(s => {
      if (excludeId && s.id === excludeId) return false;
      return cleanCCT(s.cct) === candidateCCT;
    });

    if (matchedByCCT) {
      return {
        isMatch: true,
        matchType: 'cct',
        matchedSchool: matchedByCCT,
        message: `¡Escuela detectada por Clave CCT (${matchedByCCT.cct || candidateCCT})! Esta institución ya está registrada como "${matchedByCCT.name}".`
      };
    }
  }

  // 2. Verificación por Nombre Normalizado (Anti-mayúsculas y abreviaturas)
  if (candidateName && candidateName.length >= 3) {
    const matchedByName = schools.find(s => {
      if (excludeId && s.id === excludeId) return false;
      const existingClean = cleanSchoolName(s.name);
      return existingClean === candidateName;
    });

    if (matchedByName) {
      return {
        isMatch: true,
        matchType: 'name',
        matchedSchool: matchedByName,
        message: `Existe una escuela similar registrada: "${matchedByName.name}" (${matchedByName.cct ? `CCT: ${matchedByName.cct}` : matchedByName.zone}).`
      };
    }
  }

  return { isMatch: false, matchType: null, matchedSchool: null, message: '' };
}
