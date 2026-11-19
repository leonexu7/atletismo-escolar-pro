import React, { useState, useMemo } from 'react';
import {
  Ruler,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Award,
  Sparkles,
  Info,
  XCircle,
  MinusCircle,
  Search,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { OFFICIAL_EVENTS, isFieldEvent } from '../constants/events';
import { formatFieldDistance, parseFieldDistance } from '../utils/timeFormatter';
import { evaluateFieldAttempts, rankFieldEventCompetitors } from '../utils/tieBreaker';
import { generateOfficialFieldSheetPDF } from '../utils/pdfGenerator';

export default function FieldJudgeView({
  tournament,
  athletes = [],
  schools = [],
  results = {},
  onSaveFieldResult,
  onOpenLiveResults,
  isAdmin = false,
  onOpenAdminLogin
}) {
  const fieldEvents = OFFICIAL_EVENTS.filter(e => isFieldEvent(e.id));

  const [selectedEventId, setSelectedEventId] = useState('campo_longitud');
  const [selectedGender, setSelectedGender] = useState('M');
  const [searchTerm, setSearchTerm] = useState('');

  const activeEvent = fieldEvents.find(e => e.id === selectedEventId) || fieldEvents[0];

  const eligibleAthletes = useMemo(() => {
    return athletes.filter(a => {
      const matchEvent = (a.eventIds || []).includes(activeEvent.id);
      const matchGender = a.gender === selectedGender;
      return matchEvent && matchGender;
    }).map((a, idx) => {
      const school = schools.find(s => s.id === a.schoolId);
      return {
        ...a,
        orderNumber: idx + 1,
        schoolName: school?.name || 'Escuela Primaria',
        schoolShort: school?.shortName || 'Escuela'
      };
    });
  }, [athletes, schools, activeEvent.id, selectedGender]);

  // Filtrado de competidores por el buscador
  const displayedAthletes = useMemo(() => {
    if (!searchTerm.trim()) return eligibleAthletes;
    const term = searchTerm.toLowerCase().trim();
    return eligibleAthletes.filter(ath =>
      ath.fullName.toLowerCase().includes(term) ||
      String(ath.bibNumber || '').includes(term) ||
      (ath.schoolName && ath.schoolName.toLowerCase().includes(term))
    );
  }, [eligibleAthletes, searchTerm]);

  const eventResults = results[activeEvent.id] || {};
  const currentFieldEntries = eventResults.fieldEntries || [];

  const [localAttempts, setLocalAttempts] = useState({});

  const getAthleteAttempts = (athleteId) => {
    if (localAttempts[athleteId]) return localAttempts[athleteId];

    const saved = currentFieldEntries.find(e => e.athleteId === athleteId);
    if (saved && Array.isArray(saved.attempts)) {
      return saved.attempts.map(a => ({
        attemptNum: a.attemptNum,
        valStr: a.value !== null && a.value !== undefined ? String(a.value) : '',
        status: a.status || (a.value ? 'valid' : 'pending')
      }));
    }

    return [
      { attemptNum: 1, valStr: '', status: 'pending' },
      { attemptNum: 2, valStr: '', status: 'pending' },
      { attemptNum: 3, valStr: '', status: 'pending' }
    ];
  };

  const handleAttemptChange = (athleteId, attemptIdx, rawValue) => {
    if (!isAdmin) return;
    const current = [...getAthleteAttempts(athleteId)];
    current[attemptIdx] = {
      ...current[attemptIdx],
      valStr: rawValue,
      status: rawValue ? 'valid' : 'pending'
    };

    setLocalAttempts(prev => ({
      ...prev,
      [athleteId]: current
    }));
  };

  const handleSetQuickStatus = (athleteId, attemptIdx, statusType) => {
    if (!isAdmin) return;
    const current = [...getAthleteAttempts(athleteId)];
    current[attemptIdx] = {
      ...current[attemptIdx],
      valStr: statusType === 'foul' ? 'X' : statusType === 'pass' ? '-' : '',
      status: statusType
    };

    setLocalAttempts(prev => ({
      ...prev,
      [athleteId]: current
    }));
  };

  const handleSaveAllMarks = () => {
    if (!isAdmin) {
      if (onOpenAdminLogin) onOpenAdminLogin();
      return;
    }

    const updatedEntries = eligibleAthletes.map(athlete => {
      const attemptsState = getAthleteAttempts(athlete.id);

      const parsedAttempts = attemptsState.map(att => {
        let value = null;
        let status = att.status;

        if (att.status === 'valid') {
          value = parseFieldDistance(att.valStr);
          if (value === null) status = 'pending';
        } else if (att.status === 'foul') {
          value = null;
          status = 'foul';
        } else if (att.status === 'pass') {
          value = null;
          status = 'pass';
        }

        return {
          attemptNum: att.attemptNum,
          value,
          status
        };
      });

      return {
        athleteId: athlete.id,
        attempts: parsedAttempts
      };
    });

    onSaveFieldResult(activeEvent.id, updatedEntries);
    alert('¡Marcas de los 3 intentos guardadas y sincronizadas con la Mesa de Control!');
  };

  const liveRankings = useMemo(() => {
    const evaluatedList = eligibleAthletes.map(athlete => {
      const attemptsState = getAthleteAttempts(athlete.id);

      const parsedForEval = attemptsState.map(att => {
        let value = null;
        if (att.status === 'valid') value = parseFieldDistance(att.valStr);
        return {
          attemptNum: att.attemptNum,
          value,
          status: att.status
        };
      });

      const technicalSummary = evaluateFieldAttempts(parsedForEval);

      return {
        ...athlete,
        ...technicalSummary
      };
    });

    return rankFieldEventCompetitors(evaluatedList);
  }, [eligibleAthletes, localAttempts, currentFieldEntries]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Banner de Modo Solo Lectura / Control de Acceso Oficial */}
      {!isAdmin ? (
        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="text-xs font-bold block">
                Modo Consulta (Solo Lectura) — Modificación Bloqueada
              </span>
              <span className="text-[11px] text-amber-800">
                Cualquier persona puede ver las marcas, pero solo los jueces autorizados con contraseña de Mesa de Control pueden registrar o modificar intentos oficiales.
              </span>
            </div>
          </div>
          {onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shrink-0 flex items-center space-x-1.5 shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span>Desbloquear Captura</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Mesa de Control activa — Modo Juez de Campo autorizado para captura y edición</span>
          </div>
        </div>
      )}

      {/* Selector de Prueba de Campo Pastel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Juez de Campo (Concursos de Saltos y Lanzamientos)
              </h2>
              <p className="text-xs text-slate-500">
                Reglamento: <strong>3 Intentos Oficiales</strong>. Gana la <strong>MEJOR MARCA VÁLIDA</strong> (no el promedio).
              </p>
            </div>
          </div>

          {/* Selector de Rama */}
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
        </div>

        {/* Las 4 Pruebas de Campo en Pastel Mint */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {fieldEvents.map(ev => {
            const isSelected = selectedEventId === ev.id;
            return (
              <button
                key={ev.id}
                onClick={() => {
                  setSelectedEventId(ev.id);
                  setLocalAttempts({});
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">{ev.name}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-700 font-medium'}`}>
                  {ev.spec}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Acciones */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs">
        <div className="flex items-center space-x-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Botones rápidos: <strong>NULO</strong> (X) | <strong>PASA</strong> (-). El sistema descarta nulos y clasifica por la mejor distancia.
          </span>
        </div>

        <button
          onClick={() => generateOfficialFieldSheetPDF(activeEvent, eligibleAthletes, tournament)}
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors self-end sm:self-auto"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Planilla Oficial PDF</span>
        </button>
      </div>

      {/* Planilla de Captura de los 3 Intentos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                {activeEvent.name} ({selectedGender === 'M' ? 'Varonil' : 'Femenil'})
              </h3>
              <p className="text-xs text-slate-500">Ingresa la distancia en metros (ej. 3.85)</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              {displayedAthletes.length !== eligibleAthletes.length
                ? `${displayedAthletes.length} de ${eligibleAthletes.length} Participantes`
                : `${eligibleAthletes.length} Participantes`}
            </span>
          </div>

          {/* Buscador de Competidores de Campo */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar competidor por nombre, número de dorsal o escuela..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {displayedAthletes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              {searchTerm ? (
                <span>No se encontraron competidores que coincidan con &ldquo;<strong>{searchTerm}</strong>&rdquo;.</span>
              ) : (
                <span>No hay atletas registrados en {activeEvent.name} para esta rama.</span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedAthletes.map((athlete) => {
                const athleteAttempts = getAthleteAttempts(athlete.id);
                const parsedForDisplay = athleteAttempts.map(a => ({
                  value: a.status === 'valid' ? parseFieldDistance(a.valStr) : null,
                  status: a.status
                }));
                const technicalEval = evaluateFieldAttempts(parsedForDisplay);

                return (
                  <div
                    key={athlete.id}
                    className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all space-y-2.5"
                  >
                    {/* Encabezado del Competidor */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-athletic text-base font-bold flex items-center justify-center">
                          {athlete.orderNumber}
                        </span>
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

                      {/* Display de la MEJOR MARCA VÁLIDA */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-none">Mejor:</span>
                        <span className="font-athletic text-2xl font-black text-emerald-700 leading-none">
                          {technicalEval.hasValidMark
                            ? formatFieldDistance(technicalEval.bestMark)
                            : technicalEval.hasOnlyFouls
                            ? 'NULO'
                            : '--.-- m'}
                        </span>
                      </div>
                    </div>

                    {/* Las 3 Casillas de Intentos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[0, 1, 2].map(attemptIdx => {
                        const att = athleteAttempts[attemptIdx];
                        const isFoul = att.status === 'foul';
                        const isPass = att.status === 'pass';

                        return (
                          <div
                            key={attemptIdx}
                            className={`p-2 rounded-xl border flex flex-col justify-between ${
                              !isAdmin
                                ? 'bg-slate-100/70 border-slate-200'
                                : isFoul
                                ? 'bg-rose-50/60 border-rose-200'
                                : isPass
                                ? 'bg-slate-100 border-slate-200'
                                : att.valStr
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-slate-500">
                                Intento {attemptIdx + 1}
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  type="button"
                                  disabled={!isAdmin}
                                  onClick={() => handleSetQuickStatus(athlete.id, attemptIdx, 'foul')}
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-all ${
                                    !isAdmin
                                      ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400'
                                      : isFoul
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:text-rose-600'
                                  }`}
                                >
                                  NULO
                                </button>
                                <button
                                  type="button"
                                  disabled={!isAdmin}
                                  onClick={() => handleSetQuickStatus(athlete.id, attemptIdx, 'pass')}
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition-all ${
                                    !isAdmin
                                      ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400'
                                      : isPass
                                      ? 'bg-slate-600 text-white'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  PASA
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <input
                                type="text"
                                value={att.valStr}
                                readOnly={!isAdmin}
                                onChange={(e) => handleAttemptChange(athlete.id, attemptIdx, e.target.value)}
                                placeholder="0.00"
                                className={`w-full border text-center font-athletic text-2xl font-bold rounded-lg py-1 px-2 focus:ring-2 focus:ring-emerald-400 outline-none transition-all ${
                                  !isAdmin
                                    ? 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed'
                                    : isFoul
                                    ? 'bg-white border-rose-300 text-rose-600 font-bold'
                                    : isPass
                                    ? 'bg-white border-slate-300 text-slate-400 font-bold'
                                    : 'bg-white border-slate-200 text-slate-900'
                                }`}
                              />
                              <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">m</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 flex justify-end">
            {!isAdmin ? (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Iniciar Sesión para Modificar Marcas</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAllMarks}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Guardar Intentos y Notificar a Mesa</span>
              </button>
            )}
          </div>
        </div>

        {/* Clasificación en Vivo con Desempates World Athletics */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Posiciones y Desempates</span>
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Mejor Marca
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {liveRankings.map((athlete, idx) => {
                const isPodium = idx < 3 && athlete.hasValidMark;
                return (
                  <div
                    key={athlete.id}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col space-y-1 ${
                      idx === 0 && athlete.hasValidMark
                        ? 'bg-amber-50 border-amber-200 text-slate-900'
                        : isPodium
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-white border-slate-100 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-5 h-5 rounded-md font-bold flex items-center justify-center text-[11px] ${
                          idx === 0 && athlete.hasValidMark ? 'bg-amber-400 text-amber-950 font-black' :
                          idx === 1 && athlete.hasValidMark ? 'bg-slate-300 text-slate-900 font-bold' :
                          idx === 2 && athlete.hasValidMark ? 'bg-amber-700 text-white font-bold' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {athlete.rank}
                        </span>
                        <div className="truncate max-w-[130px]">
                          <p className="font-bold text-slate-900 truncate">{athlete.fullName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{athlete.schoolShort}</p>
                        </div>
                      </div>

                      <span className="font-athletic text-base font-bold text-emerald-700">
                        {athlete.hasValidMark ? formatFieldDistance(athlete.bestMark) : athlete.rank}
                      </span>
                    </div>

                    {athlete.tieNote && (
                      <div className="text-[10px] font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200">
                        {athlete.tieNote}
                      </div>
                    )}
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
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver Podio y Medallistas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
