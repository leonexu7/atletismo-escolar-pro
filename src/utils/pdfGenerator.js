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
 * Diseño minimalista con protagonismo exclusivo para el podio de ganadores (1º Oro, 2º Plata, 3º Bronce),
 * elegantes acentos de color institucional y firmas reglamentarias simétricas.
 */
export function generateAwardPresentationSheetPDF(rankedList = [], event = {}, tournamentInfo = {}, genderLabel = 'Varonil') {
  if (!rankedList || rankedList.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Marco perimetral fino institucional con acento dorado
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.25);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Encabezado institucional elegante
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('★ CÉDULA OFICIAL DE PREMIACIÓN Y PODIO DE HONOR ★', pageWidth / 2, 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(String(tournamentInfo.name || 'JUEGOS DEPORTIVOS ESCOLARES DE ATLETISMO').toUpperCase(), pageWidth / 2, 27, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(String(tournamentInfo.organizer || 'Comité Organizador y Supervisión General de Educación Física'), pageWidth / 2, 33, { align: 'center' });

  // Cinta de metadatos de la prueba con fondo pastel suave
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(18, 37, pageWidth - 36, 11, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(18, 37, pageWidth - 36, 11, 2, 2, 'S');

  const eventName = (event.name || 'Prueba Oficial').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(185, 28, 28); // rose-700
  doc.text(`PRUEBA: ${eventName}`, 24, 43.8);

  doc.setTextColor(3, 105, 161); // sky-700
  doc.text(`RAMA: ${genderLabel.toUpperCase()}`, 110, 43.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text(`FECHA: ${tournamentInfo.date || '2026'}`, 180, 43.8);

  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(`SEDE: ${tournamentInfo.venue || 'Estadio Escolar'}`, 230, 43.8);

  // Cuadro de Honor: 3 Cajas de Podio Exclusivas (Plata - Oro - Bronce)
  const goldWinner = rankedList[0];
  const silverWinner = rankedList[1];
  const bronzeWinner = rankedList[2];

  const getMarkText = (w) => {
    if (!w) return '--';
    if (w.markFormatted) return w.markFormatted;
    if (w.bestMark !== null && w.bestMark !== undefined) return formatFieldDistance(w.bestMark);
    if (w.timeSeconds !== null && w.timeSeconds !== undefined) return formatTrackTime(w.timeSeconds);
    return w.status ? w.status.toUpperCase() : '--';
  };

  // 2º LUGAR (PLATA) - Columna Izquierda
  {
    const x = 18;
    const y = 55;
    const w = 76;
    const h = 106;

    // Fondo pastel plateado suave
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    // Cinta superior plateada
    doc.setFillColor(100, 116, 139);
    doc.roundedRect(x + (w / 2) - 27, y - 3.5, 54, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('2º LUGAR • PLATA', x + (w / 2), y + 1.2, { align: 'center' });

    // Medallón plateado
    doc.setFillColor(226, 232, 240);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.6);
    doc.circle(x + (w / 2), y + 17, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text('2º', x + (w / 2), y + 21, { align: 'center' });

    if (silverWinner) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      const name = String(silverWinner.fullName || 'Atleta').toUpperCase();
      doc.text(name, x + (w / 2), y + 36, { align: 'center', maxWidth: w - 8 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const school = silverWinner.schoolName || 'Escuela Primaria';
      doc.text(school, x + (w / 2), y + 44, { align: 'center', maxWidth: w - 8 });

      if (silverWinner.bibNumber) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Dorsal: #${silverWinner.bibNumber}`, x + (w / 2), y + 51, { align: 'center' });
      }

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.line(x + 10, y + 58, x + w - 10, y + 58);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('MARCA OFICIAL:', x + (w / 2), y + 68, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(getMarkText(silverWinner), x + (w / 2), y + 81, { align: 'center' });

      if (silverWinner.tieNote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(silverWinner.tieNote, x + (w / 2), y + 90, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Pendiente por definir', x + (w / 2), y + 50, { align: 'center' });
    }
  }

  // 1º LUGAR (ORO) - Columna Centro Protagonista
  {
    const x = 98;
    const y = 52;
    const w = 84;
    const h = 111;

    // Fondo dorado cálido suave
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.2);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    // Cinta superior dorada
    doc.setFillColor(217, 119, 6);
    doc.roundedRect(x + (w / 2) - 31, y - 4, 62, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('★ 1º LUGAR • CAMPEÓN (ORO) ★', x + (w / 2), y + 1.5, { align: 'center' });

    // Medallón dorado
    doc.setFillColor(251, 191, 36);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.8);
    doc.circle(x + (w / 2), y + 19, 9, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(120, 53, 15);
    doc.text('1º', x + (w / 2), y + 23.5, { align: 'center' });

    if (goldWinner) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13.5);
      doc.setTextColor(15, 23, 42);
      const name = String(goldWinner.fullName || 'Atleta').toUpperCase();
      doc.text(name, x + (w / 2), y + 38, { align: 'center', maxWidth: w - 8 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const school = goldWinner.schoolName || 'Escuela Primaria';
      doc.text(school, x + (w / 2), y + 46, { align: 'center', maxWidth: w - 8 });

      if (goldWinner.bibNumber) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(146, 64, 14);
        doc.text(`Dorsal: #${goldWinner.bibNumber}`, x + (w / 2), y + 53, { align: 'center' });
      }

      doc.setDrawColor(251, 191, 36);
      doc.setLineWidth(0.35);
      doc.line(x + 10, y + 60, x + w - 10, y + 60);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text('MARCA OFICIAL:', x + (w / 2), y + 70, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(23);
      doc.setTextColor(120, 53, 15);
      doc.text(getMarkText(goldWinner), x + (w / 2), y + 84, { align: 'center' });

      if (goldWinner.tieNote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(180, 83, 9);
        doc.text(goldWinner.tieNote, x + (w / 2), y + 94, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Pendiente por definir', x + (w / 2), y + 50, { align: 'center' });
    }
  }

  // 3º LUGAR (BRONCE) - Columna Derecha
  {
    const x = 186;
    const y = 55;
    const w = 76;
    const h = 106;

    // Fondo pastel cálido bronce
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    // Cinta superior bronce
    doc.setFillColor(180, 83, 9);
    doc.roundedRect(x + (w / 2) - 27, y - 3.5, 54, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('3º LUGAR • BRONCE', x + (w / 2), y + 1.2, { align: 'center' });

    // Medallón bronce
    doc.setFillColor(254, 215, 170);
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.6);
    doc.circle(x + (w / 2), y + 17, 8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(124, 45, 18);
    doc.text('3º', x + (w / 2), y + 21, { align: 'center' });

    if (bronzeWinner) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      const name = String(bronzeWinner.fullName || 'Atleta').toUpperCase();
      doc.text(name, x + (w / 2), y + 36, { align: 'center', maxWidth: w - 8 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const school = bronzeWinner.schoolName || 'Escuela Primaria';
      doc.text(school, x + (w / 2), y + 44, { align: 'center', maxWidth: w - 8 });

      if (bronzeWinner.bibNumber) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text(`Dorsal: #${bronzeWinner.bibNumber}`, x + (w / 2), y + 51, { align: 'center' });
      }

      doc.setDrawColor(254, 215, 170);
      doc.setLineWidth(0.25);
      doc.line(x + 10, y + 58, x + w - 10, y + 58);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9);
      doc.text('MARCA OFICIAL:', x + (w / 2), y + 68, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(124, 45, 18);
      doc.text(getMarkText(bronzeWinner), x + (w / 2), y + 81, { align: 'center' });

      if (bronzeWinner.tieNote) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(180, 83, 9);
        doc.text(bronzeWinner.tieNote, x + (w / 2), y + 90, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Pendiente por definir', x + (w / 2), y + 50, { align: 'center' });
    }
  }

  // Firmas reglamentarias simétricas (sin recuadro de sello oficial)
  const footY = 184;
  const signLineWidth = 75;
  const leftCenter = 60;
  const rightCenter = pageWidth - 60;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.line(leftCenter - (signLineWidth / 2), footY, leftCenter + (signLineWidth / 2), footY);
  doc.line(rightCenter - (signLineWidth / 2), footY, rightCenter + (signLineWidth / 2), footY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Coordinador General de Educación Física', leftCenter, footY + 4.5, { align: 'center' });
  doc.text('Juez Árbitro Oficial de Atletismo', rightCenter, footY + 4.5, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Supervisión Escolar Oficial', leftCenter, footY + 8.5, { align: 'center' });
  doc.text('Colegio de Jueces y Cronometraje', rightCenter, footY + 8.5, { align: 'center' });

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
