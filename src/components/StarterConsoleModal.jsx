import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  AlertTriangle,
  Play,
  RotateCcw,
  Flame,
  Radio,
  Users,
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

  // Opciones de 2 a 8 carriles según requerimiento
  const LANE_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

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

  const handleLaneCountChange = (count) => {
    const val = Math.max(2, Math.min(8, Number(count) || 6));
    setCurrentLanesCount(val);
    if (onUpdateLanesCount) onUpdateLanesCount(val);
  };

  if (!isOpen) return null;

  const secondsRunning = (elapsedMs / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado Minimalista Pastel */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Consola del Juez de Salida (Starter)
                </h3>
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                  <span>En Vivo Nube</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
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
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
              }`}
              title={soundEnabled ? 'Sonido de disparo activado' : 'Silencio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-600" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo Principal */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Controles de Prueba, Serie y Carriles Flexibles (2 a 8 Carriles) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-semibold block mb-1">Prueba de Pista:</label>
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 text-xs">
                  {activeEvent?.name || '75m Planos'}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-semibold block mb-1">Serie / Heat:</label>
                <select
                  value={selectedHeatIndex}
                  onChange={(e) => {
                    handleReset();
                    if (onSelectHeatIndex) onSelectHeatIndex(Number(e.target.value));
                  }}
                  disabled={raceStage === 'running'}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
                >
                  {heats.map((h, idx) => (
                    <option key={idx} value={idx}>
                      {h.name || `Serie ${idx + 1}`} ({h.lanes?.length || 0} corredores)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selector Flexible de 2 a 8 Carriles Minimalista */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-slate-600 font-bold">
                  Número de Carriles en Pista (2 a 8):
                </label>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                  {currentLanesCount} Carriles Activos
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-1.5">
                {LANE_OPTIONS.map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={raceStage === 'running'}
                    onClick={() => handleLaneCountChange(num)}
                    className={`flex-1 min-w-[40px] py-1.5 rounded-xl font-bold text-xs border transition-all ${
                      currentLanesCount === num
                        ? 'bg-rose-500 text-white border-rose-400 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Marcador Central Minimalista Pastel */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
            {/* Indicador de Estado */}
            <div className="mb-2">
              {raceStage === 'idle' && (
                <span className="bg-slate-200/80 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>En Posición de Espera</span>
                </span>
              )}
              {raceStage === 'marks' && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>¡A SUS MARCAS!</span>
                </span>
              )}
              {raceStage === 'ready' && (
                <span className="bg-orange-100 text-orange-950 border border-orange-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                  <span>¡LISTOS PARA EL DISPARO!</span>
                </span>
              )}
              {raceStage === 'running' && (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>¡CARRERA EN CURSO!</span>
                </span>
              )}
              {raceStage === 'false_start' && (
                <span className="bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>¡SALIDA EN FALSO ANULADA!</span>
                </span>
              )}
            </div>

            {/* Cronómetro Gigante */}
            <div className="font-mono text-5xl sm:text-7xl font-black tracking-tight my-3 select-none">
              {raceStage === 'running' ? (
                <span className="text-slate-900">
                  {secondsRunning} <span className="text-2xl sm:text-3xl font-bold text-emerald-600">s</span>
                </span>
              ) : (
                <span className="text-slate-300">
                  00.00 <span className="text-2xl sm:text-3xl font-light text-slate-300">s</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              {raceStage === 'running'
                ? 'Los cronometristas en meta están recibiendo el tiempo en tiempo real sincronizado.'
                : 'Sigue la secuencia reglamentaria de voces antes de presionar el botón de disparo.'}
            </p>
          </div>

          {/* Secuencia Oficial de Botones Minimalista Pastel */}
          <div className="space-y-2.5">
            {raceStage !== 'running' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. A sus marcas */}
                <button
                  type="button"
                  onClick={handleStageMarks}
                  className={`py-3.5 px-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex flex-col items-center justify-center space-y-1 shadow-2xs active:scale-95 ${
                    raceStage === 'marks'
                      ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-200'
                      : 'bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-amber-200'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-amber-700/80 font-semibold">Paso 1</span>
                  <span>1. ¡A sus marcas!</span>
                </button>

                {/* 2. Listos */}
                <button
                  type="button"
                  onClick={handleStageReady}
                  className={`py-3.5 px-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex flex-col items-center justify-center space-y-1 shadow-2xs active:scale-95 ${
                    raceStage === 'ready'
                      ? 'bg-orange-100 text-orange-950 border-orange-300 ring-2 ring-orange-200'
                      : 'bg-orange-50 hover:bg-orange-100/80 text-orange-900 border-orange-200'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider text-orange-700/80 font-semibold">Paso 2</span>
                  <span>2. ¡Listos!</span>
                </button>

                {/* 3. DISPARO GIGANTE */}
                <button
                  type="button"
                  onClick={handleFireGun}
                  className="py-3.5 px-3 rounded-2xl font-black text-sm sm:text-base bg-rose-500 hover:bg-rose-600 text-white border border-rose-400 shadow-sm flex flex-col items-center justify-center space-y-1 transition-all active:scale-95"
                >
                  <span className="text-[10px] uppercase tracking-wider text-rose-100 font-bold">Paso 3 Oficial</span>
                  <span className="flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-white fill-white" />
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
                  className="py-3.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-800 font-extrabold rounded-2xl border-2 border-rose-300 shadow-2xs flex items-center justify-center space-x-2 text-xs sm:text-sm active:scale-95 transition-all"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>¡SALIDA EN FALSO! (ANULAR)</span>
                </button>

                {/* Botón de Reiniciar para Siguiente Serie */}
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl border border-slate-200 flex items-center justify-center space-x-2 text-xs sm:text-sm active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>Reiniciar para Siguiente Serie</span>
                </button>
              </div>
            )}
          </div>

          {/* Grilla de Atletas en los Carriles (Verificación en Línea de Salida) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span>Corredores en los Tacos de Salida ({displayedLanes.length} carriles):</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">
                {activeHeat.name}
              </span>
            </div>

            <div className={`grid gap-2 ${
              currentLanesCount <= 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : currentLanesCount <= 6
                ? 'grid-cols-2 sm:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}>
              {displayedLanes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="bg-white border border-slate-200 rounded-xl p-2.5 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-rose-700 text-[11px] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Carril {athlete.assignedLane}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      #{athlete.bibNumber || '--'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 truncate text-[11px]">
                    {athlete.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {athlete.schoolName || 'Escuela Primaria'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie con Estado de Sala */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Sala: <strong className="text-slate-800">{roomCode}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors"
          >
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>
  );
}
