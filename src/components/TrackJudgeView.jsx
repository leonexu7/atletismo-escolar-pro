import React, { useState, useMemo } from 'react';
import {
  Timer,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Users,
  Flag,
  Award,
  Clock,
  Sparkles
} from 'lucide-react';
import { OFFICIAL_EVENTS, isTrackEvent } from '../constants/events';
import { formatTrackTime, parseTrackTime } from '../utils/timeFormatter';
import { generateTrackHeats } from '../utils/athleticsEngine';
import { rankTrackEventRunners } from '../utils/tieBreaker';
import { generateOfficialTrackSheetPDF } from '../utils/pdfGenerator';
import DigitalStopwatchModal from './DigitalStopwatchModal';

export default function TrackJudgeView({
  tournament,
  athletes = [],
  schools = [],
  results = {},
  onSaveTrackResult,
  onOpenLiveResults
}) {
  const trackEvents = OFFICIAL_EVENTS.filter(e => isTrackEvent(e.id));

  const [selectedEventId, setSelectedEventId] = useState('pista_75m');
  const [selectedGender, setSelectedGender] = useState('M');
  const [selectedHeatIndex, setSelectedHeatIndex] = useState(0);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);

  const activeEvent = trackEvents.find(e => e.id === selectedEventId) || trackEvents[0];

  const currentGender = activeEvent.id === 'relevo_4x75m_mixto'
    ? 'MIXED'
    : activeEvent.id === 'relevo_4x75m_femenil'
    ? 'F'
    : activeEvent.id === 'relevo_4x75m_varonil'
    ? 'M'
    : selectedGender;

  const eligibleAthletes = useMemo(() => {
    return athletes.filter(a => {
      const matchEvent = (a.eventIds || []).includes(activeEvent.id);
      const matchGender = activeEvent.id.includes('mixto') ? true : a.gender === currentGender;
      return matchEvent && matchGender;
    }).map(a => {
      const school = schools.find(s => s.id === a.schoolId);
      return {
        ...a,
        schoolName: school?.name || 'Escuela Primaria',
        schoolShort: school?.shortName || 'Escuela'
      };
    });
  }, [athletes, schools, activeEvent.id, currentGender]);

  const heats = useMemo(() => {
    return generateTrackHeats(eligibleAthletes, tournament?.lanesCount || 6);
  }, [eligibleAthletes, tournament?.lanesCount]);

  const activeHeat = heats[selectedHeatIndex] || heats[0] || { lanes: [] };

  const eventResults = results[activeEvent.id] || {};
  const currentTrackEntries = eventResults.trackEntries || [];

  const [localTimes, setLocalTimes] = useState({});

  const getRunnerTime = (athleteId) => {
    if (localTimes[athleteId] !== undefined) return localTimes[athleteId];
    const found = currentTrackEntries.find(e => e.athleteId === athleteId);
    return found ? found.timeSeconds : '';
  };

  const getRunnerStatus = (athleteId) => {
    const found = currentTrackEntries.find(e => e.athleteId === athleteId);
    return found ? found.status : 'valid';
  };

  const handleTimeChange = (athleteId, val) => {
    setLocalTimes(prev => ({
      ...prev,
      [athleteId]: val
    }));
  };

  const handleStatusChange = (athleteId, newStatus) => {
    const runner = eligibleAthletes.find(a => a.id === athleteId);
    if (!runner) return;

    const existingEntries = currentTrackEntries.filter(e => e.athleteId !== athleteId);
    const updatedEntry = {
      athleteId,
      timeSeconds: newStatus === 'valid' ? (parseTrackTime(localTimes[athleteId]) || null) : null,
      status: newStatus,
      statusReason: newStatus === 'dq' ? 'Salida en falso / Invasión carril' : ''
    };

    onSaveTrackResult(activeEvent.id, [...existingEntries, updatedEntry]);
  };

  const handleSaveHeat = () => {
    const updatedEntries = [...currentTrackEntries];

    (activeHeat.lanes || []).forEach(athlete => {
      const rawVal = localTimes[athlete.id];
      const parsedTime = parseTrackTime(rawVal);
      const existingIdx = updatedEntries.findIndex(e => e.athleteId === athlete.id);

      if (parsedTime !== null) {
        const newRecord = {
          athleteId: athlete.id,
          heatNumber: activeHeat.heatNumber,
          laneNumber: athlete.assignedLane,
          timeSeconds: parsedTime,
          status: 'valid'
        };

        if (existingIdx !== -1) {
          updatedEntries[existingIdx] = { ...updatedEntries[existingIdx], ...newRecord };
        } else {
          updatedEntries.push(newRecord);
        }
      }
    });

    onSaveTrackResult(activeEvent.id, updatedEntries);
    alert('¡Tiempos guardados y sincronizados con la Mesa de Control!');
  };

  const handleApplyStopwatchSplits = (splits) => {
    const newLocal = { ...localTimes };
    (activeHeat.lanes || []).forEach(athlete => {
      const laneNum = athlete.assignedLane;
      if (splits[laneNum] !== undefined) {
        newLocal[athlete.id] = splits[laneNum];
      }
    });
    setLocalTimes(newLocal);
  };

  const liveRankings = useMemo(() => {
    const combined = eligibleAthletes.map(ath => {
      const recorded = currentTrackEntries.find(e => e.athleteId === ath.id);
      const tempVal = localTimes[ath.id];
      const parsedTemp = parseTrackTime(tempVal);

      const timeSeconds = parsedTemp !== null ? parsedTemp : (recorded?.timeSeconds || null);
      const status = recorded?.status || (timeSeconds ? 'valid' : 'pending');

      return {
        ...ath,
        timeSeconds,
        status,
        statusReason: recorded?.statusReason || ''
      };
    });

    return rankTrackEventRunners(combined);
  }, [eligibleAthletes, currentTrackEntries, localTimes]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Selector de Prueba de Pista Pastel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Juez de Pista (Carreras y Velocidad)
              </h2>
              <p className="text-xs text-slate-500">Captura de tiempos en segundos y centésimas</p>
            </div>
          </div>

          {/* Rama */}
          {!activeEvent.id.includes('mixto') && !activeEvent.id.includes('relevo') && (
            <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
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
        </div>

        {/* Botones de Pruebas en Colores Pastel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {trackEvents.map(ev => {
            const isSelected = selectedEventId === ev.id;
            return (
              <button
                key={ev.id}
                onClick={() => {
                  setSelectedEventId(ev.id);
                  setSelectedHeatIndex(0);
                  setLocalTimes({});
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-rose-500 border-rose-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">{ev.shortName}</div>
                <div className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                  {ev.category}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Serie y Acciones */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Series:</span>
          {heats.length === 0 ? (
            <span className="text-xs text-slate-400 italic">Sin corredores inscritos</span>
          ) : (
            heats.map((heat, idx) => (
              <button
                key={heat.heatNumber}
                onClick={() => setSelectedHeatIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedHeatIndex === idx
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {heat.name}
              </button>
            ))
          )}
        </div>

        <div className="flex space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsStopwatchOpen(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Cronómetro</span>
          </button>

          <button
            onClick={() => generateOfficialTrackSheetPDF(activeEvent, heats, tournament)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Planilla PDF</span>
          </button>
        </div>
      </div>

      {/* Planilla de Captura por Carril */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center space-x-2">
                <Flag className="w-4 h-4 text-rose-500" />
                <span>{activeHeat.name || 'Serie 1'}</span>
              </h3>
              <p className="text-xs text-slate-500">Ingresa el tiempo en segundos (ej. 10.52)</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {activeHeat.lanes?.length || 0} Corredores
            </span>
          </div>

          {(!activeHeat.lanes || activeHeat.lanes.length === 0) ? (
            <div className="text-center py-10 text-slate-400 text-xs italic">
              No hay atletas registrados en esta serie para {activeEvent.name}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeHeat.lanes.map((athlete) => {
                const currentTime = getRunnerTime(athlete.id);
                const currentStatus = getRunnerStatus(athlete.id);

                return (
                  <div
                    key={athlete.id}
                    className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-athletic text-lg font-bold flex items-center justify-center flex-shrink-0">
                        {athlete.assignedLane}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-sm text-slate-900">{athlete.fullName}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            #{athlete.bibNumber || 'S/N'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{athlete.schoolName}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <div className="relative">
                        <input
                          type="text"
                          value={currentTime}
                          onChange={(e) => handleTimeChange(athlete.id, e.target.value)}
                          placeholder="00.00"
                          disabled={currentStatus !== 'valid'}
                          className={`w-28 bg-white border text-center font-athletic text-2xl font-bold rounded-xl py-1 px-2 focus:ring-2 focus:ring-rose-400 outline-none transition-all ${
                            currentStatus === 'valid'
                              ? 'border-slate-300 text-slate-900'
                              : 'border-slate-200 text-slate-400 line-through bg-slate-100'
                          }`}
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">seg</span>
                      </div>

                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleStatusChange(athlete.id, 'valid')}
                          title="Válido"
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'valid'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => handleStatusChange(athlete.id, 'dns')}
                          title="No se presentó (DNS)"
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'dns'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          DNS
                        </button>
                        <button
                          onClick={() => handleStatusChange(athlete.id, 'dq')}
                          title="Descalificado (DQ)"
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'dq'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          DQ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleSaveHeat}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Guardar Tiempos y Notificar a Mesa</span>
            </button>
          </div>
        </div>

        {/* Clasificación en Vivo */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Posiciones de la Prueba</span>
              </h3>
              <span className="text-[11px] text-slate-400">Menor tiempo</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {liveRankings.map((athlete, idx) => {
                const isPodium = idx < 3 && athlete.status === 'valid' && athlete.timeSeconds;
                return (
                  <div
                    key={athlete.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      idx === 0 && athlete.timeSeconds
                        ? 'bg-amber-50 border-amber-200 text-slate-900'
                        : isPodium
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-white border-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className={`w-5 h-5 rounded-md font-bold flex items-center justify-center text-[11px] ${
                        idx === 0 && athlete.timeSeconds ? 'bg-amber-400 text-amber-950 font-black' :
                        idx === 1 && athlete.timeSeconds ? 'bg-slate-300 text-slate-900 font-bold' :
                        idx === 2 && athlete.timeSeconds ? 'bg-amber-700 text-white font-bold' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {athlete.rank || idx + 1}
                      </span>
                      <div className="truncate max-w-[130px]">
                        <p className="font-bold text-slate-900 truncate">{athlete.fullName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{athlete.schoolShort}</p>
                      </div>
                    </div>

                    <span className="font-athletic text-base font-bold text-slate-900">
                      {athlete.status === 'valid' ? formatTrackTime(athlete.timeSeconds) : athlete.status?.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onOpenLiveResults(activeEvent.id)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ver Podio y Medallistas</span>
            </button>
          </div>
        </div>
      </div>

      <DigitalStopwatchModal
        isOpen={isStopwatchOpen}
        onClose={() => setIsStopwatchOpen(false)}
        lanes={activeHeat.lanes || []}
        onApplyTimes={handleApplyStopwatchSplits}
      />
    </div>
  );
}
