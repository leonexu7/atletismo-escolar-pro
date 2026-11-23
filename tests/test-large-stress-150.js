/**
 * Test de Gran Escala y Estrés: 150+ Atletas en Atletismo Escolar Pro
 * Simula el comportamiento completo del sistema con:
 * - 10 Escuelas Primarias oficiales concurrentes.
 * - 160 Atletas inscritos (80 Varonil / 80 Femenil).
 * - Algoritmo de dispersión de series en pista con 6 y 8 carriles (hasta 25 series).
 * - Concursos de campo con 40+ atletas, 3 intentos y desempates World Athletics.
 * - Rendimiento de la Mesa de Control y cálculo de estados de los 12 eventos oficiales.
 * - Medición estricta de tiempos de ejecución (<50ms para 160 atletas).
 */

import { generateTrackHeats, generateFieldFlight, computeTournamentEventStatus } from '../src/utils/athleticsEngine.js';
import { evaluateFieldAttempts, rankFieldEventCompetitors, rankTrackEventRunners } from '../src/utils/tieBreaker.js';
import { formatTrackTime, parseTrackTime, formatFieldDistance, parseFieldDistance, calculateAge } from '../src/utils/timeFormatter.js';
import { PARTICIPATION_LIMITS } from '../src/constants/categories.js';
import { OFFICIAL_EVENTS, isTrackEvent, isFieldEvent } from '../src/constants/events.js';
import { cleanCCT, cleanSchoolName, findExistingSchoolMatch } from '../src/utils/schoolNormalizer.js';
import { DEFAULT_TOURNAMENT_INFO } from '../src/utils/storage.js';

console.log('🏁 =================================================================');
console.log('   SIMULACIÓN MASIVA DE ALTO ESTRÉS (160 ATLETAS / 10 ESCUELAS)');
console.log('=================================================================\n');

let failedChecks = 0;
function check(condition, desc) {
  if (condition) {
    console.log(`  ✅ ${desc}`);
  } else {
    console.error(`  ❌ FALLÓ: ${desc}`);
    failedChecks++;
  }
}

// -------------------------------------------------------------
// 1. GENERACIÓN DE 10 ESCUELAS PRIMARIAS
// -------------------------------------------------------------
const schools = [
  { id: 'esc-1', name: 'Escuela Primaria Federal Benito Juárez', shortName: 'Benito Juárez', cct: '21EPR0101A' },
  { id: 'esc-2', name: 'Primaria Urbana Emiliano Zapata', shortName: 'Zapata', cct: '21EPR0202B' },
  { id: 'esc-3', name: 'Centro Escolar Niños Héroes de Chapultepec', shortName: 'CENHCH', cct: '21EPR0303C' },
  { id: 'esc-4', name: 'Escuela Primaria Miguel Hidalgo y Costilla', shortName: 'Hidalgo', cct: '21EPR0404D' },
  { id: 'esc-5', name: 'Primaria Rural Lázaro Cárdenas del Río', shortName: 'Lázaro Cárdenas', cct: '21EPR0505E' },
  { id: 'esc-6', name: 'Instituto Escolar Josefa Ortiz de Domínguez', shortName: 'Josefa Ortiz', cct: '21EPR0606F' },
  { id: 'esc-7', name: 'Colegio Primario Morelos de Puebla', shortName: 'Morelos', cct: '21EPR0707G' },
  { id: 'esc-8', name: 'Primaria Venustiano Carranza', shortName: 'Carranza', cct: '21EPR0808H' },
  { id: 'esc-9', name: 'Escuela Primaria Francisco I. Madero', shortName: 'Madero', cct: '21EPR0909I' },
  { id: 'esc-10', name: 'Centro Educativo Cuauhtémoc', shortName: 'Cuauhtémoc', cct: '21EPR1010J' }
];

console.log(`🏫 10 Escuelas participantes creadas.`);
check(schools.length === 10, '10 Escuelas inicializadas correctamente');

// -------------------------------------------------------------
// 2. GENERACIÓN DE 160 ATLETAS
// -------------------------------------------------------------
const firstNamesM = ['Santiago', 'Mateo', 'Sebastián', 'Leonardo', 'Emiliano', 'Diego', 'Daniel', 'Alexander', 'David', 'Gabriel', 'Bruno', 'Eduardo', 'Rodrigo', 'Javier', 'Carlos', 'Ángel'];
const firstNamesF = ['Sofía', 'Valentina', 'Regina', 'Camila', 'Valeria', 'Ximena', 'Victoria', 'Lucía', 'Natalia', 'Renata', 'Daniela', 'Mariana', 'Fernanda', 'Andrea', 'Elena', 'Paola'];
const lastNames = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez'];

const athletes = [];
let bibCounter = 101;

// 16 atletas por escuela = 160 atletas
schools.forEach((school, sIdx) => {
  for (let i = 0; i < 16; i++) {
    const isMale = i % 2 === 0;
    const gender = isMale ? 'M' : 'F';
    const fnList = isMale ? firstNamesM : firstNamesF;
    const firstName = fnList[i % fnList.length];
    const lastName = lastNames[(sIdx * 3 + i) % lastNames.length];
    const birthYear = 2014 + (i % 3); // 2014, 2015, 2016 (8 a 12 años)
    const birthMonth = String((i % 12) + 1).padStart(2, '0');
    const birthDay = String((i % 28) + 1).padStart(2, '0');
    const grade = 3 + (i % 4); // 3°, 4°, 5°, 6°

    // Asignación de 2 pruebas individuales reglamentarias
    // Pista: 75m, 150m, 300m, 600m
    // Campo: Longitud, Bala, Disco, Pelota
    let trackEventId;
    if (i < 4) trackEventId = 'pista_75m';
    else if (i < 8) trackEventId = 'pista_150m';
    else if (i < 12) trackEventId = 'pista_300m';
    else trackEventId = 'pista_600m';

    let fieldEventId;
    if (i % 4 === 0) fieldEventId = 'campo_longitud';
    else if (i % 4 === 1) fieldEventId = 'campo_bala';
    else if (i % 4 === 2) fieldEventId = 'campo_disco';
    else fieldEventId = 'campo_pelota';

    const eventIds = [trackEventId, fieldEventId];

    athletes.push({
      id: `ath-${sIdx + 1}-${i + 1}`,
      bibNumber: bibCounter++,
      fullName: `${firstName} ${lastName}`,
      gender,
      schoolGrade: grade,
      birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
      schoolId: school.id,
      schoolName: school.name,
      eventIds
    });
  }
});

console.log(`🏃 Total de atletas generados: ${athletes.length}`);
check(athletes.length === 160, '160 Atletas inscritos con cédulas válidas (requisito >= 150 superado)');

// Validar que no hay números de dorsal repetidos
const uniqueBibs = new Set(athletes.map(a => a.bibNumber));
check(uniqueBibs.size === 160, 'Todos los 160 dorsales son únicos y consecutivos (sin colisiones)');

// Validar edades y límites de pruebas
const validAges = athletes.every(a => {
  const age = calculateAge(a.birthDate);
  return age >= 8 && age <= 13;
});
check(validAges, 'Todas las edades calculadas están en el rango de educación primaria escolar (8 a 13 años)');

const validParticipationLimits = athletes.every(a => {
  return a.eventIds.length <= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS;
});
check(validParticipationLimits, 'Ningún atleta excede las 2 pruebas individuales reglamentarias');

// -------------------------------------------------------------
// 3. MOTOR DE SERIES DE PISTA (75m Planos con 40 Corredores)
// -------------------------------------------------------------
console.log('\n--- PRUEBA 3: Motor de Series y Carriles con Gran Escala ---');

const runners75m = athletes.filter(a => a.eventIds.includes('pista_75m'));
check(runners75m.length === 40, '40 Atletas inscritos en 75m Planos');

// Generar series con 6 carriles
const t0 = performance.now();
const heats6Lanes = generateTrackHeats(runners75m, 6);
const t1 = performance.now();
const heatsTime6 = t1 - t0;

console.log(`  ⚡ Tiempo de generación de series (6 carriles): ${heatsTime6.toFixed(3)} ms`);
check(heatsTime6 < 20, 'Generación de series ejecuta en menos de 20ms (altamente optimizado)');

// Con 40 atletas y 6 carriles: ceil(40 / 6) = 7 series
check(heats6Lanes.length === 7, '40 corredores en 6 carriles generan exactamente 7 series');

// Validar que ningún carril excede la capacidad de la pista (6)
const noOverflow = heats6Lanes.every(h => h.lanes.length <= 6);
check(noOverflow, 'Ninguna serie excede los 6 carriles de capacidad');

// Validar que la suma total de carriles asignados es exactamente 40
const totalAssignedRunners = heats6Lanes.reduce((sum, h) => sum + h.lanes.length, 0);
check(totalAssignedRunners === 40, 'Los 40 corredores fueron asignados a un carril sin duplicados ni extravíos');

// Validar dispersión de escuelas: en la Serie 1 no deben haber corredores concentrados de una sola escuela
const schoolsInHeat1 = new Set(heats6Lanes[0].lanes.map(r => r.schoolId));
check(schoolsInHeat1.size >= 4, `Serie 1 tiene atletas de ${schoolsInHeat1.size} escuelas diferentes (dispersión escolar efectiva)`);

// Test con 8 carriles
const heats8Lanes = generateTrackHeats(runners75m, 8);
check(heats8Lanes.length === 5, '40 corredores en pista de 8 carriles generan exactamente 5 series de 8');
check(heats8Lanes.every(h => h.lanes.length === 8), 'Cada serie de 8 carriles está completa al 100%');

// Test de estrés extremo: 150 corredores en una sola prueba de pista
const extremeRunners = athletes.slice(0, 150);
const extremeHeats = generateTrackHeats(extremeRunners, 6);
check(extremeHeats.length === 25, '150 corredores generan 25 series exactas de 6 carriles');
check(extremeHeats.reduce((acc, h) => acc + h.lanes.length, 0) === 150, '150 corredores repartidos íntegramente en 25 series');

// -------------------------------------------------------------
// 4. CRONOMETRAJE Y DESEMPATE TÉCNICO A LA CENTÉSIMA
// -------------------------------------------------------------
console.log('\n--- PRUEBA 4: Clasificación y Desempates en Pista (40 Tiempos) ---');

// Simular 40 tiempos oficiales con empates intencionales
const simulatedTrackEntries = runners75m.map((runner, idx) => {
  let time;
  if (idx === 0) time = 9.85; // Oro
  else if (idx === 1) time = 9.92; // Plata
  else if (idx === 2 || idx === 3) time = 10.05; // Empate en Bronce (3° compartido)
  else if (idx === 4 || idx === 5 || idx === 6) time = 10.30; // Triple empate (5° compartido)
  else if (idx === 38) time = null; // DNS
  else if (idx === 39) time = null; // DNF
  else time = +(10.10 + (idx * 0.05)).toFixed(2);

  return {
    athleteId: runner.id,
    fullName: runner.fullName,
    schoolId: runner.schoolId,
    bibNumber: runner.bibNumber,
    timeSeconds: time,
    status: idx === 38 ? 'dns' : idx === 39 ? 'dnf' : 'valid'
  };
});

const tRank0 = performance.now();
const rankedTrack = rankTrackEventRunners(simulatedTrackEntries);
const tRank1 = performance.now();

console.log(`  ⚡ Tiempo de ranking para 40 corredores: ${(tRank1 - tRank0).toFixed(3)} ms`);
check((tRank1 - tRank0) < 10, 'Clasificación de 40 corredores ejecuta en menos de 10ms');

check(rankedTrack[0].timeSeconds === 9.85 && rankedTrack[0].rank === 1, '1° Lugar Oro: 9.85s');
check(rankedTrack[1].timeSeconds === 9.92 && rankedTrack[1].rank === 2, '2° Lugar Plata: 9.92s');

// Verificar empate en Bronce (idx 2 y 3: 10.05s)
const tiedBronze = rankedTrack.filter(r => r.timeSeconds === 10.05);
check(tiedBronze.length === 2 && tiedBronze[0].rank === 3 && tiedBronze[1].rank === 3, 'Empate a la centésima en Bronce asigna 3° puesto a ambos corredores');

// Verificar que el siguiente puesto después del empate doble salta al 5° lugar
const tripleTied = rankedTrack.filter(r => r.timeSeconds === 10.30);
check(tripleTied.length === 3 && tripleTied[0].rank === 5 && tripleTied[1].rank === 5 && tripleTied[2].rank === 5, 'Triple empate comparte el 5° puesto');

// Verificar que DNS y DNF quedan al final sin romper el cálculo
const dnsRunner = rankedTrack.find(r => r.status === 'dns');
const dnfRunner = rankedTrack.find(r => r.status === 'dnf');
check(dnsRunner && dnsRunner.rank === 'DNS', 'Corredor No Presentado clasificado correctamente como DNS');
check(dnfRunner && dnfRunner.rank === 'DNF', 'Corredor No Termina clasificado correctamente como DNF');

// -------------------------------------------------------------
// 5. CONCURSO DE CAMPO: SALTO DE LONGITUD (40 ATLETAS / 3 INTENTOS)
// -------------------------------------------------------------
console.log('\n--- PRUEBA 5: Concurso de Campo con 40 Atletas y Desempates World Athletics ---');

const longJumpers = athletes.filter(a => a.eventIds.includes('campo_longitud'));
check(longJumpers.length === 40, '40 Atletas inscritos en Salto de Longitud');

const flight = generateFieldFlight(longJumpers);
check(flight.length === 40, 'Hoja de vuelo generada para 40 atletas');
check(flight[0].attempts.length === 3, 'Cada atleta tiene exactamente 3 intentos reglamentarios');

// Simular 40 participaciones con 3 intentos (120 marcas en total)
const evaluatedCompetitors = longJumpers.map((jumper, idx) => {
  let attempts;
  if (idx === 0) {
    // 4.10m, 3.95m, 3.80m -> Mejor: 4.10m, 2a: 3.95m
    attempts = [
      { attemptNum: 1, value: 4.10, status: 'valid' },
      { attemptNum: 2, value: 3.95, status: 'valid' },
      { attemptNum: 3, value: 3.80, status: 'valid' }
    ];
  } else if (idx === 1) {
    // 4.10m, 4.02m, 3.70m -> Mejor: 4.10m, 2a: 4.02m -> GANA ORO POR 2A MARCA
    attempts = [
      { attemptNum: 1, value: 4.10, status: 'valid' },
      { attemptNum: 2, value: 4.02, status: 'valid' },
      { attemptNum: 3, value: 3.70, status: 'valid' }
    ];
  } else if (idx === 2) {
    // 4.10m, 3.95m, 3.80m -> EMPATE EXACTO CON ATLETA 0 EN TODAS LAS MARCAS
    attempts = [
      { attemptNum: 1, value: 4.10, status: 'valid' },
      { attemptNum: 2, value: 3.95, status: 'valid' },
      { attemptNum: 3, value: 3.80, status: 'valid' }
    ];
  } else if (idx === 39) {
    // Sin Marca (3 nulos)
    attempts = [
      { attemptNum: 1, value: null, status: 'foul' },
      { attemptNum: 2, value: null, status: 'foul' },
      { attemptNum: 3, value: null, status: 'foul' }
    ];
  } else {
    const base = +(3.20 + (idx * 0.02)).toFixed(2);
    attempts = [
      { attemptNum: 1, value: base, status: 'valid' },
      { attemptNum: 2, value: +(base - 0.10).toFixed(2), status: 'valid' },
      { attemptNum: 3, value: null, status: 'foul' }
    ];
  }

  return {
    ...jumper,
    ...evaluateFieldAttempts(attempts)
  };
});

const tField0 = performance.now();
const rankedField = rankFieldEventCompetitors(evaluatedCompetitors);
const tField1 = performance.now();

console.log(`  ⚡ Tiempo de ranking para 40 atletas de campo (120 intentos): ${(tField1 - tField0).toFixed(3)} ms`);
check((tField1 - tField0) < 15, 'Evaluación de campo y desempates ejecuta en menos de 15ms');

check(rankedField[0].id === longJumpers[1].id, 'Atleta 1 gana Oro por mejor segunda marca (4.02m vs 3.95m)');
check(rankedField[0].rank === 1, 'Puesto 1 asignado correctamente');

// Atletas 0 y 2 empataron exactamente en su 1a, 2a y 3a marca (4.10, 3.95, 3.80)
const tiedField = rankedField.filter(r => r.id === longJumpers[0].id || r.id === longJumpers[2].id);
check(tiedField.length === 2 && tiedField[0].rank === tiedField[1].rank && tiedField[0].rank === 2, 'Empate técnico absoluto comparte el 2° puesto (Plata compartida)');

// Atleta 39 con 3 nulos
const smAthlete = rankedField.find(r => r.id === longJumpers[39].id);
check(smAthlete && smAthlete.rank === 'SM', 'Atleta con 3 nulos catalogado como Sin Marca (SM) al final');

// -------------------------------------------------------------
// 6. MESA DE CONTROL: CÓMPUTO GENERAL DE 160 ATLETAS Y 12 EVENTOS
// -------------------------------------------------------------
console.log('\n--- PRUEBA 6: Tablero General de Mesa de Control con 160 Atletas ---');

const largeTournamentData = {
  tournament: DEFAULT_TOURNAMENT_INFO,
  schools,
  athletes,
  results: {
    'pista_75m': {
      trackEntries: simulatedTrackEntries,
      isAwarded: false
    },
    'campo_longitud': {
      fieldEntries: evaluatedCompetitors.map(c => ({
        athleteId: c.id,
        attempts: c.attemptsDetails
      })),
      isAwarded: true
    }
  }
};

const tCtrl0 = performance.now();
const eventStatuses = computeTournamentEventStatus(OFFICIAL_EVENTS, largeTournamentData);
const tCtrl1 = performance.now();

console.log(`  ⚡ Tiempo de cálculo para todos los eventos del torneo: ${(tCtrl1 - tCtrl0).toFixed(3)} ms`);
check((tCtrl1 - tCtrl0) < 15, 'Mesa de Control computa el avance global en menos de 15ms');

check(eventStatuses.length === OFFICIAL_EVENTS.length, 'Los 12 eventos oficiales fueron calculados');

const status75m = eventStatuses.find(s => s.event.id === 'pista_75m');
check(status75m.totalParticipants === 40, '75m Planos registra 40 participantes oficiales');
check(status75m.completedCount === 40, '75m Planos computa los 40 corredores completados (incluidos DNS/DNF)');
check(status75m.status === 'completed', '75m Planos marcado como completado y listo para premiación');
check(status75m.isReadyForAwards === true, '75m Planos habilitado para podio y diplomas');

const statusLong = eventStatuses.find(s => s.event.id === 'campo_longitud');
check(statusLong.totalParticipants === 40, 'Salto de Longitud registra 40 participantes oficiales');
check(statusLong.completedCount === 40, 'Los 40 saltadores completaron sus 3 intentos');
check(statusLong.status === 'awarded', 'Salto de Longitud marcado con estatus Oficial Premiado');

// -------------------------------------------------------------
// RESULTADO FINAL DEL STRESS TEST
// -------------------------------------------------------------
console.log('\n=============================================================');
if (failedChecks === 0) {
  console.log('🎉 PRUEBA DE ESTRÉS CON 160 ATLETAS COMPLETADA CON ÉXITO ABSOLUTO.');
  console.log('   - 0 Errores detectados.');
  console.log('   - Rendimiento sub-20ms en todos los cálculos y rankings.');
  console.log('   - Integridad matemática 100% garantizada.');
  process.exit(0);
} else {
  console.error(`💥 ${failedChecks} fallas detectadas en la simulación de gran escala.`);
  process.exit(1);
}
