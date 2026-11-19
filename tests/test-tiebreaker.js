/**
 * Suite de Pruebas Unitarias de Reglas de Atletismo y Desempates World Athletics
 */

import { evaluateFieldAttempts, rankFieldEventCompetitors, rankTrackEventRunners } from '../src/utils/tieBreaker.js';
import { formatTrackTime, parseTrackTime, formatFieldDistance, parseFieldDistance } from '../src/utils/timeFormatter.js';

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

console.log('\n----------------------------------------');
if (failedTests === 0) {
  console.log('🎉 TODAS LAS PRUEBAS UNITARIAS PASARON EXITOSAMENTE (0 fallas).\n');
  process.exit(0);
} else {
  console.error(`💥 ${failedTests} prueba(s) fallaron.\n`);
  process.exit(1);
}
