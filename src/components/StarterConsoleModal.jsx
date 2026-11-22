import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  AlertTriangle,
  Play,
  RotateCcw,
  Flag,
  Flame,
  Radio,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles
} from 'lucide-react';
import { playStarterGunSound, playFalseStartSound, playAttentionBeep } from '../utils/audioStarter';
import { broadcastRaceStart, broadcastRaceReset, broadcastRacePreparation } from '../services/cloudSync';
import { formatTrackTime } from '../utils/timeFormatter';

export default function StarterConsoleModal({
  isOpen,
  onClose,
  activeEvent,
  heats = [],
  selectedHeatIndex = 0,
  onSelectHeatIndex,
  lanesCount = 6,
  onUpdateLanesCount,
  roomCode = 'ATLETISMO-2026',
  activeRaceSession = null
}) {
  const [raceStage, setRaceStage] = useState('idle'); // 'idle' | 'marks' | 'ready' | 'running' | 'false_start'
  const [elapsedMs, setElapsedMs] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentLanesCount, setCurrentLanesCount] = useState(lanesCount || 6);

  const startTimestampRef = useRef(null);
  const rafRef = useRef(null);

  const activeHeat = heats[selectedHeatIndex] || heats[0] || { lanes: [] };
  const displayedLanes = (activeHeat.lanes || []).slice(0, currentLanesCount);

  // Sincronizar estado si viene de la nube o cambio externo
  useEffect(() => {
    if (activeRaceSession && activeRaceSession.status) {
      if (activeRaceSession.status === 'running' && activeRaceSession.startTimestamp) {
        startTimestampRef.current = activeRaceSession.startTimestamp;
        setRaceStage('running');
      } else if (activeRaceSession.status === 'false_start') {
        setRaceStage('false_start');
      }
    }
  }, [activeRaceSession]);

  // Bucle de animación del cronómetro del starter
  useEffect(() => {
    if (raceStage === 'running' && startTimestampRef.current) {
      const tick = () => {
        const now = Date.now();
        const diff = Math.max(0, now - startTimestampRef.current);
        setElapsedMs(diff);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [raceStage]);

  // 1. Comando: "¡A sus marcas!"
  const handleStageMarks = () => {
    setRaceStage('marks');
    if (soundEnabled) playAttentionBeep();
    broadcastRacePreparation(roomCode, 'marks', {
      eventId: activeEvent?.id,
      heatIndex: selectedHeatIndex,
      heatName: activeHeat.name,
      lanesCount: currentLanesCount
    });
  };

  // 2. Comando: "¡Listos!"
  const handleStageReady = () => {
    setRaceStage('ready');
    if (soundEnabled) playAttentionBeep();
    broadcastRacePreparation(roomCode, 'ready', {
      eventId: activeEvent?.id,
      heatIndex: selectedHeatIndex,
      heatName: activeHeat.name,
      lanesCount: currentLanesCount
    });
  };

  // 3. Comando: "¡DISPARO! (SALIDA)"
  const handleFireGun = () => {
    const startTs = Date.now();
    startTimestampRef.current = startTs;
    setElapsedMs(0);
    setRaceStage('running');

    if (soundEnabled) {
      playStarterGunSound();
    }

    // Transmitir a la nube en tiempo real para todos los cronometristas en meta
    broadcastRaceStart(roomCode, {
      startTimestamp: startTs,
      eventId: activeEvent?.id,
      heatIndex: selectedHeatIndex,
      heatName: activeHeat.name,
      lanesCount: currentLanesCount,
      starterName: 'Juez de Salida Oficial'
    });
  };

  // 4. Salida en Falso / Anular Carrera
  const handleFalseStart = () => {
    setRaceStage('false_start');
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimestampRef.current = null;

    if (soundEnabled) {
      playFalseStartSound();
    }

    broadcastRaceReset(roomCode, 'false_start');
  };

  // 5. Reiniciar a posición inicial
  const handleReset = () => {
    setRaceStage('idle');
    setElapsedMs(0);
    startTimestampRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    broadcastRaceReset(roomCode, 'reset');
  };

  if (!isOpen) return null;

  const secondsRunning = (elapsedMs / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado del Starter */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-rose-950/60 to-slate-900 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Consola del Juez de Salida (Starter)
                </h3>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                  <span>En Vivo Nube</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pistola acústica oficial sincronizada con la línea de meta
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className={`p-2 rounded-xl border text-xs flex items-center space-x-1 transition-colors ${
                soundEnabled
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Sonido de disparo activado' : 'Silencio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo Principal */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Controles de Prueba, Serie y Carriles */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Prueba:</label>
              <span className="font-bold text-white block truncate text-xs">
                {activeEvent?.name || '75m Planos'}
              </span>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Serie / Heat:</label>
              <select
                value={selectedHeatIndex}
                onChange={(e) => {
                  handleReset();
                  if (onSelectHeatIndex) onSelectHeatIndex(Number(e.target.value));
                }}
                disabled={raceStage === 'running'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold outline-none focus:ring-1 focus:ring-rose-400 disabled:opacity-50"
              >
                {heats.map((h, idx) => (
                  <option key={idx} value={idx}>
                    {h.name || `Serie ${idx + 1}`} ({h.lanes?.length || 0} corredores)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">Número de Carriles:</label>
              <div className="grid grid-cols-3 gap-1">
                {[4, 6, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={raceStage === 'running'}
                    onClick={() => {
                      setCurrentLanesCount(num);
                      if (onUpdateLanesCount) onUpdateLanesCount(num);
                    }}
                    className={`py-1 rounded-xl font-bold text-xs border transition-colors ${
                      currentLanesCount === num
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    } disabled:opacity-50`}
                  >
                    {num} C
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Marcador Central del Starter */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
            {/* Indicador de Estado */}
            <div className="mb-2">
              {raceStage === 'idle' && (
                <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>En Posición de Espera</span>
                </span>
              )}
              {raceStage === 'marks' && (
                <span className="bg-amber-950 text-amber-300 border border-amber-600/50 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>¡A SUS MARCAS!</span>
                </span>
              )}
              {raceStage === 'ready' && (
                <span className="bg-orange-950 text-orange-300 border border-orange-600/60 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
                  <span>¡LISTOS PARA EL DISPARO!</span>
                </span>
              )}
              {raceStage === 'running' && (
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-600/60 px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>¡CARRERA EN CURSO!</span>
                </span>
              )}
              {raceStage === 'false_start' && (
                <span className="bg-rose-950 text-rose-300 border border-rose-600 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 animate-bounce">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>¡SALIDA EN FALSO ANULADA!</span>
                </span>
              )}
            </div>

            {/* Cronómetro Gigante */}
            <div className="font-mono text-5xl sm:text-7xl font-black tracking-tight text-white my-3 select-none">
              {raceStage === 'running' ? (
                <span className="text-emerald-400">
                  {secondsRunning} <span className="text-2xl sm:text-3xl font-light text-slate-400">s</span>
                </span>
              ) : (
                <span className="text-slate-600">
                  00.00 <span className="text-2xl sm:text-3xl font-light text-slate-700">s</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              {raceStage === 'running'
                ? 'Los cronometristas en meta están recibiendo el tiempo en tiempo real sincronizado.'
                : 'Sigue la secuencia reglamentaria de voces antes de presionar el botón de disparo.'}
            </p>
          </div>

          {/* Secuencia Oficial de Botones */}
          <div className="space-y-2.5">
            {raceStage !== 'running' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. A sus marcas */}
                <button
                  type="button"
                  onClick={handleStageMarks}
                  className={`py-3.5 px-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex flex-col items-center justify-center space-y-1 shadow-sm active:scale-95 ${
                    raceStage === 'marks'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Paso 1</span>
                  <span>1. ¡A sus marcas!</span>
                </button>

                {/* 2. Listos */}
                <button
                  type="button"
                  onClick={handleStageReady}
                  className={`py-3.5 px-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex flex-col items-center justify-center space-y-1 shadow-sm active:scale-95 ${
                    raceStage === 'ready'
                      ? 'bg-orange-500 text-slate-950 border-orange-400 ring-2 ring-orange-400/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Paso 2</span>
                  <span>2. ¡Listos!</span>
                </button>

                {/* 3. DISPARO GIGANTE */}
                <button
                  type="button"
                  onClick={handleFireGun}
                  className="py-3.5 px-3 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white border-2 border-rose-300 shadow-lg shadow-rose-900/50 flex flex-col items-center justify-center space-y-1 transition-all active:scale-95"
                >
                  <span className="text-[10px] uppercase tracking-wider text-rose-100 font-bold">Paso 3 Oficial</span>
                  <span className="flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
                    <span>¡DISPARO! (SALIDA)</span>
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                {/* Botón de Emergencia: Salida en Falso */}
                <button
                  type="button"
                  onClick={handleFalseStart}
                  className="py-4 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl border-2 border-rose-400 shadow-lg shadow-rose-950 flex items-center justify-center space-x-2 text-sm sm:text-base active:scale-95 transition-all"
                >
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                  <span>¡SALIDA EN FALSO! (ANULAR)</span>
                </button>

                {/* Botón de Reiniciar para Siguiente Serie */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-4 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 flex items-center justify-center space-x-2 text-xs sm:text-sm active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Reiniciar para Siguiente Serie</span>
                </button>
              </div>
            )}
          </div>

          {/* Grilla de Atletas en los Carriles (Verificación en Línea de Salida) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span>Corredores en los Tacos de Salida ({displayedLanes.length} carriles):</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {activeHeat.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {displayedLanes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-400 text-[11px]">
                      Carril {athlete.assignedLane}
                    </span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono text-slate-300">
                      #{athlete.bibNumber || '--'}
                    </span>
                  </div>
                  <div className="font-bold text-white truncate text-[11px]">
                    {athlete.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {athlete.schoolName || 'Escuela Primaria'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie con Estado de Sala */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Sala: <strong>{roomCode}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-medium text-xs underline underline-offset-2"
          >
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>
  );
}
