import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Check,
  X,
  Timer,
  Flag,
  Search,
  Lock,
  Unlock,
  ArrowLeftRight,
  UserCheck,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatTrackTime } from '../utils/timeFormatter';

/**
 * Cronómetro Digital Oficial de Pista con Cero Latencia y Registro Individual (1 Corredor)
 * - Cero retardo: Captura síncrona en pointerdown usando performance.now()
 * - Regla estricta: Solo 1 corredor por cronómetro para evitar confusiones en mesa técnica
 * - Reasignación rápida: Permite cambiar al competidor en cualquier momento si hubo equivocación
 * - Buscador en vivo: Filtra competidores por nombre, número de dorsal, carril o escuela
 * - Control de acceso: Protegido con PIN de Mesa de Control para captura oficial
 */
export default function DigitalStopwatchModal({
  isOpen,
  onClose,
  lanes = [],
  allAthletes = [],
  initialAthleteId = null,
  onApplySingleTime,
  onApplyTimes,
  isAdmin = false,
  onOpenAdminLogin,
  activeHeatName = 'Serie 1'
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedAthleteId, setSelectedAthleteId] = useState(initialAthleteId || null);
  const [searchTerm, setSearchTerm] = useState('');

  // Refs de ultra alta precisión para eliminar retardo de reloj
  const startTimeRef = useRef(0);
  const elapsedMsRef = useRef(0);
  const isRunningRef = useRef(false);
  const rafRef = useRef(null);

  // Sincronizar competidor objetivo al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (initialAthleteId) {
        setSelectedAthleteId(initialAthleteId);
      } else if (lanes.length === 1) {
        setSelectedAthleteId(lanes[0].id);
      }
      setSearchTerm('');
    }
  }, [isOpen, initialAthleteId, lanes]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Función síncrona inmediata para Iniciar
  const startTimer = useCallback(() => {
    const startTimestamp = performance.now();
    startTimeRef.current = startTimestamp - elapsedMsRef.current;
    isRunningRef.current = true;
    setIsRunning(true);

    const tick = () => {
      if (!isRunningRef.current) return;
      const now = performance.now();
      const currentElapsed = now - startTimeRef.current;
      elapsedMsRef.current = currentElapsed;
      setElapsedMs(currentElapsed);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Función síncrona inmediata para Parar: CONGELA EL TIEMPO EN EL MICROSEGUNDO EXACTO DEL TOQUE
  const stopTimer = useCallback(() => {
    const stopTimestamp = performance.now();
    isRunningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const finalElapsed = Math.max(0, stopTimestamp - startTimeRef.current);
    elapsedMsRef.current = finalElapsed;
    setElapsedMs(finalElapsed);
    setIsRunning(false);
  }, []);

  // Manejador ultra rápido por pointerdown para suprimir los 300ms de retraso táctil
  const handleStartStop = useCallback((e) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    if (isRunningRef.current) {
      stopTimer();
    } else {
      startTimer();
    }
  }, [startTimer, stopTimer]);

  const handleReset = useCallback((e) => {
    if (e && e.cancelable) e.preventDefault();
    isRunningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    elapsedMsRef.current = 0;
    startTimeRef.current = 0;
    setElapsedMs(0);
    setIsRunning(false);
  }, []);

  // Atajo de teclado: Barra espaciadora para Iniciar/Parar al vuelo
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleStartStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleStartStop]);

  // Colección de competidores disponibles
  const candidateAthletes = useMemo(() => {
    const pool = (lanes && lanes.length > 0) ? lanes : allAthletes;
    if (searchTerm.trim() && allAthletes && allAthletes.length > 0) {
      const mergedMap = new Map();
      pool.forEach(a => mergedMap.set(a.id, a));
      allAthletes.forEach(a => {
        if (!mergedMap.has(a.id)) {
          mergedMap.set(a.id, a);
        }
      });
      return Array.from(mergedMap.values());
    }
    return pool;
  }, [lanes, allAthletes, searchTerm]);

  // Filtrado reactivo en vivo por buscador
  const filteredAthletes = useMemo(() => {
    if (!searchTerm.trim()) return candidateAthletes;
    const term = searchTerm.toLowerCase().trim();
    return candidateAthletes.filter(ath =>
      (ath.fullName && ath.fullName.toLowerCase().includes(term)) ||
      (ath.bibNumber && String(ath.bibNumber).includes(term)) ||
      (ath.assignedLane && String(ath.assignedLane) === term) ||
      (ath.schoolName && ath.schoolName.toLowerCase().includes(term))
    );
  }, [candidateAthletes, searchTerm]);

  // Competidor actualmente seleccionado (UN SOLO CORREDOR)
  const selectedAthlete = useMemo(() => {
    if (!selectedAthleteId) return null;
    return (
      candidateAthletes.find(a => a.id === selectedAthleteId) ||
      allAthletes.find(a => a.id === selectedAthleteId) ||
      null
    );
  }, [selectedAthleteId, candidateAthletes, allAthletes]);

  // Tiempo detenido en segundos
  const finalTimeSeconds = Number((elapsedMs / 1000).toFixed(2));

  // Formato visual del tiempo
  const displayTime = useMemo(() => {
    const totalSecs = elapsedMs / 1000;
    if (totalSecs < 60) {
      return {
        number: totalSecs.toFixed(2),
        unit: 's',
        readable: `${totalSecs.toFixed(2)} s`
      };
    }
    const mins = Math.floor(totalSecs / 60);
    const secs = (totalSecs % 60).toFixed(2);
    const paddedSecs = Number(secs) < 10 ? `0${secs}` : secs;
    return {
      number: `${mins}:${paddedSecs}`,
      unit: 'min',
      readable: `${mins}:${paddedSecs}`
    };
  }, [elapsedMs]);

  // Aplicar tiempo oficial al corredor seleccionado
  const handleApplyTimeToAthlete = () => {
    if (!isAdmin) {
      if (onOpenAdminLogin) onOpenAdminLogin();
      return;
    }

    if (!selectedAthleteId) {
      alert('Por favor selecciona a qué corredor pertenece este tiempo.');
      return;
    }

    if (elapsedMs === 0) {
      alert('El cronómetro está en cero. Registra un tiempo antes de aplicar.');
      return;
    }

    if (onApplySingleTime) {
      onApplySingleTime({
        athleteId: selectedAthleteId,
        laneNum: selectedAthlete?.assignedLane,
        timeSeconds: finalTimeSeconds
      });
    }

    if (onApplyTimes && selectedAthlete?.assignedLane) {
      onApplyTimes({
        [selectedAthlete.assignedLane]: finalTimeSeconds
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="font-bold text-sm">Cronómetro Oficial de Pista</h3>
              <p className="text-[10px] text-slate-400">
                1 Cronómetro = 1 Corredor • Cero Retardo ({activeHeatName})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner de Permisos de Seguridad (Mesa de Control) */}
        {!isAdmin && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Modo Consulta: Se requiere contraseña de Mesa para guardar tiempos oficiales.</span>
            </div>
            {onOpenAdminLogin && (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors"
              >
                Desbloquear
              </button>
            )}
          </div>
        )}

        {/* Pantalla del Cronómetro de Alta Precisión */}
        <div className="p-5 sm:p-6 bg-slate-50 flex flex-col items-center justify-center border-b border-slate-200 shrink-0">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
            Tiempo Oficial de Meta
          </span>

          <div className="text-5xl sm:text-6xl font-black font-athletic tracking-wide text-slate-900 select-none tabular-nums my-1">
            {displayTime.number} <span className="text-xl sm:text-2xl text-slate-400 font-normal">{displayTime.unit}</span>
          </div>

          <div className="flex items-center space-x-3 mt-3 w-full max-w-sm justify-center">
            {/* Botón Principal Disparo / Meta con Cero Retardo */}
            <button
              type="button"
              onPointerDown={handleStartStop}
              style={{ touchAction: 'manipulation' }}
              className={`flex-1 flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white ring-4 ring-emerald-100'
              }`}
            >
              {isRunning ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? 'PARAR META (DETENER)' : 'Disparo de Salida / Iniciar'}</span>
            </button>

            {/* Botón Reiniciar */}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1 px-3.5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              title="Reiniciar cronómetro a 00.00"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400 mt-2">
            💡 Sin retardo: Se congela en el microsegundo exacto de presionar (o presiona Barra Espaciadora).
          </span>
        </div>

        {/* Sección de Selección y Reasignación de Competidor (1 ÚNICO CORREDOR) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
          {/* Tarjeta del Corredor Asignado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Flag className="w-3.5 h-3.5 text-rose-500" />
                <span>Corredor Asignado a este Cronómetro (Máximo 1):</span>
              </label>
              {selectedAthlete && (
                <button
                  type="button"
                  onClick={() => setSelectedAthleteId(null)}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1 transition-colors"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Cambiar competidor</span>
                </button>
              )}
            </div>

            {selectedAthlete ? (
              <div className="p-3 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-athletic font-bold flex items-center justify-center text-sm shrink-0">
                    {selectedAthlete.assignedLane ? `C${selectedAthlete.assignedLane}` : 'S/C'}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {selectedAthlete.fullName}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white border border-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded shrink-0">
                        #{selectedAthlete.bibNumber || 'S/N'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedAthlete.schoolName || selectedAthlete.schoolShort || 'Escuela Primaria'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded-full">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>Asignado</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAthleteId(null)}
                    className="p-1.5 hover:bg-emerald-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                    title="Deseleccionar o cambiar competidor"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Ningún corredor seleccionado:</strong> Elige un corredor en la lista de abajo para asignarle el tiempo oficial.
                </span>
              </div>
            )}
          </div>

          {/* Buscador de Competidores para Cronómetro */}
          <div>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, número de dorsal (#), carril o escuela..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mb-1.5">
              <span>Toca un competidor para asignarlo a este cronómetro:</span>
              <span>{filteredAthletes.length} disponibles</span>
            </div>

            {/* Lista de Atletas Disponibles */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredAthletes.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No se encontró ningún competidor con "{searchTerm}".
                </div>
              ) : (
                filteredAthletes.map((ath) => {
                  const isSelected = selectedAthleteId === ath.id;

                  return (
                    <button
                      key={ath.id}
                      type="button"
                      onClick={() => setSelectedAthleteId(ath.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-bold ring-2 ring-emerald-200'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span
                          className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ath.assignedLane ? `C${ath.assignedLane}` : '-'}
                        </span>
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="text-xs truncate">{ath.fullName}</span>
                            <span className="text-[10px] font-mono text-slate-500 font-normal">
                              #{ath.bibNumber || 'S/N'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ath.schoolName || ath.schoolShort || 'Escuela Primaria'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <div className="flex items-center space-x-1 text-emerald-700 text-[11px] font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Seleccionado</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold">
                            Elegir
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Pie con Acciones */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="truncate max-w-[200px] sm:max-w-xs">
            {selectedAthlete ? (
              <span className="text-xs text-slate-700 font-medium truncate block">
                Asignando a: <strong className="text-slate-900">{selectedAthlete.fullName}</strong>
              </span>
            ) : (
              <span className="text-xs text-amber-700 font-medium">
                Sin competidor seleccionado
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleApplyTimeToAthlete}
              disabled={elapsedMs === 0 || !selectedAthleteId}
              className={`px-4 py-2 font-bold rounded-xl text-xs shadow-xs flex items-center space-x-1.5 transition-all ${
                elapsedMs === 0 || !selectedAthleteId
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : !isAdmin
                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {!isAdmin ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Desbloquear para Guardar</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Guardar Tiempo ({displayTime.readable})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
