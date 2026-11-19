/**
 * Utilidades de formateo y conversión bidireccional para Atletismo
 * Soporta tiempos de pista (segundos/centésimas) y distancias de campo (metros/centímetros).
 */

/**
 * Convierte un número de segundos en cadena de texto deportiva legible.
 * Ejemplos:
 *  10.52  -> "10.52 s"
 *  75.30  -> "1:15.30"
 *  125.04 -> "2:05.04"
 */
export function formatTrackTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '--.--';
  }

  if (seconds < 60) {
    return `${seconds.toFixed(2)} s`;
  }

  const mins = Math.floor(seconds / 60);
  const remainingSecs = (seconds % 60).toFixed(2);
  const paddedSecs = Number(remainingSecs) < 10 ? `0${remainingSecs}` : remainingSecs;

  return `${mins}:${paddedSecs}`;
}

/**
 * Parsea una entrada de texto del usuario a segundos flotantes.
 * Admite:
 *  "10.5"   -> 10.50
 *  "10,52"  -> 10.52
 *  "1:15.3" -> 75.30
 *  "1.15.3" -> 75.30
 */
export function parseTrackTime(input) {
  if (!input) return null;
  const clean = String(input).trim().replace(',', '.');

  if (!clean) return null;

  // Si contiene formato con minutos (ej: 1:15.30)
  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]);
      const secs = parseFloat(parts[1]);
      if (!isNaN(mins) && !isNaN(secs)) {
        return Number((mins * 60 + secs).toFixed(2));
      }
    }
  }

  // Si es un número decimal simple
  const num = parseFloat(clean);
  if (!isNaN(num) && num > 0) {
    return Number(num.toFixed(2));
  }

  return null;
}

/**
 * Formatea una distancia métrica en metros con dos decimales.
 * Ej: 3.85 -> "3.85 m"
 */
export function formatFieldDistance(meters) {
  if (typeof meters !== 'number' || isNaN(meters) || meters <= 0) {
    return '--.-- m';
  }
  return `${meters.toFixed(2)} m`;
}

/**
 * Parsea una distancia ingresada por el juez a metros flotantes.
 * Admite: "3.85", "3,85", "385 cm"
 */
export function parseFieldDistance(input) {
  if (!input) return null;
  const clean = String(input).trim().toLowerCase().replace(',', '.');

  if (clean.endsWith('cm')) {
    const val = parseFloat(clean.replace('cm', ''));
    if (!isNaN(val) && val > 0) return Number((val / 100).toFixed(2));
  }

  const num = parseFloat(clean.replace('m', ''));
  if (!isNaN(num) && num > 0) {
    return Number(num.toFixed(2));
  }

  return null;
}

/**
 * Calcula la edad exacta en años a partir de una fecha de nacimiento (YYYY-MM-DD, DD/MM/YYYY o Date).
 * Evita desfases de husos horarios ISO UTC mediante desglose directo de componentes.
 * Retorna un número entero o null si la fecha no es válida.
 */
export function calculateAge(birthDateInput, referenceDate = new Date()) {
  if (!birthDateInput) return null;

  let birthYear, birthMonth, birthDay;

  if (typeof birthDateInput === 'string') {
    const trimmed = birthDateInput.trim();
    if (!trimmed) return null;

    // Caso YYYY-MM-DD o YYYY/MM/DD
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(trimmed)) {
      const parts = trimmed.split(/[-/]/).map(Number);
      birthYear = parts[0];
      birthMonth = parts[1] - 1;
      birthDay = parts[2];
    }
    // Caso DD/MM/YYYY o DD-MM-YYYY
    else if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(trimmed)) {
      const parts = trimmed.split(/[-/]/).map(Number);
      birthDay = parts[0];
      birthMonth = parts[1] - 1;
      birthYear = parts[2];
    } else {
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return null;
      birthYear = parsed.getFullYear();
      birthMonth = parsed.getMonth();
      birthDay = parsed.getDate();
    }
  } else if (birthDateInput instanceof Date) {
    if (isNaN(birthDateInput.getTime())) return null;
    birthYear = birthDateInput.getFullYear();
    birthMonth = birthDateInput.getMonth();
    birthDay = birthDateInput.getDate();
  } else {
    return null;
  }

  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (isNaN(ref.getTime())) return null;

  let age = ref.getFullYear() - birthYear;
  const monthDiff = ref.getMonth() - birthMonth;

  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birthDay)) {
    age--;
  }

  return age >= 0 && age <= 120 ? age : null;
}

/**
 * Formatea la fecha de nacimiento agregando la edad calculada a un lado.
 * Ejemplo: "2014-03-15 (12 años)"
 */
export function formatBirthDateWithAge(birthDateInput) {
  if (!birthDateInput) return '';
  const age = calculateAge(birthDateInput);
  if (age === null) return String(birthDateInput);
  return `${birthDateInput} (${age} años)`;
}
