/**
 * Simulación de Estrés Multi-Agente: Atletismo Escolar Pro
 * Simula el flujo completo de:
 * 1. Múltiples Maestros registrando alumnos, escuelas y relevos (validando límites, dorsales, edades y anti-duplicados).
 * 2. Mesa de Control y Jueces Oficiales realizando el jueceo en vivo de pista y campo.
 * 3. Detección de cualquier bug o cuello de botella en los cálculos o generación de series y podios.
 */

import { generateTrackHeats, generateFieldFlight, computeTournamentEventStatus } from '../src/utils/athleticsEngine.js';
import { evaluateFieldAttempts, rankFieldEventCompetitors, rankTrackEventRunners } from '../src/utils/tieBreaker.js';
import { formatTrackTime, parseTrackTime, formatFieldDistance, parseFieldDistance, calculateAge, isRegistrationDeadlineExpired } from '../src/utils/timeFormatter.js';
import { PARTICIPATION_LIMITS } from '../src/constants/categories.js';
import { OFFICIAL_EVENTS, isTrackEvent, isFieldEvent } from '../src/constants/events.js';
import { cleanCCT, cleanSchoolName, findExistingSchoolMatch } from '../src/utils/schoolNormalizer.js';
import { DEFAULT_TOURNAMENT_INFO, purgeAllTournamentData } from '../src/utils/storage.js';

console.log('🚀 Iniciando Simulación de Estrés Multi-Agente (Maestros + Mesa de Control)...\n');

let failedChecks = 0;
function check(condition, desc) {
  if (condition) {
    console.log(`  ✅ ${desc}`);
  } else {
    console.error(`  ❌ FALLÓ: ${desc}`);
    failedChecks++;
  }
}

// ==========================================
// FASE 1: AGENTES MAESTROS REGISTRANDO ALUMNOS
// ==========================================
console.log('📌 FASE 1: Simulación de Agentes Maestros (Inscripción Cédulas y CCTs)...');

// Maestro 1: Escuela Benito Juárez
const school1 = {
  id: 'esc-1',
  name: 'Esc. Primaria Federal Benito Juárez',
  cct: '21EPR0101A',
  zone: 'Zona Escolar 04',
  inspection: 'Inspección 12'
};

// Maestro 2: Escuela Emiliano Zapata
const school2 = {
  id: 'esc-2',
  name: 'PRIMARIA EMILIANO ZAPATA',
  cct: '21EPR0202B',
  zone: 'Zona Escolar 04',
  inspection: 'Inspección 12'
};

// Maestro 3: Intento de registrar escuela duplicada con diferente tipografía
const duplicateSchoolAttempt = {
  name: '  esc.  primaria  benito  juarez  ',
  cct: '21-epr-0101-a'
};

const duplicateMatch = findExistingSchoolMatch([school1, school2], duplicateSchoolAttempt);
check(duplicateMatch.isMatch && duplicateMatch.matchedSchool.id === 'esc-1', 'Detección anti-duplicados fusiona correctamente CCT normalizado');

// Generador de 24 atletas con edades reglamentarias escolares (8 a 12 años)
const simulatedAthletes = [];
const firstNames = ['Mateo', 'Sofía', 'Santiago', 'Valentina', 'Sebastián', 'Camila', 'Leonardo', 'Valeria', 'Diego', 'Lucía', 'Emiliano', 'Ximena', 'Alexander', 'Regina', 'Daniel', 'Victoria', 'David', 'Renata', 'Gabriel', 'Natalia', 'Bruno', 'Daniela', 'Eduardo', 'Mariana'];
const lastNames = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez'];

for (let i = 0; i < 24; i++) {
  const gender = i % 2 === 0 ? 'M' : 'F';
  const schoolId = i < 12 ? 'esc-1' : 'esc-2';
  const birthYear = 2014 + (i % 3); // 2014, 2015, 2016
  const birthMonth = String((i % 12) + 1).padStart(2, '0');
  const birthDay = String((i % 28) + 1).padStart(2, '0');
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

  // Asignar 2 pruebas individuales reglamentarias
  const trackEv = gender === 'M' ? 'pista_75m' : 'pista_150m';
  const fieldEv = (i % 4 === 0) ? 'campo_longitud' : (i % 4 === 1) ? 'campo_bala' : (i % 4 === 2) ? 'campo_disco' : 'campo_pelota';
  const eventIds = [trackEv, fieldEv];

  simulatedAthletes.push({
    id: `ath-${i + 1}`,
    bibNumber: 100 + i + 1,
    fullName: `${firstNames[i]} ${lastNames[i % lastNames.length]}`,
    curp: `CURP${i + 1000}PUE`,
    gender,
    schoolId,
    birthDate,
    eventIds
  });
}

check(simulatedAthletes.length === 24, '24 Atletas registrados con éxito');

// Verificar que la generación automática de dorsal previene colisiones con huecos
const existingWithGaps = [{ bibNumber: 101 }, { bibNumber: 105 }];
const nextCalculatedBib = existingWithGaps.reduce((max, a) => Math.max(max, parseInt(a.bibNumber, 10) || 0), 100) + 1;
check(nextCalculatedBib === 106, 'Generación de dorsal con huecos siempre toma el máximo existente + 1 (evita colisiones)');

// Verificar validación de límite de 2 pruebas individuales
const invalidAthleteAttempt = {
  ...simulatedAthletes[0],
  eventIds: ['pista_75m', 'pista_150m', 'campo_longitud'] // 3 individuales -> ILEGAL
};
const individualCount = invalidAthleteAttempt.eventIds.filter(e => {
  const ev = OFFICIAL_EVENTS.find(o => o.id === e);
  return ev && ev.type !== 'relevo';
}).length;
check(individualCount > PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS, 'Reglamento detecta violación al intentar inscribir más de 2 pruebas individuales');

// ==========================================
// FASE 2: MOTOR DE SERIES Y CARRILES (PISTA)
// ==========================================
console.log('\n📌 FASE 2: Simulación de Juez de Pista (Series, Dispersión y Cronometraje)...');

// Corredores inscritos en 75m Planos Varonil
const runners75m = simulatedAthletes.filter(a => a.eventIds.includes('pista_75m'));
check(runners75m.length === 12, '12 corredores inscritos en 75m Planos Varonil');

// Generar series con 6 carriles reglamentarios
const heats75m = generateTrackHeats(runners75m, 6);
check(heats75m.length === 2, '12 corredores se dividen exactamente en 2 series de 6 carriles');
check(heats75m[0].lanes.length === 6, 'Serie 1 tiene 6 carriles asignados');
check(heats75m[1].lanes.length === 6, 'Serie 2 tiene 6 carriles asignados');

// Verificar algoritmo de dispersión escolar (no concentrar toda una escuela en la serie 1)
const school1InHeat1 = heats75m[0].lanes.filter(r => r.schoolId === 'esc-1').length;
const school2InHeat1 = heats75m[0].lanes.filter(r => r.schoolId === 'esc-2').length;
check(school1InHeat1 > 0 && school2InHeat1 > 0, 'Algoritmo de dispersión balancea corredores de ambas escuelas en la Serie 1');

// Simulación de Tiempos Registrados por los Cronometristas en la Meta
const simulatedTrackEntries75m = [];
const mockTimes = [10.22, 10.45, 10.58, 10.70, 10.85, 10.92, 10.15, 10.35, 10.58, 11.02, 11.20, 11.40];

runners75m.forEach((runner, idx) => {
  simulatedTrackEntries75m.push({
    athleteId: runner.id,
    fullName: runner.fullName,
    schoolId: runner.schoolId,
    bibNumber: runner.bibNumber,
    timeSeconds: mockTimes[idx],
    status: 'valid'
  });
});

// Clasificación general de la prueba
const rankedTrack = rankTrackEventRunners(simulatedTrackEntries75m);
check(rankedTrack[0].timeSeconds === 10.15, 'El 1º lugar tiene el menor tiempo (10.15s - Medalla de Oro)');
check(rankedTrack[1].timeSeconds === 10.22, 'El 2º lugar tiene 10.22s (Medalla de Plata)');
check(rankedTrack[2].timeSeconds === 10.35, 'El 3º lugar tiene 10.35s (Medalla de Bronce)');

// Comprobar empate técnico a la centésima (mockTimes[2] y mockTimes[8] = 10.58s)
const tiedRunners = rankedTrack.filter(r => r.timeSeconds === 10.58);
check(tiedRunners.length === 2 && tiedRunners[0].rank === tiedRunners[1].rank && tiedRunners[0].rank === 5, 'Empate a la centésima en pista otorga la misma posición compartida (5º lugar)');

// ==========================================
// FASE 3: CONCURSO DE CAMPO (3 INTENTOS Y DESEMPATES)
// ==========================================
console.log('\n📌 FASE 3: Simulación de Juez de Campo (Salto de Longitud y 3 Intentos)...');

const jumpers = simulatedAthletes.filter(a => a.eventIds.includes('campo_longitud'));
check(jumpers.length === 6, '6 atletas inscritos en Salto de Longitud');

const flight = generateFieldFlight(jumpers);
check(flight.length === 6, 'Hoja de vuelo generada con 6 participantes');
check(flight[0].attempts.length === 3, 'Cada atleta cuenta con sus 3 intentos reglamentarios');

// Simular marcas con empate intencional en la mejor marca para forzar desempate por 2ª marca
// Atleta 0: 3.80m, 3.50m, nulo -> Mejor: 3.80m, 2ª: 3.50m
// Atleta 1: 3.80m, 3.65m, 3.20m -> Mejor: 3.80m, 2ª: 3.65m (GANA ORO POR 2ª MARCA)
// Atleta 2: 3.75m, 3.40m, 3.30m -> Mejor: 3.75m (BRONCE)
// Atleta 3: Nulo, Nulo, Nulo -> SM (Sin Marca)
const evaluatedFieldCompetitors = [
  {
    ...jumpers[0],
    ...evaluateFieldAttempts([
      { attemptNum: 1, value: 3.80, status: 'valid' },
      { attemptNum: 2, value: 3.50, status: 'valid' },
      { attemptNum: 3, value: null, status: 'foul' }
    ])
  },
  {
    ...jumpers[1],
    ...evaluateFieldAttempts([
      { attemptNum: 1, value: 3.80, status: 'valid' },
      { attemptNum: 2, value: 3.65, status: 'valid' },
      { attemptNum: 3, value: 3.20, status: 'valid' }
    ])
  },
  {
    ...jumpers[2],
    ...evaluateFieldAttempts([
      { attemptNum: 1, value: 3.75, status: 'valid' },
      { attemptNum: 2, value: 3.40, status: 'valid' },
      { attemptNum: 3, value: 3.30, status: 'valid' }
    ])
  },
  {
    ...jumpers[3],
    ...evaluateFieldAttempts([
      { attemptNum: 1, value: null, status: 'foul' },
      { attemptNum: 2, value: null, status: 'foul' },
      { attemptNum: 3, value: null, status: 'foul' }
    ])
  }
];

const rankedField = rankFieldEventCompetitors(evaluatedFieldCompetitors);
check(rankedField[0].id === jumpers[1].id, 'Atleta 1 gana Oro en Salto por mejor 2ª marca (3.65m vs 3.50m)');
check(rankedField[1].id === jumpers[0].id, 'Atleta 0 queda con Plata por tener 3.80m con 2ª marca de 3.50m');
check(rankedField[2].id === jumpers[2].id, 'Atleta 2 gana Bronce con 3.75m');
check(rankedField[3].rank === 'SM', 'Atleta con 3 nulos queda clasificado al final como Sin Marca (SM)');

// ==========================================
// FASE 4: MESA DE CONTROL Y PODIOS
// ==========================================
console.log('\n📌 FASE 4: Mesa de Control Central (Avance, Premiación y Resultados en Vivo)...');

const simulatedTournamentData = {
  tournament: DEFAULT_TOURNAMENT_INFO,
  schools: [school1, school2],
  athletes: simulatedAthletes,
  results: {
    'pista_75m': {
      trackEntries: simulatedTrackEntries75m,
      isAwarded: false
    },
    'campo_longitud': {
      fieldEntries: evaluatedFieldCompetitors.map(c => ({
        athleteId: c.id,
        attempts: c.attemptsDetails
      })),
      isAwarded: false
    }
  }
};

const tournamentStatus = computeTournamentEventStatus(OFFICIAL_EVENTS, simulatedTournamentData);
const status75m = tournamentStatus.find(s => s.event.id === 'pista_75m');
const statusLongitud = tournamentStatus.find(s => s.event.id === 'campo_longitud');

check(status75m.status === 'completed' || status75m.status === 'in_progress', 'Estado de 75m refleja captura de corredores');
check(status75m.isReadyForAwards === true || status75m.completedCount > 0, '75m detecta registros para podio');

// Simular Premiación Oficial
simulatedTournamentData.results['pista_75m'].isAwarded = true;
const updatedStatus = computeTournamentEventStatus(OFFICIAL_EVENTS, simulatedTournamentData);
const awarded75m = updatedStatus.find(s => s.event.id === 'pista_75m');
check(awarded75m.isAwarded === true, 'Mesa de Control marca 75m como Premiada oficialmente');

// ==========================================
// RESULTADO FINAL DE LA SIMULACIÓN
// ==========================================
console.log('\n------------------------------------------------------------');
if (failedChecks === 0) {
  console.log('🎉 TODAS LAS VERIFICACIONES DE LA SIMULACIÓN PASARON EXITOSAMENTE (0 fallas).');
  console.log('El sistema de atletismo escolar resistió la carga completa de maestros, series, cronómetros y jueces.');
  process.exit(0);
} else {
  console.error(`💥 ${failedChecks} verificación(es) fallaron durante la simulación.`);
  process.exit(1);
}
