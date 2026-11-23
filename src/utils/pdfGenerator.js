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
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center' },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 80 },
          3: { cellWidth: 70 },
          4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          6: { cellWidth: 28 }
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
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(30, footY, 90, footY);
  doc.line(180, footY, 240, footY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Juez de Salida / Cronometrador', 60, footY + 4, { align: 'center' });
  doc.text('Juez Árbitro de Pista', 210, footY + 4, { align: 'center' });

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
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 70 },
      3: { cellWidth: 55 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 20, halign: 'center' },
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
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(30, footY, 90, footY);
  doc.line(180, footY, 240, footY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Juez Jefe de Prueba de Campo', 60, footY + 4, { align: 'center' });
  doc.text('Juez Árbitro General', 210, footY + 4, { align: 'center' });

  doc.save(`Planilla_Campo_${event.shortName || 'concurso'}.pdf`);
}

/**
 * Genera la Hoja Oficial de Presentación y Premiación de Lugares (Podio) en PDF
 * Diseño minimalista moderno con cuadro de honor (1º Oro, 2º Plata, 3º Bronce),
 * cuadro complementario de finalistas y firmas oficiales reglamentarias.
 */
export function generateAwardPresentationSheetPDF(rankedList = [], event = {}, tournamentInfo = {}, genderLabel = 'Varonil') {
  if (!rankedList || rankedList.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Marco exterior ceremonial en oro champán
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Encabezado institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(10, 10, pageWidth - 20, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(String(tournamentInfo.name || 'JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO 2026').toUpperCase(), pageWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text('HOJA TÉCNICA OFICIAL DE PREMIACIÓN Y PODIO DE HONOR', pageWidth / 2, 26, { align: 'center' });

  // Cinta de metadatos de la prueba
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(10, 32, pageWidth - 20, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10, 44, pageWidth - 10, 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const eventName = (event.name || 'Prueba Oficial').toUpperCase();
  doc.text(`PRUEBA: ${eventName}`, 16, 39.5);
  doc.text(`RAMA: ${genderLabel.toUpperCase()}`, 115, 39.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`SEDE: ${tournamentInfo.venue || 'Estadio Escolar'}`, 185, 39.5);
  doc.text(`FECHA: ${tournamentInfo.date || '2026'}`, 245, 39.5);

  // Cuadro de Honor: 3 Cajas de Podio (Plata - Oro - Bronce)
  const goldWinner = rankedList[0];
  const silverWinner = rankedList[1];
  const bronzeWinner = rankedList[2];

  const colWidth = 78;
  const colHeight = 52;
  const startY = 48;
  const startX = 16;

  const getMarkText = (w) => {
    if (!w) return '--';
    if (w.markFormatted) return w.markFormatted;
    if (w.bestMark !== null && w.bestMark !== undefined) return formatFieldDistance(w.bestMark);
    if (w.timeSeconds !== null && w.timeSeconds !== undefined) return formatTrackTime(w.timeSeconds);
    return w.status ? w.status.toUpperCase() : '--';
  };

  const drawWinnerBox = (x, y, w, h, title, medalColor, athlete, isChampion) => {
    // Fondo de tarjeta
    doc.setFillColor(medalColor.bg[0], medalColor.bg[1], medalColor.bg[2]);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');

    // Borde
    doc.setDrawColor(medalColor.border[0], medalColor.border[1], medalColor.border[2]);
    doc.setLineWidth(isChampion ? 1 : 0.6);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    // Insignia superior
    doc.setFillColor(medalColor.badge[0], medalColor.badge[1], medalColor.badge[2]);
    doc.roundedRect(x + (w / 2) - 30, y - 3, 60, 6, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(medalColor.text[0], medalColor.text[1], medalColor.text[2]);
    doc.text(title, x + (w / 2), y + 1.2, { align: 'center' });

    if (athlete) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isChampion ? 11 : 10);
      doc.setTextColor(15, 23, 42);
      const name = String(athlete.fullName || 'Atleta').toUpperCase();
      doc.text(name, x + (w / 2), y + 13, { align: 'center', maxWidth: w - 8 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const school = athlete.schoolName || 'Escuela Primaria';
      doc.text(school, x + (w / 2), y + 19, { align: 'center', maxWidth: w - 8 });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`DORSAL: #${athlete.bibNumber || 'S/N'}`, x + (w / 2), y + 25, { align: 'center' });

      doc.setDrawColor(medalColor.border[0], medalColor.border[1], medalColor.border[2]);
      doc.setLineWidth(0.2);
      doc.line(x + 10, y + 29, x + w - 10, y + 29);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('MARCA OFICIAL / TIEMPO:', x + (w / 2), y + 34, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isChampion ? 15 : 13);
      doc.setTextColor(medalColor.markColor[0], medalColor.markColor[1], medalColor.markColor[2]);
      doc.text(getMarkText(athlete), x + (w / 2), y + 43, { align: 'center' });

      if (athlete.tieNote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(athlete.tieNote, x + (w / 2), y + 48, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Pendiente por definir', x + (w / 2), y + 26, { align: 'center' });
    }
  };

  // 2º LUGAR (PLATA) - Columna Izquierda
  drawWinnerBox(startX, startY, colWidth, colHeight, '2º LUGAR - MEDALLA DE PLATA', {
    bg: [248, 250, 252],
    border: [148, 163, 184],
    badge: [226, 232, 240],
    text: [51, 65, 85],
    markColor: [51, 65, 85]
  }, silverWinner, false);

  // 1º LUGAR (ORO) - Columna Centro
  drawWinnerBox(startX + colWidth + 5, startY, colWidth + 8, colHeight, '1º LUGAR - MEDALLA DE ORO', {
    bg: [254, 252, 232],
    border: [217, 119, 6],
    badge: [251, 191, 36],
    text: [69, 26, 3],
    markColor: [180, 83, 9]
  }, goldWinner, true);

  // 3º LUGAR (BRONCE) - Columna Derecha
  drawWinnerBox(startX + colWidth + 5 + colWidth + 13, startY, colWidth, colHeight, '3º LUGAR - MEDALLA DE BRONCE', {
    bg: [255, 247, 237],
    border: [180, 83, 9],
    badge: [254, 215, 170],
    text: [124, 45, 18],
    markColor: [124, 45, 18]
  }, bronzeWinner, false);

  // Tabla compacta de Finalistas (4º al 8º Lugar)
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
      startY: startY + colHeight + 5,
      head: [['Lugar', 'Dorsal', 'Finalista (Nombre del Alumno)', 'Escuela Primaria', 'Marca Oficial']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 95, fontStyle: 'bold' },
        3: { cellWidth: 85 },
        4: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });
  }

  // Firmas reglamentarias
  const footY = 188;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.3);
  doc.line(30, footY, 95, footY);
  doc.line(pageWidth - 95, footY, pageWidth - 30, footY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Coordinador General de Educación Física', 62.5, footY + 4, { align: 'center' });
  doc.text('Juez Árbitro Oficial de Atletismo', pageWidth - 62.5, footY + 4, { align: 'center' });

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
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 55, fontStyle: 'bold' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 45 },
      6: { cellWidth: 70 },
      7: { cellWidth: 20 }
    }
  });

  doc.save(`Padron_Oficial_Atletas_${Date.now()}.pdf`);
}
