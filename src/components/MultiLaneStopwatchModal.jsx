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
  activeRaceSession = null
}) {
  const [currentLanesCount, setCurrentLanesCount] = useState(lanesCount || 6);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'single'
  const [selectedSingleLane, setSelectedSingleLane] = useState(1);
  const [isRaceRunning, setIsRaceRunning] = useState(false);
  const [laneTimes, setLaneTimes] = useState({}); // { [assignedLane]: elapsedMs }
  const [laneStatus, setLaneStatus] = useState({}); // { [assignedLane]: 'running' | 'stopped' }
  const [localElapsedMs, setLocalElapsedMs] = useState(0);

  const startTimestampRef = useRef(null);
  const isRunningRef = useRef(false);
  const rafRef = useRef(null);
  const lastActiveTimestampRef = useRef(null);

  // Lista de 2 a 8 carriles según requerimiento
  const LANE_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

  const activeHeat = heats[selectedHeatIndex] || heats[0] || { lanes: [] };
  const displayedLanes = useMemo(() => {
    return (activeHeat.lanes || []).slice(0, currentLanesCount);
  }, [activeHeat.lanes, currentLanesCount]);

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
        displayedLanes.forEach(ath => {
          initialStatus[ath.assignedLane] = 'running';
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
  }, [activeRaceSession, isOpen, displayedLanes]);

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
    displayedLanes.forEach(ath => {
      initialStatus[ath.assignedLane] = 'running';
    });
    setLaneStatus(initialStatus);
    setLaneTimes({});
  }, [displayedLanes]);

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

    displayedLanes.forEach(ath => {
      if (updatedStatus[ath.assignedLane] !== 'stopped') {
        updatedTimes[ath.assignedLane] = finalElapsed;
        updatedStatus[ath.assignedLane] = 'stopped';
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
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // 6. Guardar y Volcar tiempos a la Mesa de Control Oficial
  const handleApplyToControlDesk = () => {
    if (!isAdmin) {
      if (onOpenAdminLogin) onOpenAdminLogin();
      return;
    }

    const formattedTimesMap = {};
    Object.entries(laneTimes).forEach(([laneNum, ms]) => {
      formattedTimesMap[laneNum] = Number((ms / 1000).toFixed(2));
    });

    const recordedCount = Object.keys(formattedTimesMap).length;
    if (recordedCount === 0) {
      alert('Aún no has parado ningún carril. Registra al menos un tiempo antes de guardar.');
      return;
    }

    if (onApplyTimes) {
      onApplyTimes(formattedTimesMap);
    }
    alert(`¡Se guardaron y sincronizaron ${recordedCount} tiempos oficiales en la Mesa de Control!`);
    onClose();
  };

  const handleLaneCountChange = (count) => {
    const val = Math.max(2, Math.min(8, Number(count) || 6));
    setCurrentLanesCount(val);
  };

  if (!isOpen) return null;

  const currentSeconds = (localElapsedMs / 1000).toFixed(2);
  const singleLaneAthlete = displayedLanes.find(a => a.assignedLane === selectedSingleLane) || displayedLanes[0];

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
                  Cronometraje Multi-Carril Sincronizado (Meta)
                </h3>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>Enlace Starter</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Línea de Meta: {activeEvent?.name || '75m Planos'} • {activeHeat.name || 'Serie 1'}
              </p>
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
            ) : activeRaceSession?.status === 'marks' ? (
              <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Starter: ¡A sus marcas!</span>
              </span>
            ) : activeRaceSession?.status === 'ready' ? (
              <span className="bg-orange-50 text-orange-950 border border-orange-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span>Starter: ¡Listos para el disparo!</span>
              </span>
            ) : activeRaceSession?.status === 'false_start' ? (
              <span className="bg-rose-50 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Salida en Falso detectada</span>
              </span>
            ) : (
              <span className="bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-xl font-medium flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Esperando disparo del Juez de Salida...</span>
              </span>
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

            {/* Disparo Local en Meta (Respaldo por si no hay señal) */}
            {!isRaceRunning ? (
              <button
                type="button"
                onClick={handleLocalStart}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-2xs transition-colors"
                title="Iniciar cronómetros desde meta (Respaldo local si no hay internet)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Disparo Local Meta</span>
              </button>
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
              {displayedLanes.map((athlete) => {
                const laneNum = athlete.assignedLane;
                const isStopped = laneStatus[laneNum] === 'stopped';
                const recordedMs = laneTimes[laneNum];
                const displayTime = isStopped
                  ? formatTrackTime(recordedMs / 1000)
                  : isRaceRunning
                  ? `${currentSeconds} s`
                  : '--.-- s';

                const pastelTheme = LANE_PASTEL_THEMES[laneNum] || LANE_PASTEL_THEMES[1];

                return (
                  <div
                    key={athlete.id}
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
                          #{athlete.bibNumber || '--'}
                        </span>
                      </div>

                      {/* Datos del Corredor */}
                      <div className="mb-2">
                        <h4 className="font-bold text-xs text-slate-900 truncate" title={athlete.fullName}>
                          {athlete.fullName}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate" title={athlete.schoolName}>
                          {athlete.schoolName || 'Escuela'}
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
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Selecciona tu carril asignado:</span>
                <select
                  value={selectedSingleLane}
                  onChange={(e) => setSelectedSingleLane(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                >
                  {displayedLanes.map(ath => (
                    <option key={ath.id} value={ath.assignedLane}>
                      Carril {ath.assignedLane} — {ath.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {singleLaneAthlete && (() => {
                const laneNum = singleLaneAthlete.assignedLane;
                const isStopped = laneStatus[laneNum] === 'stopped';
                const recordedMs = laneTimes[laneNum];
                const displayTime = isStopped
                  ? formatTrackTime(recordedMs / 1000)
                  : isRaceRunning
                  ? `${currentSeconds} s`
                  : '--.-- s';

                const pastelTheme = LANE_PASTEL_THEMES[laneNum] || LANE_PASTEL_THEMES[1];

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
                        {singleLaneAthlete.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {singleLaneAthlete.schoolName} • Dorsal #{singleLaneAthlete.bibNumber || '--'}
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
              {Object.keys(laneTimes).length} de {displayedLanes.length} carriles
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
