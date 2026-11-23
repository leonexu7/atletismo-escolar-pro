import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Sparkles,
  Printer,
  Medal,
  Users,
  ChevronRight,
  Flame,
  CheckCircle,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import { OFFICIAL_EVENTS, isFieldEvent } from '../constants/events';
import { formatTrackTime, formatFieldDistance } from '../utils/timeFormatter';
import { evaluateFieldAttempts, rankFieldEventCompetitors, rankTrackEventRunners } from '../utils/tieBreaker';
import { generateAwardsDiplomasPDF, generateAwardPresentationSheetPDF } from '../utils/pdfGenerator';
import AwardPresentationSheetModal from './AwardPresentationSheetModal';

export default function LiveResultsView({
  tournament,
  athletes = [],
  schools = [],
  results = {},
  initialEventId = 'campo_longitud'
}) {
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedGender, setSelectedGender] = useState('M');
  const [isAwardSheetOpen, setIsAwardSheetOpen] = useState(false);

  const activeEvent = OFFICIAL_EVENTS.find(e => e.id === selectedEventId) || OFFICIAL_EVENTS[0];
  const isField = isFieldEvent(activeEvent.id);

  const eventAthletes = useMemo(() => {
    return athletes.filter(a => {
      const matchEvent = (a.eventIds || []).includes(activeEvent.id);
      const matchGender = activeEvent.id.includes('mixto') ? true : a.gender === selectedGender;
      return matchEvent && matchGender;
    }).map(a => {
      const school = schools.find(s => s.id === a.schoolId);
      return {
        ...a,
        schoolName: school?.name || 'Escuela Primaria',
        schoolShort: school?.shortName || 'Escuela'
      };
    });
  }, [athletes, schools, activeEvent.id, selectedGender]);

  const eventResults = results[activeEvent.id] || {};

  const rankedList = useMemo(() => {
    if (isField) {
      const fieldData = eventResults.fieldEntries || [];
      const evaluated = eventAthletes.map(ath => {
        const found = fieldData.find(e => e.athleteId === ath.id);
        const attempts = found?.attempts || [];
        const tech = evaluateFieldAttempts(attempts);
        return {
          ...ath,
          ...tech,
          markFormatted: tech.hasValidMark ? formatFieldDistance(tech.bestMark) : tech.hasOnlyFouls ? 'NULO' : 'DNS'
        };
      });
      return rankFieldEventCompetitors(evaluated);
    } else {
      const trackData = eventResults.trackEntries || [];
      const evaluated = eventAthletes.map(ath => {
        const found = trackData.find(e => e.athleteId === ath.id);
        const timeSeconds = found?.timeSeconds || null;
        return {
          ...ath,
          timeSeconds,
          status: found?.status || (timeSeconds ? 'valid' : 'pending'),
          statusReason: found?.statusReason || '',
          markFormatted: timeSeconds ? formatTrackTime(timeSeconds) : found?.status?.toUpperCase() || 'DNS'
        };
      });
      return rankTrackEventRunners(evaluated);
    }
  }, [isField, eventAthletes, eventResults]);

  const goldWinner = rankedList[0];
  const silverWinner = rankedList[1];
  const bronzeWinner = rankedList[2];

  const handleLaunchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleDownloadAwardSheetPDF = () => {
    const hasAnyResult = rankedList.some(w => isField ? w.hasValidMark : (w.status === 'valid' && w.timeSeconds));
    if (!hasAnyResult) {
      alert('Aún no hay atletas premiados con marcas oficiales registradas en esta prueba.');
      return;
    }
    const genderLabel = activeEvent.id.includes('mixto') ? 'Mixto' : selectedGender === 'F' ? 'Femenil' : 'Varonil';
    generateAwardPresentationSheetPDF(rankedList, activeEvent, tournament, genderLabel);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Selector de Prueba */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Podio y Resultados Oficiales en Vivo
              </h2>
              <p className="text-xs text-slate-500">
                Consulta pública para maestros, alumnos y padres de familia
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!activeEvent.id.includes('mixto') && !activeEvent.id.includes('relevo') && (
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedGender('M')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedGender === 'M' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Varonil
                </button>
                <button
                  onClick={() => setSelectedGender('F')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedGender === 'F' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Femenil
                </button>
              </div>
            )}

            <button
              onClick={handleLaunchConfetti}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Celebrar</span>
            </button>
          </div>
        </div>

        {/* Carrusel de Pruebas */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          {OFFICIAL_EVENTS.map(ev => {
            const isSelected = selectedEventId === ev.id;
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-rose-500 border-rose-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {ev.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Podio Olímpico Pastel */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-xs">
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest block mb-0.5">
            Podio de Premiación
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
            {activeEvent.name} ({activeEvent.id.includes('mixto') ? 'Combinado Mixto' : selectedGender === 'M' ? 'Varonil' : 'Femenil'})
          </h3>
          <p className="text-xs text-slate-500">
            {isField ? 'Clasificación por MEJOR MARCA VÁLIDA (Reglamento World Athletics)' : 'Clasificación por menor tiempo de carrera'}
          </p>
        </div>

        {/* Las 3 Plataformas del Podio en Tonos Pastel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end max-w-3xl mx-auto pt-4">
          {/* SEGUNDO LUGAR (PLATA) */}
          <div className="order-2 sm:order-1 flex flex-col items-center">
            {silverWinner && (silverWinner.hasValidMark || silverWinner.timeSeconds) ? (
              <div className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-slate-300 font-athletic font-black text-xl text-slate-800 flex items-center justify-center mb-1.5 shadow-xs">
                  2º
                </div>
                <h4 className="font-bold text-sm text-slate-900 truncate max-w-full">{silverWinner.fullName}</h4>
                <p className="text-xs text-slate-500 truncate max-w-full">{silverWinner.schoolName}</p>
                <div className="mt-2 py-0.5 px-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="font-athletic text-xl font-black text-slate-800">
                    {silverWinner.markFormatted}
                  </span>
                </div>
                {silverWinner.tieNote && (
                  <span className="text-[10px] text-slate-500 mt-1 italic">{silverWinner.tieNote}</span>
                )}
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center text-slate-400 text-xs">
                Plata Pendiente
              </div>
            )}
            <div className="w-full h-16 bg-slate-200/80 rounded-b-xl flex items-center justify-center text-slate-600 font-athletic text-2xl font-black mt-1.5">
              PLATA
            </div>
          </div>

          {/* PRIMER LUGAR (ORO) */}
          <div className="order-1 sm:order-2 flex flex-col items-center -mt-3">
            <Trophy className="w-7 h-7 text-amber-500 mb-1" />

            {goldWinner && (goldWinner.hasValidMark || goldWinner.timeSeconds) ? (
              <div className="w-full bg-amber-50/60 border-2 border-amber-300 rounded-2xl p-4 text-center shadow-xs flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-amber-400 border-2 border-amber-300 font-athletic font-black text-2xl text-amber-950 flex items-center justify-center mb-1.5 shadow-xs">
                  1º
                </div>
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  CAMPEÓN DE ORO
                </span>
                <h4 className="font-black text-base text-slate-900 truncate max-w-full">{goldWinner.fullName}</h4>
                <p className="text-xs text-slate-600 truncate max-w-full">{goldWinner.schoolName}</p>
                <div className="mt-2 py-0.5 px-3 bg-white border border-amber-300 rounded-lg">
                  <span className="font-athletic text-2xl font-black text-amber-800">
                    {goldWinner.markFormatted}
                  </span>
                </div>
                {goldWinner.tieNote && (
                  <span className="text-[10px] text-amber-700 mt-1 italic">{goldWinner.tieNote}</span>
                )}
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
                Oro Pendiente
              </div>
            )}
            <div className="w-full h-24 bg-amber-400/90 rounded-b-xl flex items-center justify-center text-amber-950 font-athletic text-3xl font-black mt-1.5">
              ORO
            </div>
          </div>

          {/* TERCER LUGAR (BRONCE) */}
          <div className="order-3 sm:order-3 flex flex-col items-center">
            {bronzeWinner && (bronzeWinner.hasValidMark || bronzeWinner.timeSeconds) ? (
              <div className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 text-center shadow-xs flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-amber-700 border-2 border-amber-600 font-athletic font-black text-xl text-amber-100 flex items-center justify-center mb-1.5 shadow-xs">
                  3º
                </div>
                <h4 className="font-bold text-sm text-slate-900 truncate max-w-full">{bronzeWinner.fullName}</h4>
                <p className="text-xs text-slate-500 truncate max-w-full">{bronzeWinner.schoolName}</p>
                <div className="mt-2 py-0.5 px-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="font-athletic text-xl font-black text-slate-800">
                    {bronzeWinner.markFormatted}
                  </span>
                </div>
                {bronzeWinner.tieNote && (
                  <span className="text-[10px] text-slate-500 mt-1 italic">{bronzeWinner.tieNote}</span>
                )}
              </div>
            ) : (
              <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-center text-slate-400 text-xs">
                Bronce Pendiente
              </div>
            )}
            <div className="w-full h-14 bg-amber-700/80 rounded-b-xl flex items-center justify-center text-white font-athletic text-xl font-black mt-1.5">
              BRONCE
            </div>
          </div>
        </div>

        {/* Acciones Oficiales de Hoja de Premiación de Lugares */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsAwardSheetOpen(true)}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-2xs flex items-center space-x-2 transition-all active:scale-95"
            title="Ver la hoja estética de presentación oficial de premiación con el podio"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>Ver Hoja de Premiación Oficial</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadAwardSheetPDF}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center space-x-2 transition-all active:scale-95"
            title="Descargar la cédula técnica y hoja de premiación en PDF listo para firmar"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Hoja en PDF</span>
          </button>
        </div>
      </div>

      {/* Tabla Completa de Posiciones */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-3">
          Clasificación Completa de la Categoría
        </h4>

        {/* En móvil: tarjetas claras */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {rankedList.map((competitor, idx) => (
            <div key={competitor.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs ${
                  idx === 0 ? 'bg-amber-400 text-amber-950' :
                  idx === 1 ? 'bg-slate-300 text-slate-900' :
                  idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {competitor.rank}
                </span>
                <div>
                  <p className="font-bold text-xs text-slate-900">{competitor.fullName}</p>
                  <p className="text-[10px] text-slate-500">{competitor.schoolName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-athletic text-base font-bold text-slate-900">
                  {competitor.markFormatted}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* En desktop: tabla minimalista */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Lugar</th>
                <th className="py-2.5 px-3">Dorsal</th>
                <th className="py-2.5 px-3">Alumno Competidor</th>
                <th className="py-2.5 px-3">Escuela</th>
                <th className="py-2.5 px-3 text-center">Marca Oficial</th>
                <th className="py-2.5 px-3">Criterio / Desempate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedList.map((competitor, idx) => {
                const isTop3 = idx < 3 && (isField ? competitor.hasValidMark : competitor.timeSeconds);
                return (
                  <tr key={competitor.id} className={isTop3 ? 'bg-amber-50/20' : 'hover:bg-slate-50/60'}>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md font-bold text-[11px] ${
                        idx === 0 && isTop3 ? 'bg-amber-400 text-amber-950 font-black' :
                        idx === 1 && isTop3 ? 'bg-slate-300 text-slate-900 font-bold' :
                        idx === 2 && isTop3 ? 'bg-amber-700 text-white font-bold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {competitor.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      #{competitor.bibNumber || 'S/N'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {competitor.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {competitor.schoolName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-athletic text-lg font-bold text-slate-900">
                      {competitor.markFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 italic">
                      {competitor.tieNote || (isTop3 ? 'Marca reglamentaria válida' : '-')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Hoja de Presentación Oficial de Premiación */}
      <AwardPresentationSheetModal
        isOpen={isAwardSheetOpen}
        onClose={() => setIsAwardSheetOpen(false)}
        event={activeEvent}
        gender={selectedGender}
        tournament={tournament}
        rankedList={rankedList}
      />
    </div>
  );
}
