import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Play,
  Square,
  RotateCcw,
  Check,
  Flag,
  Flame,
  Radio,
  Users,
  AlertTriangle,
  Zap,
  Save,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Smartphone
} from 'lucide-react';
import { formatTrackTime } from '../utils/timeFormatter';
import { playFalseStartSound, playStarterGunSound } from '../utils/audioStarter';

// Paleta de colores pastel minimalista diferenciada por carril (1 a 8)
const LANE_PASTEL_THEMES = {
  1: {
    card: 'bg-rose-50/70 border-rose-200/90 text-rose-950',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    display: 'text-rose-900',
    button: 'bg-rose-500 hover:bg-rose-600 text-white'
  },
  2: {
    card: 'bg-sky-50/70 border-sky-200/90 text-sky-950',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    display: 'text-sky-900',
    button: 'bg-sky-500 hover:bg-sky-600 text-white'
  },
  3: {
    card: 'bg-amber-50/70 border-amber-200/90 text-amber-950',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    display: 'text-amber-900',
    button: 'bg-amber-500 hover:bg-amber-600 text-slate-950'
  },
  4: {
    card: 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    display: 'text-emerald-900',
    button: 'bg-emerald-500 hover:bg-emerald-600 text-white'
  },
  5: {
    card: 'bg-purple-50/70 border-purple-200/90 text-purple-950',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    display: 'text-purple-900',
    button: 'bg-purple-500 hover:bg-purple-600 text-white'
  },
  6: {
    card: 'bg-teal-50/70 border-teal-200/90 text-teal-950',
    badge: 'bg-teal-100 text-teal-800 border-teal-300',
    display: 'text-teal-900',
    button: 'bg-teal-500 hover:bg-teal-600 text-white'
  },
  7: {
    card: 'bg-indigo-50/70 border-indigo-200/90 text-indigo-950',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    display: 'text-indigo-900',
    button: 'bg-indigo-500 hover:bg-indigo-600 text-white'
  },
  8: {
    card: 'bg-pink-50/70 border-pink-200/90 text-pink-950',
    badge: 'bg-pink-100 text-pink-800 border-pink-300',
    display: 'text-pink-900',
    button: 'bg-pink-500 hover:bg-pink-600 text-white'
  }
};

export default function MultiLaneStopwatchModal({
  isOpen,
  onClose,
  activeEvent,
  heats = [],
  selectedHeatIndex = 0,
  onSelectHeatIndex,
  lanesCount = 6,
  onApplyTimes,
  isAdmin = false,
  onOpenAdminLogin,
  roomCode = 'ATLETISMO-2026',
  activeRaceSession = null,
  allAthletes = [],
  isCloudEnabled = true
}) {
  const [currentLanesCount, setCurrentLanesCount] = useState(lanesCount || 6);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'single'
  const [selectedSingleLane, setSelectedSingleLane] = useState(1);
  const [isRaceRunning, setIsRaceRunning] = useState(false);
  const [laneTimes, setLaneTimes] = useState({}); // { [assignedLane]: elapsedMs }
  const [laneStatus, setLaneStatus] = useState({}); // { [assignedLane]: 'running' | 'stopped' }
  const [laneAssignments, setLaneAssignments] = useState({}); // { [laneNumber]: athleteId }
  const [localElapsedMs, setLocalElapsedMs] = useState(0);
  const [showEmergencyTrigger, setShowEmergencyTrigger] = useState(false);

  const startTimestampRef = useRef(null);
  const isRunningRef = useRef(false);
  const rafRef = useRef(null);
  const lastActiveTimestampRef = useRef(null);
  const prevHeatIndexRef = useRef(selectedHeatIndex);

  // Lista de 2 a 8 carriles según requerimiento
  const LANE_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

  const activeHeat = heats[selectedHeatIndex] || heats[0] || { lanes: [] };

  // Candidatos disponibles para seleccionar (piscina del evento o serie)
  const candidateAthletes = useMemo(() => {
    if (allAthletes && allAthletes.length > 0) return allAthletes;
    return activeHeat.lanes || [];
  }, [allAthletes, activeHeat.lanes]);

  // Arreglo numérico de carriles [1, 2, ..., currentLanesCount]
  const lanesArray = useMemo(() => {
    return Array.from({ length: currentLanesCount }, (_, i) => i + 1);
  }, [currentLanesCount]);

  // Función constructora de asignación automática de la serie
  const getDefaultAssignments = useCallback((heatLanes, count) => {
    const map = {};
    for (let laneNum = 1; laneNum <= count; laneNum++) {
      const byLane = (heatLanes || []).find(a => Number(a.assignedLane) === laneNum);
      if (byLane) {
        map[laneNum] = byLane.id;
      } else {
        const fallback = (heatLanes || [])[laneNum - 1];
        map[laneNum] = fallback ? fallback.id : '';
      }
    }
    return map;
  }, []);

  // Inicializar o sincronizar asignaciones cuando se abre el modal o cambia la serie
  useEffect(() => {
    if (!isOpen) {
      setLaneAssignments({});
      setLaneTimes({});
      setLaneStatus({});
      setShowEmergencyTrigger(false);
      return;
    }

    // Si cambió la serie de corredores, resetear a los de esa serie
    if (prevHeatIndexRef.current !== selectedHeatIndex) {
      prevHeatIndexRef.current = selectedHeatIndex;
      setLaneAssignments(getDefaultAssignments(activeHeat.lanes, currentLanesCount));
      setLaneTimes({});
      setLaneStatus({});
      setShowEmergencyTrigger(false);
      return;
    }

    // Inicializar o completar carriles vacíos manteniendo personalizaciones
    setLaneAssignments(prev => {
      const defaults = getDefaultAssignments(activeHeat.lanes, currentLanesCount);
      const updated = { ...defaults, ...prev };
      for (let l = 1; l <= currentLanesCount; l++) {
        if (updated[l] === undefined) {
          updated[l] = defaults[l] || '';
        }
      }
      return updated;
    });
  }, [isOpen, selectedHeatIndex, activeHeat.lanes, currentLanesCount, getDefaultAssignments]);

  // Reasignar corredor de un carril manualmente
  const handleReassignRunner = (laneNum, athleteId) => {
    setLaneAssignments(prev => ({
      ...prev,
      [laneNum]: athleteId
    }));
  };

  // Escuchar la transmisión del Juez de Salida (Starter) por la Nube en tiempo real
  useEffect(() => {
    if (!isOpen) return;

    if (activeRaceSession && activeRaceSession.updatedAt !== lastActiveTimestampRef.current) {
      lastActiveTimestampRef.current = activeRaceSession.updatedAt;

      // 1. Detección de Disparo del Starter
      if (activeRaceSession.status === 'running' && activeRaceSession.startTimestamp) {
        startTimestampRef.current = activeRaceSession.startTimestamp;
        isRunningRef.current = true;
        setIsRaceRunning(true);

        const initialStatus = {};
        lanesArray.forEach(l => {
          initialStatus[l] = 'running';
        });
        setLaneStatus(initialStatus);
        setLaneTimes({});
      }
      // 2. Detección de Salida en Falso
      else if (activeRaceSession.status === 'false_start') {
        isRunningRef.current = false;
        setIsRaceRunning(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        playFalseStartSound();
      }
      // 3. Detección de Reinicio
      else if (activeRaceSession.status === 'idle') {
        isRunningRef.current = false;
        setIsRaceRunning(false);
        startTimestampRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }
    }
  }, [activeRaceSession, isOpen, lanesArray]);

  // Bucle síncrono de cronómetro de alta precisión
  useEffect(() => {
    if (isRaceRunning && startTimestampRef.current) {
      const tick = () => {
        if (!isRunningRef.current) return;
        const now = Date.now();
        const diff = Math.max(0, now - startTimestampRef.current);
        setLocalElapsedMs(diff);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRaceRunning]);

  // 1. Iniciar carrera localmente desde Meta (Respaldo por si no hay internet o se ve el humo)
  const handleLocalStart = useCallback(() => {
    const startTs = Date.now();
    startTimestampRef.current = startTs;
    isRunningRef.current = true;
    setIsRaceRunning(true);
    setLocalElapsedMs(0);

    const initialStatus = {};
    lanesArray.forEach(laneNum => {
      initialStatus[laneNum] = 'running';
    });
    setLaneStatus(initialStatus);
    setLaneTimes({});
  }, [lanesArray]);

  // 2. Parar tiempo de un carril específico inmediatamente (en pointerdown para cero retardo)
  const handleStopLane = useCallback((laneNumber, e) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    if (!startTimestampRef.current) return;

    const stopTs = Date.now();
    const finalElapsed = Math.max(0, stopTs - startTimestampRef.current);

    setLaneTimes(prev => ({
      ...prev,
      [laneNumber]: finalElapsed
    }));

    setLaneStatus(prev => ({
      ...prev,
      [laneNumber]: 'stopped'
    }));
  }, []);

  // 3. Reanudar cronómetro de un carril si se tocó por error
  const handleResumeLane = useCallback((laneNumber) => {
    setLaneTimes(prev => {
      const copy = { ...prev };
      delete copy[laneNumber];
      return copy;
    });
    setLaneStatus(prev => ({
      ...prev,
      [laneNumber]: 'running'
    }));
  }, []);

  // 4. Parar todos los carriles que sigan corriendo
  const handleStopAllLanes = () => {
    if (!startTimestampRef.current) return;
    const stopTs = Date.now();
    const finalElapsed = Math.max(0, stopTs - startTimestampRef.current);

    const updatedTimes = { ...laneTimes };
    const updatedStatus = { ...laneStatus };

    lanesArray.forEach(laneNum => {
      if (updatedStatus[laneNum] !== 'stopped') {
        updatedTimes[laneNum] = finalElapsed;
        updatedStatus[laneNum] = 'stopped';
      }
    });

    setLaneTimes(updatedTimes);
    setLaneStatus(updatedStatus);
    isRunningRef.current = false;
    setIsRaceRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // 5. Reiniciar cronómetro
  const handleReset = () => {
    isRunningRef.current = false;
    setIsRaceRunning(false);
    startTimestampRef.current = null;
    setLocalElapsedMs(0);
    setLaneTimes({});
    setLaneStatus({});
    setShowEmergencyTrigger(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // 6. Guardar y Volcar tiempos a la Mesa de Control Oficial (sincronizando tanto automático como manual)
  const handleApplyToControlDesk = () => {
    if (!isAdmin) {
      if (onOpenAdminLogin) onOpenAdminLogin();
      return;
    }

    const recordedLanes = Object.keys(laneTimes);
    if (recordedLanes.length === 0) {
      alert('Aún no has parado ningún carril. Registra al menos un tiempo antes de guardar.');
      return;
    }

    const formattedSplits = {};
    const assignments = {};
    let savedAthletesCount = 0;

    recordedLanes.forEach(laneStr => {
      const laneNum = Number(laneStr);
      const ms = laneTimes[laneNum];
      const timeSec = Number((ms / 1000).toFixed(2));
      formattedSplits[laneNum] = timeSec;

      const athId = laneAssignments[laneNum];
      if (athId) {
        assignments[laneNum] = athId;
        savedAthletesCount++;
      }
    });

    if (savedAthletesCount === 0) {
      alert('Los carriles cronometrados no tienen corredores asignados. Por favor asigna un corredor en el carril antes de guardar.');
      return;
    }

    if (onApplyTimes) {
      onApplyTimes({ splits: formattedSplits, assignments });
    }
    alert(`¡Se guardaron y sincronizaron ${savedAthletesCount} tiempos oficiales en la Mesa de Control!`);
    onClose();
  };

  const handleLaneCountChange = (count) => {
    const val = Math.max(2, Math.min(8, Number(count) || 6));
    setCurrentLanesCount(val);
  };

  if (!isOpen) return null;

  const currentSeconds = (localElapsedMs / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Cabecera Minimalista Pastel */}
        <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  META / Cronometrista Multi-Carril Sincronizado
                </h3>
                {isCloudEnabled ? (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>Enlace Starter (Nube)</span>
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                    <span>Modo Offline</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-500 font-medium">
                  Línea de Meta: <strong className="text-slate-800">{activeEvent?.name || '75m Planos'}</strong>
                </span>
                {heats && heats.length > 0 && (
                  <div className="flex items-center space-x-1.5 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Serie:</span>
                    <select
                      value={selectedHeatIndex}
                      disabled={isRaceRunning}
                      onChange={(e) => {
                        handleReset();
                        if (onSelectHeatIndex) onSelectHeatIndex(Number(e.target.value));
                      }}
                      className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-md px-1.5 py-0.5 outline-none cursor-pointer focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
                    >
                      {heats.map((h, idx) => (
                        <option key={idx} value={idx}>
                          {h.name || `Serie ${idx + 1}`} ({h.lanes?.length || 0} corredores)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Selector de Modo: Todos vs Mi Carril */}
            <div className="hidden sm:flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Todos</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
                  viewMode === 'single'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>Mi Carril</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Estado y Selector de Carriles Flexible (2 a 8 Carriles) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Indicador de Estado */}
          <div className="flex items-center space-x-2">
            {isRaceRunning ? (
              <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>¡CARRERA EN CURSO! Tiempo: {currentSeconds} s</span>
              </span>
            ) : isCloudEnabled && activeRaceSession?.status === 'marks' ? (
              <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Starter: ¡A sus marcas!</span>
              </span>
            ) : isCloudEnabled && activeRaceSession?.status === 'ready' ? (
              <span className="bg-orange-50 text-orange-950 border border-orange-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span>Starter: ¡Listos para el disparo!</span>
              </span>
            ) : isCloudEnabled && activeRaceSession?.status === 'false_start' ? (
              <span className="bg-rose-50 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Salida en Falso detectada</span>
              </span>
            ) : !isCloudEnabled ? (
              <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Modo Offline: Usa "Disparo Local Meta" para iniciar</span>
              </span>
            ) : (
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-xl font-medium flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Esperando disparo del Juez de Salida...</span>
                </span>
                {!showEmergencyTrigger ? (
                  <button
                    type="button"
                    onClick={() => setShowEmergencyTrigger(true)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 underline transition-colors"
                    title="Activar únicamente si el celular del starter se quedó sin pila o falló en pista"
                  >
                    ¿Starter sin señal? Respaldo local
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                    Respaldo manual habilitado
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Selector de 2 a 8 Carriles y Disparo Local */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Botones de 2 a 8 carriles */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold px-1.5">Carriles:</span>
              {LANE_OPTIONS.map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isRaceRunning}
                  onClick={() => handleLaneCountChange(num)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    currentLanesCount === num
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  } disabled:opacity-50`}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Disparo Local en Meta: Solo en Modo Offline O si se activó explícitamente el respaldo por falla del Starter */}
            {!isRaceRunning ? (
              (!isCloudEnabled || showEmergencyTrigger) && (
                <button
                  type="button"
                  onClick={handleLocalStart}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-2xs transition-colors animate-in fade-in"
                  title={!isCloudEnabled ? "Iniciar cronómetros desde meta (Modo Offline)" : "Iniciar cronómetros desde meta (Respaldo por falla del Starter)"}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>{!isCloudEnabled ? "Disparo Local Meta" : "Disparo Respaldo"}</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleStopAllLanes}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-2xs transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>Parar Todos</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="p-1 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              title="Reiniciar todo a cero"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {viewMode === 'all' ? (
            /* Vista 1: Cuadrícula Pastel con los Carriles Seleccionados (2 a 8 Carriles) */
            <div className={`grid gap-3 ${
              currentLanesCount <= 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
                : currentLanesCount <= 4
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                : currentLanesCount <= 6
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
            }`}>
              {lanesArray.map((laneNum) => {
                const isStopped = laneStatus[laneNum] === 'stopped';
                const recordedMs = laneTimes[laneNum];
                const displayTime = isStopped
                  ? formatTrackTime(recordedMs / 1000)
                  : isRaceRunning
                  ? `${currentSeconds} s`
                  : '--.-- s';

                const pastelTheme = LANE_PASTEL_THEMES[laneNum] || LANE_PASTEL_THEMES[1];
                const currentAthleteId = laneAssignments[laneNum] || '';
                const athlete = candidateAthletes.find(a => a.id === currentAthleteId) || null;

                // Verificar si es el asignado automáticamente por la serie
                const autoAthlete = (activeHeat.lanes || []).find(a => Number(a.assignedLane) === laneNum) || (activeHeat.lanes || [])[laneNum - 1];
                const isAutoAssigned = autoAthlete && athlete && autoAthlete.id === athlete.id;

                return (
                  <div
                    key={laneNum}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all shadow-2xs ${
                      isStopped
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200/80'
                        : pastelTheme.card
                    }`}
                  >
                    <div>
                      {/* Cabecera del Carril Pastel */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70 mb-2">
                        <span className={`font-black text-xs px-2 py-0.5 rounded-lg border ${
                          isStopped
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : pastelTheme.badge
                        }`}>
                          Carril {laneNum}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          #{athlete?.bibNumber || '--'}
                        </span>
                      </div>

                      {/* Selector de Corredor (Automático + Manual) */}
                      <div className="mb-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>Corredor:</span>
                          </span>
                          {athlete ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              isAutoAssigned
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {isAutoAssigned ? 'Automático' : 'Manual'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              Vacío
                            </span>
                          )}
                        </div>

                        <select
                          value={currentAthleteId}
                          disabled={isRaceRunning}
                          onChange={(e) => handleReassignRunner(laneNum, e.target.value)}
                          className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-1 focus:ring-rose-400 focus:border-rose-400 truncate outline-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                          title={athlete ? `${athlete.fullName} (${athlete.schoolName || 'Escuela'})` : 'Seleccionar corredor'}
                        >
                          <option value="">-- Sin corredor / Vacío --</option>
                          {candidateAthletes.map(ath => {
                            const isHeatDefault = autoAthlete?.id === ath.id;
                            return (
                              <option key={ath.id} value={ath.id}>
                                #{ath.bibNumber || '--'} {ath.fullName} {isHeatDefault ? '(Serie)' : ''}
                              </option>
                            );
                          })}
                        </select>

                        <p className="text-[10px] text-slate-500 truncate px-0.5" title={athlete?.schoolName || 'Escuela'}>
                          {athlete ? (athlete.schoolName || 'Escuela') : 'Carril sin corredor asignado'}
                        </p>
                      </div>

                      {/* Display del Tiempo */}
                      <div className="text-center my-2 bg-white rounded-xl py-2.5 border border-slate-200/90 shadow-2xs">
                        <span className={`font-mono font-black text-2xl sm:text-3xl tracking-tight ${
                          isStopped ? 'text-emerald-700' : isRaceRunning ? 'text-slate-900' : 'text-slate-300'
                        }`}>
                          {displayTime}
                        </span>
                      </div>
                    </div>

                    {/* Botón de Parar Meta Táctil */}
                    <div className="pt-2">
                      {!isStopped ? (
                        <button
                          type="button"
                          disabled={!isRaceRunning}
                          onPointerDown={(e) => handleStopLane(laneNum, e)}
                          className={`w-full py-3 px-2 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 font-black text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-1.5 select-none touch-manipulation cursor-pointer ${
                            pastelTheme.button
                          }`}
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>PARAR META</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <span className="flex-1 py-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg text-center flex items-center justify-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Registrado</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResumeLane(laneNum)}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs rounded-lg transition-colors"
                            title="Reanudar carril si se pulsó por error"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Vista 2: Modo Juez Individual (Mi Carril) Minimalista Pastel para Celular */
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Tu carril asignado:</span>
                  <select
                    value={selectedSingleLane}
                    onChange={(e) => setSelectedSingleLane(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                  >
                    {lanesArray.map(num => {
                      const ath = candidateAthletes.find(a => a.id === laneAssignments[num]);
                      return (
                        <option key={num} value={num}>
                          Carril {num} {ath ? `— ${ath.fullName}` : '(Vacío)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selector de Corredor Manual / Automático para este carril */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">Corredor:</span>
                  <select
                    value={laneAssignments[selectedSingleLane] || ''}
                    disabled={isRaceRunning}
                    onChange={(e) => handleReassignRunner(selectedSingleLane, e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-2 py-1 text-xs font-medium text-slate-900 outline-none truncate disabled:bg-slate-100"
                  >
                    <option value="">-- Sin corredor / Vacío --</option>
                    {candidateAthletes.map(ath => (
                      <option key={ath.id} value={ath.id}>
                        #{ath.bibNumber || '--'} {ath.fullName} ({ath.schoolName || 'Escuela'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const laneNum = selectedSingleLane;
                const isStopped = laneStatus[laneNum] === 'stopped';
                const recordedMs = laneTimes[laneNum];
                const displayTime = isStopped
                  ? formatTrackTime(recordedMs / 1000)
                  : isRaceRunning
                  ? `${currentSeconds} s`
                  : '--.-- s';

                const pastelTheme = LANE_PASTEL_THEMES[laneNum] || LANE_PASTEL_THEMES[1];
                const ath = candidateAthletes.find(a => a.id === laneAssignments[laneNum]);

                return (
                  <div className={`border-2 rounded-3xl p-6 text-center space-y-4 shadow-sm transition-all ${
                    isStopped
                      ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200'
                      : pastelTheme.card
                  }`}>
                    <span className={`inline-block font-black text-xs px-3 py-1 rounded-xl border ${
                      isStopped ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : pastelTheme.badge
                    }`}>
                      CARRIL {laneNum}
                    </span>

                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">
                        {ath ? ath.fullName : 'Sin Corredor Asignado'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {ath ? `${ath.schoolName || 'Escuela'} • Dorsal #${ath.bibNumber || '--'}` : 'Selecciona un corredor arriba para asignar este carril'}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl py-6 font-mono font-black text-5xl tracking-tight shadow-inner">
                      <span className={isStopped ? 'text-emerald-700' : isRaceRunning ? 'text-slate-900' : 'text-slate-300'}>
                        {displayTime}
                      </span>
                    </div>

                    {!isStopped ? (
                      <button
                        type="button"
                        disabled={!isRaceRunning}
                        onPointerDown={(e) => handleStopLane(laneNum, e)}
                        className={`w-full py-6 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 font-black text-xl rounded-2xl shadow-md transition-all select-none touch-manipulation cursor-pointer ${
                          pastelTheme.button
                        }`}
                      >
                        🛑 ¡PARAR META!
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center justify-center space-x-1.5 text-sm">
                          <Check className="w-5 h-5 text-emerald-600" />
                          <span>Tiempo capturado con éxito</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResumeLane(laneNum)}
                          className="text-xs text-slate-600 hover:text-slate-900 underline"
                        >
                          ¿Equivocación? Reanudar cronómetro
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Pie con Acciones */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>Tiempos registrados: </span>
            <strong className="text-slate-900 font-bold">
              {Object.keys(laneTimes).length} de {currentLanesCount} carriles
            </strong>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleApplyToControlDesk}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Guardar y Enviar a Mesa de Control</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
