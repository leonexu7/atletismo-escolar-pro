/**
 * Gestor de Importación y Exportación de Excel / CSV para Maestros y Entrenadores
 * Compatible con la biblioteca xlsx (SheetJS).
 */

import * as XLSX from 'xlsx';
import { OFFICIAL_EVENTS } from '../constants/events';

export function downloadExcelRegistrationTemplate() {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Instrucciones y Catálogo de Pruebas
  const instructionsData = [
    ['JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO - PLANTILLA OFICIAL DE INSCRIPCIÓN'],
    [''],
    ['INSTRUCCIONES PARA EL MAESTRO / ENTRENADOR:'],
    ['1. Capture los datos de sus alumnos en la hoja "Atletas".'],
    ['2. En la columna "Sexo", use "M" para Varonil o "F" para Femenil.'],
    ['3. En las columnas de pruebas, marque con una "X" o "SI" las pruebas en las que participará el alumno.'],
    ['4. Máximo 2 pruebas individuales por alumno según el reglamento escolar CONDEBA.'],
    [''],
    ['CATÁLOGO DE PRUEBAS DISPONIBLES:'],
    ['Código', 'Nombre Oficial de la Prueba', 'Tipo', 'Reglas'],
    ['75m', '75 Metros Planos', 'Pista', 'Velocidad'],
    ['150m', '150 Metros Planos', 'Pista', 'Velocidad Curva'],
    ['300m', '300 Metros Planos', 'Pista', 'Velocidad Prolongada'],
    ['600m', '600 Metros Planos', 'Pista', 'Medio Fondo'],
    ['longitud', 'Salto de Longitud', 'Campo', '3 Intentos (Mejor marca)'],
    ['bala', 'Impulso de Bala (6 lbs)', 'Campo', '3 Intentos (Mejor marca)'],
    ['disco', 'Lanzamiento de Disco (600g)', 'Campo', '3 Intentos (Mejor marca)'],
    ['pelota', 'Lanzamiento de Pelota (#5)', 'Campo', '3 Intentos (Mejor marca)']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

  // Hoja 2: Atletas con columnas estructuradas
  const athletesHeader = [
    ['DATOS DE LA ESCUELA:', 'Nombre de la Escuela:', '', 'Zona Escolar:', '', 'Profesor(a):', ''],
    [''],
    [
      'Dorsal (Opcional)',
      'Nombre Completo del Alumno',
      'Sexo (M/F)',
      'Grado (3-6)',
      'Fecha Nacimiento (AAAA-MM-DD)',
      '75m',
      '150m',
      '300m',
      '600m',
      'Salto Longitud',
      'Impulso Bala',
      'Lanz. Disco',
      'Lanz. Pelota'
    ],
    // Ejemplos de llenado
    ['101', 'Juan Carlos Pérez Gómez', 'M', '5', '2014-05-12', 'X', '', '', '', 'X', '', '', ''],
    ['102', 'María Fernanda Ruiz López', 'F', '6', '2013-09-24', '', '', '', 'X', '', '', '', 'X']
  ];

  const wsAthletes = XLSX.utils.aoa_to_sheet(athletesHeader);

  // Anchos de columna sugeridos
  wsAthletes['!cols'] = [
    { wch: 16 }, // Dorsal
    { wch: 32 }, // Nombre
    { wch: 12 }, // Sexo
    { wch: 12 }, // Grado
    { wch: 22 }, // Fecha Nac
    { wch: 8 },  // 75m
    { wch: 8 },  // 150m
    { wch: 8 },  // 300m
    { wch: 8 },  // 600m
    { wch: 14 }, // Longitud
    { wch: 14 }, // Bala
    { wch: 14 }, // Disco
    { wch: 14 }  // Pelota
  ];

  XLSX.utils.book_append_sheet(wb, wsAthletes, 'Atletas');
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructivo');

  XLSX.writeFile(wb, 'Plantilla_Inscripcion_Atletismo_Primaria.xlsx');
}

export function parseExcelAthletesFile(file, categoryGroupingMode = 'unified') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames.includes('Atletas')
          ? 'Atletas'
          : workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawJson || rawJson.length < 3) {
          throw new Error('La hoja seleccionada está vacía o no tiene el formato oficial.');
        }

        // Buscar fila de encabezados
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawJson.length, 10); i++) {
          const rowStr = JSON.stringify(rawJson[i] || []).toLowerCase();
          if (rowStr.includes('nombre') && (rowStr.includes('sexo') || rowStr.includes('grado'))) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('No se encontró la fila de encabezados con "Nombre Completo" y "Sexo".');
        }

        const headers = rawJson[headerRowIndex].map(h => String(h || '').trim().toLowerCase());
        const dataRows = rawJson.slice(headerRowIndex + 1);

        const parsedAthletes = [];

        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0) return;

          // Buscar columnas principales
          const nameColIdx = headers.findIndex(h => h.includes('nombre'));
          const genderColIdx = headers.findIndex(h => h.includes('sexo') || h.includes('género'));
          const gradeColIdx = headers.findIndex(h => h.includes('grado'));
          const bibColIdx = headers.findIndex(h => h.includes('dorsal') || h.includes('número'));
          const birthColIdx = headers.findIndex(h => h.includes('nacimiento') || h.includes('fecha'));

          const fullName = nameColIdx !== -1 ? String(row[nameColIdx] || '').trim() : '';
          if (!fullName) return; // Fila vacía

          let gender = genderColIdx !== -1 ? String(row[genderColIdx] || '').trim().toUpperCase() : 'M';
          if (gender.startsWith('F') || gender === 'FEMENIL' || gender === 'MUJER') gender = 'F';
          else gender = 'M';

          const grade = gradeColIdx !== -1 ? String(row[gradeColIdx] || '5').trim() : '5';
          const bib = bibColIdx !== -1 && row[bibColIdx] ? parseInt(row[bibColIdx], 10) : null;
          const birthDate = birthColIdx !== -1 ? String(row[birthColIdx] || '').trim() : '';

          // Detectar pruebas seleccionadas con "X", "SI", "1" o similar
          const eventIds = [];

          headers.forEach((h, colIdx) => {
            const cellVal = String(row[colIdx] || '').trim().toLowerCase();
            const isMarked = cellVal === 'x' || cellVal === 'si' || cellVal === 'sí' || cellVal === '1' || cellVal === 'true';

            if (isMarked) {
              if (h.includes('75m') || h.includes('75 m') || h.includes('75')) eventIds.push('pista_75m');
              else if (h.includes('150m') || h.includes('150 m') || h.includes('150')) eventIds.push('pista_150m');
              else if (h.includes('300m') || h.includes('300 m') || h.includes('300')) eventIds.push('pista_300m');
              else if (h.includes('600m') || h.includes('600 m') || h.includes('600')) eventIds.push('pista_600m');
              else if (h.includes('longitud') || h.includes('salto')) eventIds.push('campo_longitud');
              else if (h.includes('bala') || h.includes('impulso')) eventIds.push('campo_bala');
              else if (h.includes('disco')) eventIds.push('campo_disco');
              else if (h.includes('pelota')) eventIds.push('campo_pelota');
            }
          });

          parsedAthletes.push({
            id: `excel-${Date.now()}-${idx}`,
            bibNumber: bib,
            fullName,
            gender,
            schoolGrade: grade,
            birthDate,
            categoryId: categoryGroupingMode === 'unified'
              ? 'primaria_abierta'
              : ((grade === '3' || grade === '4') ? 'infantil_menor' : 'infantil_mayor'),
            eventIds: Array.from(new Set(eventIds))
          });
        });

        resolve(parsedAthletes);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Fallo al abrir el archivo Excel.'));
    reader.readAsArrayBuffer(file);
  });
}
