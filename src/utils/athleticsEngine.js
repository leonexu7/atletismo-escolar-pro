/**
 * Motor de Gestión Deportiva para Atletismo
 * - Asignación inteligente de Series (Heats) y Carriles (Lanes) con separación de escuelas
 * - Orden de llamada de Concursos de Campo
 * - Agregador de progreso en vivo para la Mesa de Control
 */

import { OFFICIAL_EVENTS, isFieldEvent, isTrackEvent, isRelayEvent } from '../constants/events.js';
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

function computeSubsetProgress(participantsList, entriesList, isField, isAwardedFlag) {
  const participantIdSet = new Set(participantsList.map(p => p.id));
  const dedupedEntriesMap = new Map();

  (entriesList || []).forEach(entry => {
    const entryId = entry?.athleteId || entry?.id;
    if (!entryId) return;
    if (participantIdSet.size > 0 && !participantIdSet.has(entryId)) return;
    dedupedEntriesMap.set(entryId, entry);
  });

  const relevantEntries = Array.from(dedupedEntriesMap.values());
  const totalParticipants = participantsList.length > 0
    ? Math.max(participantsList.length, relevantEntries.length)
    : relevantEntries.length;

  let completedCount = 0;
  if (isField) {
    relevantEntries.forEach(entry => {
      const attempts = entry.attempts || [];
      const completedAttempts = attempts.filter(
        a => a && (a.status === 'valid' || a.status === 'foul' || a.status === 'pass' || a.status === 'dns')
      ).length;
      if (completedAttempts >= 3) completedCount++;
    });
  } else {
    relevantEntries.forEach(entry => {
      if (entry.status === 'valid' || entry.status === 'dns' || entry.status === 'dnf' || entry.status === 'dq') {
        completedCount++;
      }
    });
  }

  let status = 'pending';
  if (totalParticipants > 0 && completedCount === totalParticipants) {
    status = isAwardedFlag ? 'awarded' : 'completed';
  } else if (completedCount > 0) {
    status = 'in_progress';
  }

  return {
    totalParticipants,
    completedCount,
    progressPercent: totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0,
    status,
    isReadyForAwards: status === 'completed',
    isAwarded: status === 'awarded'
  };
}

/**
 * Calcula el resumen de estado de todo el torneo para el tablero de la Mesa de Control
 */
export function computeTournamentEventStatus(eventsList = OFFICIAL_EVENTS, tournamentData = {}) {
  const results = tournamentData.results || {};
  const athletes = tournamentData.athletes || [];
  const relays = tournamentData.relays || [];
  const athleteGenderMap = new Map(athletes.map(a => [a.id, a.gender]));

  return eventsList.map(ev => {
    const eventResults = results[ev.id] || {};

    if (isRelayEvent(ev.id)) {
      const enrolledRelays = relays.filter(r => r.eventId === ev.id);
      const trackData = eventResults.trackEntries || [];
      const relayGender = ev.applicableGenders?.[0] || 'MIXED';
      const awardedFlag =
        Boolean(eventResults.isAwarded) ||
        Boolean(eventResults.awardedByGender?.[relayGender]);
      const relayProgress = computeSubsetProgress(enrolledRelays, trackData, false, awardedFlag);

      return {
        event: ev,
        isRelay: true,
        participantUnit: 'equipos',
        ...relayProgress,
        byGender: { [relayGender]: relayProgress }
      };
    }

    // Pruebas individuales de pista y campo
    const enrolledAthletes = athletes.filter(a => (a.eventIds || []).includes(ev.id));
    const fieldEvent = isFieldEvent(ev.id);
    const entries = fieldEvent ? (eventResults.fieldEntries || []) : (eventResults.trackEntries || []);

    const getEntryGender = (entry) => entry?.gender || athleteGenderMap.get(entry?.athleteId) || 'M';
    const maleAthletes = enrolledAthletes.filter(a => a.gender === 'M');
    const femaleAthletes = enrolledAthletes.filter(a => a.gender === 'F');
    const maleEntries = entries.filter(e => getEntryGender(e) === 'M');
    const femaleEntries = entries.filter(e => getEntryGender(e) === 'F');

    const awardedM =
      Boolean(eventResults.isAwarded) ||
      Boolean(eventResults.awardedByGender?.M);
    const awardedF =
      Boolean(eventResults.isAwarded) ||
      Boolean(eventResults.awardedByGender?.F);

    const progressM = computeSubsetProgress(maleAthletes, maleEntries, fieldEvent, awardedM);
    const progressF = computeSubsetProgress(femaleAthletes, femaleEntries, fieldEvent, awardedF);

    const overallAwarded = Boolean(eventResults.isAwarded) || (
      (progressM.totalParticipants > 0 || progressF.totalParticipants > 0) &&
      (progressM.totalParticipants === 0 || progressM.isAwarded) &&
      (progressF.totalParticipants === 0 || progressF.isAwarded)
    );
    const overallProgress = computeSubsetProgress(enrolledAthletes, entries, fieldEvent, overallAwarded);

    return {
      event: ev,
      isRelay: false,
      participantUnit: 'atletas',
      ...overallProgress,
      byGender: {
        M: progressM,
        F: progressF
      }
    };
  });
}
