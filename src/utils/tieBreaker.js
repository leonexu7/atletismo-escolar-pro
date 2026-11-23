/**
 * Algoritmo Oficial de Puntuación y Desempates World Athletics / FMAA
 * Adaptado a Juegos Deportivos Escolares de Nivel Primaria.
 */

/**
 * Evalúa los 3 intentos oficiales de un atleta en una prueba de campo
 * y calcula su mejor puntuación (NUNCA el promedio).
 * 
 * @param {Array} attempts - Array de intentos [{ attemptNum: 1, value: 3.40, status: 'valid'|'foul'|'pass' }, ...]
 * @returns {Object} Resumen técnico con mejor marca, 2ª y 3ª mejor marca y estado
 */
export function evaluateFieldAttempts(attempts = []) {
  // Filtrar únicamente los intentos válidos con valor numérico positivo
  const validMarks = attempts
    .filter(a => a && a.status === 'valid' && typeof a.value === 'number' && !isNaN(a.value) && a.value > 0)
    .map(a => Number(a.value.toFixed(2)))
    .sort((a, b) => b - a); // Orden descendente (de mayor distancia a menor)

  const bestMark = validMarks.length > 0 ? validMarks[0] : 0;
  const secondBestMark = validMarks.length > 1 ? validMarks[1] : 0;
  const thirdBestMark = validMarks.length > 2 ? validMarks[2] : 0;

  // Determinar si todos los intentos fueron nulos o si no se presentó
  const totalRecorded = attempts.filter(a => a && a.status).length;
  const hasOnlyFouls = totalRecorded > 0 && validMarks.length === 0;

  return {
    bestMark,
    secondBestMark,
    thirdBestMark,
    validMarksCount: validMarks.length,
    hasValidMark: validMarks.length > 0,
    hasOnlyFouls,
    attemptsDetails: attempts
  };
}

/**
 * Ordena y clasifica a todos los competidores de un concurso de campo
 * resolviendo automáticamente empates según el reglamento oficial:
 * 1. Mejor marca válida (Mayor distancia/altura)
 * 2. En caso de empate: Segunda mejor marca válida
 * 3. En caso de persistir el empate: Tercera mejor marca válida
 * 4. Si todas las marcas son idénticas: Empate compartido
 * 
 * @param {Array} competitors - Lista de competidores con sus intentos ya evaluados
 * @returns {Array} Lista clasificada con posición (rank) y notas de desempate
 */
export function rankFieldEventCompetitors(competitors = []) {
  if (!Array.isArray(competitors) || competitors.length === 0) return [];

  // Clonar y ordenar según la jerarquía oficial World Athletics
  const sorted = [...competitors].sort((a, b) => {
    // Si uno no tiene marca válida y el otro sí, el que tiene marca va primero
    if (a.hasValidMark && !b.hasValidMark) return -1;
    if (!a.hasValidMark && b.hasValidMark) return 1;
    if (!a.hasValidMark && !b.hasValidMark) return 0;

    // 1. Criterio Maestro: Mejor marca (distancia máxima)
    if (Math.abs(b.bestMark - a.bestMark) > 0.0001) {
      return b.bestMark - a.bestMark;
    }

    // 2. Primer Desempate Oficial: Segunda mejor marca válida
    if (Math.abs(b.secondBestMark - a.secondBestMark) > 0.0001) {
      return b.secondBestMark - a.secondBestMark;
    }

    // 3. Segundo Desempate Oficial: Tercera mejor marca válida
    if (Math.abs(b.thirdBestMark - a.thirdBestMark) > 0.0001) {
      return b.thirdBestMark - a.thirdBestMark;
    }

    // 4. Empate matemático absoluto
    return 0;
  });

  // Asignar puestos (1º, 2º, 3º...) y generar explicación transparente de desempate
  const ranked = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    let tieNote = '';

    if (!current.hasValidMark) {
      ranked.push({
        ...current,
        rank: current.hasOnlyFouls ? 'SM' : 'DNS', // SM = Sin Marca / Nulo en todos
        rankNumber: 999,
        tieNote: current.hasOnlyFouls ? '3 intentos nulos (Sin Marca)' : 'No se presentó (DNS)'
      });
      continue;
    }

    // Comparar con el anterior o posterior para detectar si hubo desempate
    const prev = sorted[i - 1];
    const next = sorted[i + 1];

    if (prev && Math.abs(prev.bestMark - current.bestMark) <= 0.0001) {
      // Hubo empate en la mejor marca
      if (Math.abs(prev.secondBestMark - current.secondBestMark) > 0.0001) {
        tieNote = `Desempate por 2ª marca: (${current.secondBestMark.toFixed(2)}m vs ${prev.secondBestMark.toFixed(2)}m)`;
      } else if (Math.abs(prev.thirdBestMark - current.thirdBestMark) > 0.0001) {
        tieNote = `Desempate por 3ª marca: (${current.thirdBestMark.toFixed(2)}m vs ${prev.thirdBestMark.toFixed(2)}m)`;
      } else {
        tieNote = 'Empate técnico compartido';
      }
    } else if (next && Math.abs(next.bestMark - current.bestMark) <= 0.0001) {
      if (Math.abs(current.secondBestMark - next.secondBestMark) > 0.0001) {
        tieNote = `Gana desempate por 2ª marca (${current.secondBestMark.toFixed(2)}m vs ${next.secondBestMark.toFixed(2)}m)`;
      } else if (Math.abs(current.thirdBestMark - next.thirdBestMark) > 0.0001) {
        tieNote = `Gana desempate por 3ª marca (${current.thirdBestMark.toFixed(2)}m vs ${next.thirdBestMark.toFixed(2)}m)`;
      } else {
        tieNote = 'Empate técnico compartido';
      }
    }

    ranked.push({
      ...current,
      rank: currentRank,
      rankNumber: currentRank,
      tieNote
    });

    // Solo avanzar el número de rango si el siguiente no está en empate técnico idéntico
    if (!next || Math.abs(next.bestMark - current.bestMark) > 0.0001 ||
        Math.abs(next.secondBestMark - current.secondBestMark) > 0.0001 ||
        Math.abs(next.thirdBestMark - current.thirdBestMark) > 0.0001) {
      currentRank = ranked.length + 1;
    }
  }

  return ranked;
}

/**
 * Clasifica competidores en pruebas de pista (carreras) por menor tiempo.
 * Maneja estados especiales como DNS (No presentó), DNF (No terminó) y DQ (Descalificado).
 * 
 * @param {Array} runners - Lista de corredores con su tiempo en segundos y estado
 * @returns {Array} Lista clasificada con posiciones
 */
export function rankTrackEventRunners(runners = []) {
  if (!Array.isArray(runners) || runners.length === 0) return [];

  const validRunners = [];
  const invalidRunners = [];

  runners.forEach(r => {
    if (r.status === 'valid' && typeof r.timeSeconds === 'number' && r.timeSeconds > 0) {
      validRunners.push(r);
    } else {
      invalidRunners.push(r);
    }
  });

  // Ordenar válidos de MENOR tiempo a MAYOR tiempo (más rápido primero)
  validRunners.sort((a, b) => a.timeSeconds - b.timeSeconds);

  let currentRank = 1;
  const ranked = [];

  for (let i = 0; i < validRunners.length; i++) {
    const current = validRunners[i];
    const prev = ranked[i - 1];

    if (prev && Math.abs(prev.timeSeconds - current.timeSeconds) < 0.005) {
      // Mismo tiempo a la centésima: comparten lugar oficial
      ranked.push({
        ...current,
        rank: prev.rank,
        rankNumber: prev.rankNumber,
        tieNote: 'Empate compartido a la centésima'
      });
    } else {
      ranked.push({
        ...current,
        rank: i + 1,
        rankNumber: i + 1,
        tieNote: ''
      });
    }
  }

  // Agregar los no válidos al final (DNS, DNF, DQ)
  invalidRunners.forEach(inv => {
    ranked.push({
      ...inv,
      rank: inv.status?.toUpperCase() || 'DESC',
      rankNumber: 999,
      tieNote: inv.statusReason || ''
    });
  });

  return ranked;
}
