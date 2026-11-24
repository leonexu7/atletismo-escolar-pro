/**
 * Generador Oficial de Documentos y Diplomas en PDF para Atletismo Escolar
 * - Planillas de Jueces de Pista (Series y Carriles)
 * - Planillas de Jueces de Campo (3 Intentos y Mejor Marca)
 * - Diplomas de Premiación personalizados en 1 Clic
 * - Memoria Técnica Oficial del Evento
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTrackTime, formatFieldDistance } from './timeFormatter';
import { OFFICIAL_EVENTS } from '../constants/events';

/**
 * Genera la Planilla Oficial de Jueces de Pista en orientación Horizontal
 */
export function generateOfficialTrackSheetPDF(
  event,
  heats = [],
  tournamentInfo = {},
  trackEntries = [],
  rankedAthletes = []
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado institucional deportivo
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(String(tournamentInfo.name || 'JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO').toUpperCase(), 14, 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`PLANILLA TÉCNICA OFICIAL DE PISTA  |  PRUEBA: ${String(event.name || '').toUpperCase()}`, 14, 18);

  // Metadatos del evento
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Sede: ${tournamentInfo.venue || 'Estadio Escolar'}`, 14, 30);
  doc.text(`Fecha: ${tournamentInfo.date || ''}`, 120, 30);
  doc.text(`Organizador: ${tournamentInfo.organizer || 'Comité Organizador'}`, 200, 30);

  let currentY = 34;

  if (heats.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay series configuradas para esta prueba.', 14, 45);
  } else {
    heats.forEach((heat, heatIdx) => {
      // Subtítulo de Serie
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28); // red-700
      doc.text(`SERIE ${heat.heatNumber || heatIdx + 1}`, 14, currentY + 4);

      const tableBody = (heat.lanes || []).map(lane => {
        const entry = (trackEntries || []).find(e => e.athleteId === lane.id);
        const ranked = (rankedAthletes || []).find(r => r.id === lane.id);

        let timeDisplay = '';
        let placeDisplay = '';
        let notesDisplay = '';

        if (entry) {
          if (entry.status === 'valid' && entry.timeSeconds !== null && entry.timeSeconds !== undefined) {
            timeDisplay = formatTrackTime(entry.timeSeconds);
          } else if (entry.status && entry.status !== 'pending' && entry.status !== 'valid') {
            timeDisplay = entry.status.toUpperCase();
          }

          if (entry.statusReason) {
            notesDisplay = entry.statusReason;
          } else if (entry.status && entry.status !== 'valid' && entry.status !== 'pending') {
            notesDisplay = entry.status.toUpperCase();
          }
        }

        if (ranked && ranked.rank) {
          placeDisplay = `${ranked.rank}º`;
        }

        return [
          lane.assignedLane || '-',
          lane.bibNumber || lane.dorsal || 'S/N',
          lane.fullName || 'Competidor',
          lane.schoolName || 'Escuela',
          timeDisplay,   // Tiempo oficial si ya corrió, o espacio en blanco si está pendiente
          placeDisplay,  // Lugar oficial calculado o en blanco
          notesDisplay   // Observaciones / DNS / DNF / Descalificado
        ];
      });

      autoTable(doc, {
        startY: currentY + 6,
        head: [['Carril', 'Dorsal', 'Nombre del Alumno / Corredor', 'Escuela de Procedencia', 'Tiempo Oficial', 'Lugar', 'Notas / Faltas']],
        body: tableBody,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center' },
          1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 68 },
          3: { cellWidth: 58 },
          4: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 46 }
        },
        margin: { left: 14, right: 14 }
      });

      currentY = doc.lastAutoTable.finalY + 8;
      if (currentY > 175 && heatIdx < heats.length - 1) {
        doc.addPage();
        currentY = 20;
      }
    });
  }

  // Cuadro de firmas reglamentarias con protección contra desbordamiento en hojas múltiples
  const lastTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY;
  let footY = Math.max(lastTableY + 12, 182);
  if (footY > 192) {
    doc.addPage();
    footY = 175;
  }
  const signWidth = 65;
  const leftSignCenter = 65;
  const rightSignCenter = pageWidth - 65;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(leftSignCenter - signWidth / 2, footY, leftSignCenter + signWidth / 2, footY);
  doc.line(rightSignCenter - signWidth / 2, footY, rightSignCenter + signWidth / 2, footY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Juez de Salida / Cronometrador', leftSignCenter, footY + 4, { align: 'center' });
  doc.text('Juez Árbitro de Pista', rightSignCenter, footY + 4, { align: 'center' });

  doc.save(`Planilla_Pista_${event.shortName || 'carrera'}.pdf`);
}

/**
 * Genera la Planilla Oficial de Jueces de Campo (Saltos y Lanzamientos con 3 Intentos)
 */
export function generateOfficialFieldSheetPDF(
  event,
  flight = [],
  tournamentInfo = {},
  fieldEntries = [],
  rankedAthletes = []
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado institucional
  doc.setFillColor(4, 120, 87); // emerald-700
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(String(tournamentInfo.name || 'JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO').toUpperCase(), 14, 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229);
  doc.text(`PLANILLA OFICIAL DE CONCURSO DE CAMPO  |  PRUEBA: ${String(event.name || '').toUpperCase()}`, 14, 18);

  // Metadatos
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Sede: ${tournamentInfo.venue || 'Campo Escolar'}`, 14, 30);
  doc.text(`Reglamento: 3 Intentos oficiales. Gana la MEJOR marca válida.`, 110, 30);
  doc.text(`Fecha: ${tournamentInfo.date || ''}`, 220, 30);

  const tableBody = (flight || []).map((athlete, idx) => {
    const entry = (fieldEntries || []).find(e => e.athleteId === athlete.id);
    const ranked = (rankedAthletes || []).find(r => r.id === athlete.id);

    const attempts = entry?.attempts || ranked?.attempts || [];
    const getAttemptStr = (att) => {
      if (!att) return '';
      if (att.status === 'foul') return 'X';
      if (att.status === 'pass') return '-';
      if (att.value !== null && att.value !== undefined && att.value !== '') {
        return formatFieldDistance(att.value);
      }
      return '';
    };

    const att1 = getAttemptStr(attempts[0]);
    const att2 = getAttemptStr(attempts[1]);
    const att3 = getAttemptStr(attempts[2]);

    const bestMarkStr = ranked?.bestMark !== null && ranked?.bestMark !== undefined
      ? formatFieldDistance(ranked.bestMark)
      : (entry?.bestMark ? formatFieldDistance(entry.bestMark) : '');

    const secondBestStr = ranked?.secondBestMark !== null && ranked?.secondBestMark !== undefined
      ? formatFieldDistance(ranked.secondBestMark)
      : '';

    const placeStr = ranked?.rank ? `${ranked.rank}º` : '';

    return [
      idx + 1,
      athlete.bibNumber || athlete.dorsal || 'S/N',
      athlete.fullName || 'Competidor',
      athlete.schoolName || 'Escuela',
      att1,
      att2,
      att3,
      bestMarkStr,
      secondBestStr,
      placeStr
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [[
      'Orden',
      'Dorsal',
      'Nombre del Alumno / Lanzador / Saltador',
      'Escuela',
      'Intento 1',
      'Intento 2',
      'Intento 3',
      'MEJOR MARCA',
      '2ª Marca',
      'Lugar'
    ]],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 58 },
      3: { cellWidth: 50 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 23, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 19, halign: 'center' },
      9: { cellWidth: 16, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  // Firmas con protección contra desbordamiento en hojas múltiples
  const lastFieldTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 34;
  let footY = Math.max(lastFieldTableY + 12, 182);
  if (footY > 192) {
    doc.addPage();
    footY = 175;
  }
  const signWidth = 65;
  const leftSignCenter = 65;
  const rightSignCenter = pageWidth - 65;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(leftSignCenter - signWidth / 2, footY, leftSignCenter + signWidth / 2, footY);
  doc.line(rightSignCenter - signWidth / 2, footY, rightSignCenter + signWidth / 2, footY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Juez Jefe de Prueba de Campo', leftSignCenter, footY + 4, { align: 'center' });
  doc.text('Juez Árbitro General', rightSignCenter, footY + 4, { align: 'center' });

  doc.save(`Planilla_Campo_${event.shortName || 'concurso'}.pdf`);
}

/**
 * Genera la Hoja Oficial de Presentación y Premiación de Lugares (Podio) en PDF
 * Diseño minimalista moderno de alta legibilidad y estricto ahorro de tinta (Ink-Friendly):
 * Fondo blanco puro, sin bloques negros ni fondos pesados, líneas finas institucionales,
 * podio de 3 ganadores y cuadro complementario de finalistas.
 */
export function generateAwardPresentationSheetPDF(rankedList = [], event = {}, tournamentInfo = {}, genderLabel = 'Varonil') {
  if (!rankedList || rankedList.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Marco perimetral fino institucional (sin fondos oscuros, ahorro de tinta)
  doc.setDrawColor(100, 116, 139); // slate-500
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Encabezado institucional limpio
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SUPERVISIÓN GENERAL DE EDUCACIÓN FÍSICA  •  COMITÉ ORGANIZADOR', pageWidth / 2, 17.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(String(tournamentInfo.name || 'JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO').toUpperCase(), pageWidth / 2, 24, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('CÉDULA OFICIAL DE PREMIACIÓN Y PODIO DE HONOR', pageWidth / 2, 29.5, { align: 'center' });

  // Cinta de metadatos de la prueba (líneas finas, fondo blanco)
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.line(16, 33, pageWidth - 16, 33);
  doc.line(16, 42, pageWidth - 16, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const eventName = (event.name || 'Prueba Oficial').toUpperCase();
  doc.text(`PRUEBA: ${eventName}`, 20, 38.5);
  doc.text(`RAMA: ${genderLabel.toUpperCase()}`, 105, 38.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`FECHA: ${tournamentInfo.date || '2026'}`, 175, 38.5);
  doc.text(`SEDE: ${tournamentInfo.venue || 'Estadio Escolar'}`, 225, 38.5);

  // Cuadro de Honor: 3 Cajas de Podio (Plata - Oro - Bronce)
  const goldWinner = rankedList[0];
  const silverWinner = rankedList[1];
  const bronzeWinner = rankedList[2];

  const colWidth = 78;
  const colHeight = 50;
  const startY = 46;
  const startX = 16;

  const getMarkText = (w) => {
    if (!w) return '--';
    if (w.markFormatted) return w.markFormatted;
    if (w.bestMark !== null && w.bestMark !== undefined) return formatFieldDistance(w.bestMark);
    if (w.timeSeconds !== null && w.timeSeconds !== undefined) return formatTrackTime(w.timeSeconds);
    return w.status ? w.status.toUpperCase() : '--';
  };

  const drawWinnerBox = (x, y, w, h, title, accentColor, athlete, isChampion) => {
    // Fondo de tarjeta blanco puro (ahorro de tinta)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');

    // Borde fino limpio
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'S');

    // Acento superior discreto
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(isChampion ? 0.9 : 0.6);
    doc.line(x + 4, y, x + w - 4, y);

    // Título / Insignia de lugar (texto sobrio, sin plastas de color)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(title, x + (w / 2), y + 6, { align: 'center' });

    if (athlete) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isChampion ? 10.5 : 9.5);
      doc.setTextColor(15, 23, 42);
      const name = String(athlete.fullName || 'Atleta').toUpperCase();
      doc.text(name, x + (w / 2), y + 14, { align: 'center', maxWidth: w - 8 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const school = athlete.schoolName || 'Escuela Primaria';
      doc.text(school, x + (w / 2), y + 20, { align: 'center', maxWidth: w - 8 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Dorsal: #${athlete.bibNumber || 'S/N'}`, x + (w / 2), y + 25, { align: 'center' });

      // Línea divisoria muy fina
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(x + 10, y + 28, x + w - 10, y + 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('MARCA OFICIAL / TIEMPO:', x + (w / 2), y + 33, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isChampion ? 13 : 12);
      doc.setTextColor(15, 23, 42);
      doc.text(getMarkText(athlete), x + (w / 2), y + 41, { align: 'center' });

      if (athlete.tieNote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(100, 116, 139);
        doc.text(athlete.tieNote, x + (w / 2), y + 46, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Pendiente por definir', x + (w / 2), y + 26, { align: 'center' });
    }
  };

  // 2º LUGAR (PLATA) - Columna Izquierda
  drawWinnerBox(startX, startY, colWidth, colHeight, '2º LUGAR  •  SUB-CAMPEÓN (PLATA)', [100, 116, 139], silverWinner, false);

  // 1º LUGAR (ORO) - Columna Centro
  drawWinnerBox(startX + colWidth + 5, startY, colWidth + 8, colHeight, '1º LUGAR  •  CAMPEÓN (ORO)', [217, 119, 6], goldWinner, true);

  // 3º LUGAR (BRONCE) - Columna Derecha
  drawWinnerBox(startX + colWidth + 5 + colWidth + 13, startY, colWidth, colHeight, '3º LUGAR  •  TERCER LUGAR (BRONCE)', [180, 83, 9], bronzeWinner, false);

  // Tabla compacta de Finalistas (4º al 8º Lugar) - Diseño editorial ink-friendly
  const otherFinalists = rankedList.slice(3, 8);
  if (otherFinalists.length > 0) {
    const tableBody = otherFinalists.map(ath => [
      `${ath.rank || '-'}º`,
      ath.bibNumber ? `#${ath.bibNumber}` : 'S/N',
      ath.fullName || 'Competidor',
      ath.schoolName || 'Escuela Primaria',
      getMarkText(ath)
    ]);

    autoTable(doc, {
      startY: startY + colHeight + 4,
      head: [['Lugar', 'Dorsal', 'Finalista (Nombre del Alumno)', 'Escuela Primaria', 'Marca Oficial']],
      body: tableBody,
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59], fillColor: [255, 255, 255], lineWidth: 0.1, lineColor: [226, 232, 240] },
      headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 7, halign: 'center', lineWidth: 0.15, lineColor: [203, 213, 225] },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 16, halign: 'center' },
        2: { cellWidth: 90, fontStyle: 'bold' },
        3: { cellWidth: 78 },
        4: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });
  }

  // Firmas reglamentarias y cuadro de sello oficial
  const footY = 186;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.line(25, footY, 95, footY);
  doc.line(pageWidth - 95, footY, pageWidth - 25, footY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Coordinador General de Educación Física', 60, footY + 4, { align: 'center' });
  doc.text('Juez Árbitro Oficial de Atletismo', pageWidth - 60, footY + 4, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Supervisión Escolar Oficial', 60, footY + 7.5, { align: 'center' });
  doc.text('Colegio de Jueces y Cronometraje', pageWidth - 60, footY + 7.5, { align: 'center' });

  // Cuadro discreto de Sello Oficial
  const stampW = 26;
  const stampH = 18;
  const stampX = (pageWidth / 2) - (stampW / 2);
  const stampY = footY - 12;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(stampX, stampY, stampW, stampH);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('SELLO OFICIAL', pageWidth / 2, stampY + 10, { align: 'center' });

  doc.save(`Hoja_Premiacion_${event.shortName || 'Oficial'}.pdf`);
}

/**
 * Genera Diplomas Oficiales de Premiación (1º, 2º y 3º lugar) listos para entregar
 */
export function generateAwardsDiplomasPDF(winners = [], event = {}, tournamentInfo = {}) {
  if (!winners || winners.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const medalConfig = {
    1: { name: 'PRIMER LUGAR (MEDALLA DE ORO)', color: [217, 119, 6], ribbon: 'CAMPEÓN' },
    2: { name: 'SEGUNDO LUGAR (MEDALLA DE PLATA)', color: [100, 116, 139], ribbon: 'SUB-CAMPEÓN' },
    3: { name: 'TERCER LUGAR (MEDALLA DE BRONCE)', color: [180, 83, 9], ribbon: 'TERCER LUGAR' }
  };

  winners.slice(0, 3).forEach((winner, idx) => {
    if (idx > 0) doc.addPage();

    const place = (typeof winner.rank === 'number' && winner.rank >= 1 && winner.rank <= 3) ? winner.rank : (idx + 1);
    const config = medalConfig[place] || medalConfig[idx + 1] || medalConfig[1];

    // Marco exterior ceremonial
    doc.setDrawColor(config.color[0], config.color[1], config.color[2]);
    doc.setLineWidth(3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    doc.setLineWidth(0.8);
    doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(String(tournamentInfo.name || 'JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO').toUpperCase(), pageWidth / 2, 30, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text('EL COMITÉ ORGANIZADOR Y LA SUPERVISIÓN DE EDUCACIÓN FÍSICA OTORGAN EL PRESENTE', pageWidth / 2, 40, { align: 'center' });

    // Título DIPLOMA DE RECONOCIMIENTO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(config.color[0], config.color[1], config.color[2]);
    doc.text('DIPLOMA DE PREMIACIÓN', pageWidth / 2, 54, { align: 'center' });

    // Distinción de lugar
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`POR HABER OBTENIDO EL ${config.name}`, pageWidth / 2, 66, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('A:', pageWidth / 2, 78, { align: 'center' });

    // Nombre del alumno premiado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(185, 28, 28); // red-700
    doc.text(String(winner.fullName || 'Alumno Competidor').toUpperCase(), pageWidth / 2, 92, { align: 'center' });

    // Escuela
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(51, 65, 85);
    doc.text(`Representando a: ${winner.schoolName || 'Escuela Primaria'}`, pageWidth / 2, 104, { align: 'center' });

    // Detalles de la prueba y marca oficial
    const markLabel = winner.markFormatted || (winner.bestMark ? formatFieldDistance(winner.bestMark) : formatTrackTime(winner.timeSeconds));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`En la prueba: ${event.name || 'Prueba Oficial'}`, pageWidth / 2, 118, { align: 'center' });
    doc.text(`Con una marca / tiempo oficial de: ${markLabel}`, pageWidth / 2, 126, { align: 'center' });

    if (winner.tieNote) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`* ${winner.tieNote}`, pageWidth / 2, 134, { align: 'center' });
    }

    // Fecha y firmas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`${tournamentInfo.venue || 'Ciudad'}, a ${tournamentInfo.date || '2026'}`, pageWidth / 2, 146, { align: 'center' });

    const signY = 175;
    doc.setLineWidth(0.4);
    doc.setDrawColor(100, 116, 139);
    doc.line(40, signY, 110, signY);
    doc.line(pageWidth - 110, signY, pageWidth - 40, signY);

    doc.setFontSize(9);
    doc.text('Coordinador General de Educación Física', 75, signY + 5, { align: 'center' });
    doc.text('Juez Árbitro Oficial del Torneo', pageWidth - 75, signY + 5, { align: 'center' });
  });

  doc.save(`Diplomas_${event.shortName || 'Premiacion'}.pdf`);
}

/**
 * Genera la Planilla Oficial del Padrón General de Atletas en PDF
 */
export function generateMasterAthletesRosterPDF(athletes = [], schools = [], tournamentInfo = {}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(String(tournamentInfo.name || 'JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO').toUpperCase(), 14, 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`PADRÓN GENERAL OFICIAL DE COMPETIDORES INSCRITOS  |  TOTAL: ${athletes.length} ATLETAS`, 14, 18);

  // Metadatos
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.text(`Sede: ${tournamentInfo.venue || 'Estadio Escolar'}`, 14, 30);
  doc.text(`Fecha: ${tournamentInfo.date || new Date().toLocaleDateString('es-MX')}`, 120, 30);
  doc.text(`Organizador: ${tournamentInfo.organizer || 'Comité Organizador'}`, 200, 30);

  const tableBody = athletes.map((ath, idx) => {
    const school = schools.find(s => s.id === ath.schoolId);
    const eventNames = (ath.eventIds || []).map(eId => {
      const ev = OFFICIAL_EVENTS.find(e => e.id === eId);
      return ev ? ev.name : eId;
    }).join(' • ');

    return [
      idx + 1,
      ath.bibNumber ? `#${ath.bibNumber}` : 'S/N',
      ath.fullName,
      ath.gender === 'F' ? 'Fem' : 'Var',
      ath.schoolGrade ? `${ath.schoolGrade}°` : '-',
      school?.shortName || school?.name || ath.schoolName || 'Sin Escuela',
      eventNames || 'Sin pruebas',
      '' // Cotejo / Firma
    ];
  });

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Dorsal', 'Nombre Completo del Atleta', 'Rama', 'Grado', 'Escuela Primaria', 'Pruebas Inscritas', 'Cotejo']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], overflow: 'linebreak' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 55, fontStyle: 'bold' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 46 },
      6: { cellWidth: 68 },
      7: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Padron_Oficial_Atletas_${Date.now()}.pdf`);
}
