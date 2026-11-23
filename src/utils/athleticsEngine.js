/**
 * Motor de Gestión Deportiva para Atletismo
 * - Asignación inteligente de Series (Heats) y Carriles (Lanes) con separación de escuelas
 * - Orden de llamada de Concursos de Campo
 * - Agregador de progreso en vivo para la Mesa de Control
 */

import { OFFICIAL_EVENTS, isFieldEvent, isTrackEvent } from '../constants/events.js';
import { evaluateFieldAttempts, rankFieldEventCompetitors, rankTrackEventRunners } from './tieBreaker.js';

/**
 * Distribuye corredores en series (heats) y asigna carriles (1 a 8)
 * aplicando algoritmo de dispersión para evitar que corredores de la misma
 * escuela queden en la misma serie siempre que sea matemáticamente posible.
 */
export function generateTrackHeats(athletesList = [], numLanes = 6) {
  if (!athletesList || athletesList.length === 0) return [];

  const totalAthletes = athletesList.length;
  // Calcular número de series necesarias
  const numHeats = Math.ceil(totalAthletes / numLanes);
  const athletesPerHeat = Math.ceil(totalAthletes / numHeats);

  // Agrupar por escuela para balancear series (evitar choque de compañeros)
  const bySchool = {};
  athletesList.forEach(ath => {
    const sId = ath.schoolId || 'sin_escuela';
    if (!bySchool[sId]) bySchool[sId] = [];
    bySchool[sId].push(ath);
  });

  // Repartir en las series equitativamente
  const heats = Array.from({ length: numHeats }, (_, idx) => ({
    heatNumber: idx + 1,
    name: `Serie ${idx + 1} de ${numHeats}`,
    lanes: []
  }));

  let currentHeatIndex = 0;
  // Ordenar escuelas de mayor a menor cantidad de atletas
  const sortedSchools = Object.values(bySchool).sort((a, b) => b.length - a.length);

  sortedSchools.forEach(schoolGroup => {
    schoolGroup.forEach(athlete => {
      heats[currentHeatIndex].lanes.push(athlete);
      currentHeatIndex = (currentHeatIndex + 1) % numHeats;
    });
  });

  // Asignar carriles a cada atleta dentro de su serie (ej. carriles 1 a 6)
  heats.forEach(heat => {
    heat.lanes = heat.lanes.map((athlete, idx) => ({
      ...athlete,
      assignedLane: idx + 1,
      heatNumber: heat.heatNumber
    }));
  });

  return heats;
}

/**
 * Genera la lista de participantes en un concurso de campo con 3 intentos vacíos
 */
export function generateFieldFlight(athletesList = []) {
  if (!athletesList || athletesList.length === 0) return [];

  return athletesList.map((ath, idx) => ({
    ...ath,
    orderNumber: idx + 1,
    attempts: [
      { attemptNum: 1, value: null, status: 'pending' },
      { attemptNum: 2, value: null, status: 'pending' },
      { attemptNum: 3, value: null, status: 'pending' }
    ]
  }));
}

/**
 * Calcula el resumen de estado de todo el torneo para el tablero de la Mesa de Control
 */
export function computeTournamentEventStatus(eventsList = OFFICIAL_EVENTS, tournamentData = {}) {
  const results = tournamentData.results || {};
  const athletes = tournamentData.athletes || [];
  const schools = tournamentData.schools || [];

  return eventsList.map(ev => {
    // Filtrar atletas inscritos en este evento
    const enrolledAthletes = athletes.filter(a => (a.eventIds || []).includes(ev.id));
    const eventResults = results[ev.id] || {};

    let totalParticipants = enrolledAthletes.length;
    let completedCount = 0;
    let status = 'pending'; // 'pending' | 'in_progress' | 'completed' | 'awarded'

    if (isFieldEvent(ev.id)) {
      // En campo: contar cuántos tienen sus 3 intentos completados
      const fieldData = eventResults.fieldEntries || [];
      totalParticipants = Math.max(totalParticipants, fieldData.length);
      
      fieldData.forEach(entry => {
        const attempts = entry.attempts || [];
        const completedAttempts = attempts.filter(a => a.status === 'valid' || a.status === 'foul' || a.status === 'pass').length;
        if (completedAttempts === 3) completedCount++;
      });
    } else {
      // En pista: contar cuántos tienen tiempo registrado
      const trackData = eventResults.trackEntries || [];
      totalParticipants = Math.max(totalParticipants, trackData.length);
      
      trackData.forEach(entry => {
        if (entry.status === 'valid' || entry.status === 'dns' || entry.status === 'dnf' || entry.status === 'dq') {
          completedCount++;
        }
      });
    }

    if (totalParticipants > 0 && completedCount === totalParticipants) {
      status = eventResults.isAwarded ? 'awarded' : 'completed';
    } else if (completedCount > 0) {
      status = 'in_progress';
    }

    return {
      event: ev,
      totalParticipants,
      completedCount,
      progressPercent: totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0,
      status,
      isReadyForAwards: status === 'completed',
      isAwarded: status === 'awarded'
    };
  });
}
