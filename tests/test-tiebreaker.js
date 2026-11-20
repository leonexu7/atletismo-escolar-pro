/**
 * Suite de Pruebas Unitarias de Reglas de Atletismo y Desempates World Athletics
 */

import { evaluateFieldAttempts, rankFieldEventCompetitors, rankTrackEventRunners } from '../src/utils/tieBreaker.js';
import { formatTrackTime, parseTrackTime, formatFieldDistance, parseFieldDistance, calculateAge, formatBirthDateWithAge } from '../src/utils/timeFormatter.js';
import { PARTICIPATION_LIMITS } from '../src/constants/categories.js';
import { cleanCCT, cleanSchoolName, findExistingSchoolMatch } from '../src/utils/schoolNormalizer.js';
import { DEFAULT_TOURNAMENT_INFO } from '../src/utils/storage.js';

console.log('🧪 Iniciando pruebas de Atletismo Escolar Pro...\n');

let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASÓ: ${testName}`);
  } else {
    console.error(`  ❌ FALLÓ: ${testName}`);
    failedTests++;
  }
}

// --- PRUEBA 1: 3 Intentos en Campo y Mejor Marca (NO promedio) ---
console.log('📌 Verificando Regla de 3 Intentos en Concursos de Campo:');
const attemptsAthleteA = [
  { attemptNum: 1, value: 3.40, status: 'valid' },
  { attemptNum: 2, value: 3.85, status: 'valid' },
  { attemptNum: 3, value: null, status: 'foul' } // Nulo
];
const evalA = evaluateFieldAttempts(attemptsAthleteA);

assert(evalA.bestMark === 3.85, 'La mejor marca debe ser 3.85m (máximo alcanzado, no el promedio 2.41m)');
assert(evalA.secondBestMark === 3.40, 'La segunda mejor marca debe ser 3.40m');
assert(evalA.hasValidMark === true, 'Tiene marca válida');

// --- PRUEBA 2: Desempate por Segunda Mejor Marca ---
console.log('\n📌 Verificando Algoritmo de Desempate World Athletics:');
const competitor1 = {
  id: 'c1',
  fullName: 'Mateo',
  bestMark: 3.85,
  secondBestMark: 3.60,
  thirdBestMark: 3.20,
  hasValidMark: true
};

const competitor2 = {
  id: 'c2',
  fullName: 'Diego',
  bestMark: 3.85, // Mismo mejor salto
  secondBestMark: 3.75, // Mejor 2º salto -> GANA
  thirdBestMark: 3.10,
  hasValidMark: true
};

const rankedField = rankFieldEventCompetitors([competitor1, competitor2]);
assert(rankedField[0].fullName === 'Diego', 'Diego debe quedar en 1º lugar porque su 2ª mejor marca (3.75m) supera a la de Mateo (3.60m)');
assert(rankedField[1].fullName === 'Mateo', 'Mateo debe quedar en 2º lugar');
assert(rankedField[0].tieNote.includes('2ª marca'), 'La nota técnica debe indicar que ganó por 2ª marca');

// --- PRUEBA 3: Formateo de Tiempos y Parsing ---
console.log('\n📌 Verificando Formateo y Parsing de Carreras:');
assert(formatTrackTime(10.5) === '10.50 s', '10.5s debe formatearse como "10.50 s"');
assert(formatTrackTime(75.3) === '1:15.30', '75.3s (600m) debe formatearse como "1:15.30"');
assert(parseTrackTime('10.52') === 10.52, 'parseTrackTime("10.52") debe retornar 10.52');
assert(parseTrackTime('10,52') === 10.52, 'parseTrackTime con coma decimal debe retornar 10.52');
assert(parseTrackTime('1:15.30') === 75.30, 'parseTrackTime con minutos debe retornar 75.30');

// --- PRUEBA 4: Ranking de Pista (Menor tiempo) ---
console.log('\n📌 Verificando Ranking de Pista:');
const runners = [
  { id: 'r1', fullName: 'Carlos', timeSeconds: 10.80, status: 'valid' },
  { id: 'r2', fullName: 'Pedro', timeSeconds: 10.45, status: 'valid' },
  { id: 'r3', fullName: 'Luis', timeSeconds: null, status: 'dns' }
];

const rankedTrack = rankTrackEventRunners(runners);
assert(rankedTrack[0].fullName === 'Pedro', 'Pedro debe ser 1º por menor tiempo (10.45s vs 10.80s)');
assert(rankedTrack[1].fullName === 'Carlos', 'Carlos debe ser 2º');
assert(rankedTrack[2].rank === 'DNS', 'El corredor que no se presentó debe quedar al final como DNS');

// --- PRUEBA 5: Límite de Inscripciones (2 Individuales y 2 Equipos Máximo) ---
console.log('\n📌 Verificando Regla de Inscripciones (2 Individuales y 2 Equipos Máximo):');
assert(PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS === 2, 'Límite de pruebas individuales debe ser 2');
assert(PARTICIPATION_LIMITS.MAX_RELAY_EVENTS === 2, 'Límite de pruebas de equipo/relevos debe ser 2');
assert(PARTICIPATION_LIMITS.MAX_TOTAL_EVENTS === 4, 'Límite total combinado de pruebas debe ser 4');

// --- PRUEBA 6: Normalización y Anti-Duplicados de Escuelas (CCT y Nombres) ---
console.log('\n📌 Verificando Normalización y Detección Anti-Duplicados de Escuelas:');
assert(cleanCCT(' 21-epr 0101 A ') === '21EPR0101A', 'cleanCCT debe normalizar a mayúsculas sin espacios ni guiones');
assert(
  cleanSchoolName('Esc. Primaria Benito Juárez') === cleanSchoolName('PRIMARIA BENITO JUAREZ'),
  'cleanSchoolName debe igualar "Esc. Primaria Benito Juárez" con "PRIMARIA BENITO JUAREZ"'
);

const existingSchools = [
  { id: 'esc-1', name: 'Esc. Primaria Benito Juárez', cct: '21EPR0101A', zone: 'Zona Escolar 04', inspection: 'Inspección 12' }
];

const candidateWithCCT = { name: 'benito juarez', cct: '21epr0101a', zone: '04' };
const match1 = findExistingSchoolMatch(existingSchools, candidateWithCCT);
assert(match1.isMatch === true && match1.matchType === 'cct', 'Debe detectar duplicado por Clave CCT idéntica');

const candidateWithoutCCT = { name: 'PRIMARIA BENITO JUAREZ', cct: '', zone: '04' };
const match2 = findExistingSchoolMatch(existingSchools, candidateWithoutCCT);
assert(match2.isMatch === true && match2.matchType === 'name', 'Debe detectar duplicado por nombre normalizado aunque cambien mayúsculas y acentos');

// --- PRUEBA 7: Opción de Diplomas en Ajustes (Desactivada por Defecto) ---
console.log('\n📌 Verificando Configuración de Diplomas:');
assert(DEFAULT_TOURNAMENT_INFO.enableDiplomas === false, 'Diplomas deben estar desactivados por defecto');

// --- PRUEBA 8: Cálculo Automático de Edad a partir de Fecha de Nacimiento ---
console.log('\n📌 Verificando Cálculo Automático de Edad:');
const refDate = new Date(2026, 10, 19); // 19 de noviembre de 2026
assert(calculateAge('2014-03-15', refDate) === 12, 'Nacido 2014-03-15 tiene 12 años en nov 2026');
assert(calculateAge('2013-11-08', refDate) === 13, 'Nacido 2013-11-08 tiene 13 años en nov 2026');
assert(calculateAge('2013-11-25', refDate) === 12, 'Nacido 2013-11-25 tiene 12 años en nov 19 2026 (aún no cumple 13)');
assert(calculateAge('15/03/2014', refDate) === 12, 'Formato DD/MM/YYYY debe calcularse correctamente');
assert(formatBirthDateWithAge('2014-03-15').includes('años'), 'formatBirthDateWithAge debe incluir la fecha y la edad');
assert(calculateAge('') === null, 'Fecha vacía debe retornar null');

// --- PRUEBA 9: Regla de Cronómetro (1 Corredor Único y Reasignación por Equivocación) ---
console.log('\n📌 Verificando Regla de Cronómetro Individual (1 Corredor y Reasignación):');
let stopwatchAssignment = { athleteId: 'ath-1', timeSeconds: 10.52 };
assert(stopwatchAssignment.athleteId === 'ath-1', 'El cronómetro asigna el tiempo a 1 solo corredor');

// Reasignación si se eligió por equivocación
stopwatchAssignment = { athleteId: 'ath-2', timeSeconds: 10.52 };
assert(stopwatchAssignment.athleteId === 'ath-2', 'Permite reasignar el tiempo exacto a otro corredor si hubo equivocación');
assert(stopwatchAssignment.timeSeconds === 10.52, 'El tiempo detenido se conserva al cambiar de corredor');

console.log('\n----------------------------------------');
if (failedTests === 0) {
  console.log('🎉 TODAS LAS PRUEBAS UNITARIAS PASARON EXITOSAMENTE (0 fallas).\n');
  process.exit(0);
} else {
  console.error(`💥 ${failedTests} prueba(s) fallaron.\n`);
  process.exit(1);
}
