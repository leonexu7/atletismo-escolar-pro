import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, X, Timer, Flag } from 'lucide-react';
import { formatTrackTime } from '../utils/timeFormatter';

export default function DigitalStopwatchModal({
  isOpen,
  onClose,
  lanes = [],
  onApplyTimes
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recordedSplits, setRecordedSplits] = useState({});
  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedMs;
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 10);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  if (!isOpen) return null;

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
    setRecordedSplits({});
  };

  const handleRecordLane = (laneNum) => {
    if (elapsedMs === 0) return;
    const timeInSeconds = Number((elapsedMs / 1000).toFixed(2));
    setRecordedSplits(prev => ({
      ...prev,
      [laneNum]: timeInSeconds
    }));
  };

  const handleSaveAndApply = () => {
    if (onApplyTimes) {
      onApplyTimes(recordedSplits);
    }
    onClose();
  };

  const currentSeconds = (elapsedMs / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm">Cronómetro Digital Multipista</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pantalla del Cronómetro */}
        <div className="p-6 bg-slate-50 flex flex-col items-center justify-center border-b border-slate-200">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Tiempo Oficial</span>
          <div className="text-5xl font-black font-athletic tracking-wide text-slate-900">
            {currentSeconds} <span className="text-xl text-slate-400 font-normal">s</span>
          </div>

          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={handleStartPause}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-colors shadow-xs ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRunning ? 'Pausar' : 'Disparo de Salida'}</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Captura Rápida por Carril */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-60">
          <h4 className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center space-x-1.5">
            <Flag className="w-3.5 h-3.5 text-rose-500" />
            <span>Toca el carril al cruzar la meta:</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {lanes.map((lane, idx) => {
              const laneNum = lane.assignedLane || idx + 1;
              const hasSplit = recordedSplits[laneNum] !== undefined;

              return (
                <button
                  key={laneNum}
                  onClick={() => handleRecordLane(laneNum)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    hasSplit
                      ? 'bg-emerald-50 border-emerald-300 text-slate-900 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700">
                      Carril {laneNum}
                    </span>
                    {hasSplit && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-xs truncate font-medium">{lane.fullName || `Atleta ${laneNum}`}</p>
                  <div className="mt-1 font-athletic text-sm font-bold text-slate-900">
                    {hasSplit ? `${recordedSplits[laneNum]} s` : 'Tocar Meta'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pie */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {Object.keys(recordedSplits).length} de {lanes.length} carriles
          </span>
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800">
              Cancelar
            </button>
            <button
              onClick={handleSaveAndApply}
              disabled={Object.keys(recordedSplits).length === 0}
              className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Aplicar Tiempos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
