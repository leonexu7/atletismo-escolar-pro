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
  UserCheck,
  AlertTriangle,
  Zap,
  Save,
  Clock,
  Sparkles,
  Shield,
  Layers,
  Smartphone,
  SlidersHorizontal
} from 'lucide-react';
import { formatTrackTime } from '../utils/timeFormatter';
import { playFalseStartSound, playStarterGunSound } from '../utils/audioStarter';

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

        // Inicializar estado de todos los carriles como 'running'
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

    // Convertir de milisegundos a segundos con 2 decimales
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

  if (!isOpen) return null;

  const currentSeconds = (localElapsedMs / 1000).toFixed(2);
  const singleLaneAthlete = displayedLanes.find(a => a.assignedLane === selectedSingleLane) || displayedLanes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Cabecera */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Cronometraje Multi-Carril Sincronizado (Meta)
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Enlace con Starter</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Línea de Meta: {activeEvent?.name || '75m Planos'} • {activeHeat.name || 'Serie 1'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Selector de Modo: Todos los carriles vs Mi Carril */}
            <div className="hidden sm:flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
                  viewMode === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todos</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
                  viewMode === 'single' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mi Carril</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Estado de Salida y Controles Superiores */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Indicador de Estado del Starter */}
          <div className="flex items-center space-x-2">
            {isRaceRunning ? (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>¡CARRERA EN CURSO! Tiempo Oficial: {currentSeconds} s</span>
              </span>
            ) : activeRaceSession?.status === 'marks' ? (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Starter: ¡A sus marcas!</span>
              </span>
            ) : activeRaceSession?.status === 'ready' ? (
              <span className="bg-orange-100 text-orange-800 border border-orange-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                <span>Starter: ¡Listos para el disparo!</span>
              </span>
            ) : activeRaceSession?.status === 'false_start' ? (
              <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Salida en Falso detectada</span>
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl font-medium flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Esperando disparo del Juez de Salida...</span>
              </span>
            )}
          </div>

          {/* Opciones de Carriles (4, 6, 8) y Disparo Local */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-0.5">
              <span className="text-[10px] text-slate-500 font-bold px-1.5">Carriles:</span>
              {[4, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isRaceRunning}
                  onClick={() => setCurrentLanesCount(num)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors ${
                    currentLanesCount === num
                      ? 'bg-slate-900 text-white'
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
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-2xs transition-colors"
                title="Iniciar cronómetros desde meta (Respaldo local si no hay internet)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Disparo Local Meta</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopAllLanes}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-2xs transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
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
            /* Vista 1: Cuadrícula con Todos los Carriles (4, 6 u 8) */
            <div className={`grid gap-3 ${
              currentLanesCount === 4
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
                : currentLanesCount === 6
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

                return (
                  <div
                    key={athlete.id}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all shadow-xs ${
                      isStopped
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                        : isRaceRunning
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Cabecera del Carril */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 mb-2">
                        <span className="font-black text-xs px-2 py-0.5 rounded-lg bg-slate-900 text-amber-400">
                          Carril {laneNum}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          Dorsal #{athlete.bibNumber || '--'}
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
                      <div className="text-center my-2 bg-white rounded-xl py-2 border border-slate-200 shadow-inner">
                        <span className={`font-mono font-black text-2xl sm:text-3xl tracking-tight ${
                          isStopped ? 'text-emerald-700' : isRaceRunning ? 'text-amber-600' : 'text-slate-400'
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
                          className="w-full py-3 px-2 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 select-none touch-manipulation cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
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
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors"
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
            /* Vista 2: Modo Juez Individual (Mi Carril) en Pantalla Completa para Celular */
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

                return (
                  <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 text-center space-y-4 shadow-md">
                    <span className="inline-block bg-slate-900 text-amber-400 font-black text-sm px-3 py-1 rounded-xl">
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

                    <div className="bg-slate-900 text-white rounded-2xl py-6 font-mono font-black text-5xl tracking-tight">
                      <span className={isStopped ? 'text-emerald-400' : isRaceRunning ? 'text-amber-400' : 'text-slate-500'}>
                        {displayTime}
                      </span>
                    </div>

                    {!isStopped ? (
                      <button
                        type="button"
                        disabled={!isRaceRunning}
                        onPointerDown={(e) => handleStopLane(laneNum, e)}
                        className="w-full py-6 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xl rounded-2xl shadow-lg shadow-rose-900/30 transition-all select-none touch-manipulation cursor-pointer"
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
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
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
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
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
