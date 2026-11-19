import React, { useState } from 'react';
import { Cloud, Wifi, X, Check, Copy, RefreshCw, Smartphone, Radio } from 'lucide-react';
import { syncFullTournamentToCloud } from '../services/cloudSync';

export default function CloudSyncModal({
  isOpen,
  onClose,
  cloudSession,
  onUpdateCloudSession,
  fullState
}) {
  const [roomCode, setRoomCode] = useState(cloudSession?.roomCode || 'ATLETISMO-2026');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleToggleCloud = () => {
    const updated = {
      ...cloudSession,
      enabled: !cloudSession?.enabled,
      roomCode: roomCode.trim().toUpperCase()
    };
    onUpdateCloudSession(updated);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await syncFullTournamentToCloud(roomCode.trim().toUpperCase(), fullState);
      alert('¡Sincronización completa! Las marcas y atletas ya están en la nube.');
    } catch (err) {
      alert(`Error al sincronizar: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-emerald-400">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Sincronización en Tiempo Real</h3>
              <p className="text-[11px] text-slate-300">Conecta pistas, campo y mesa central</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cloudSession?.enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}>
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {cloudSession?.enabled ? 'En Vivo con la Nube' : 'Modo Offline (Local)'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {cloudSession?.enabled ? 'Transmisión multi-dispositivo activa.' : 'Datos guardados solo en este equipo.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleCloud}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                cloudSession?.enabled
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {cloudSession?.enabled ? 'Desconectar' : 'Conectar'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Código de Sala del Torneo:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ATLETISMO-2026"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold tracking-wider outline-none focus:bg-white focus:ring-2 focus:ring-rose-400"
              />
              <button
                onClick={() => {
                  onUpdateCloudSession({ ...cloudSession, roomCode: roomCode.trim().toUpperCase() });
                  alert('Código actualizado.');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200"
              >
                Aplicar
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
              <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              <span>Link para celulares de jueces:</span>
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-white text-slate-600 text-xs font-mono rounded-lg px-2 py-1.5 border border-slate-200 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Listo' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <span className="text-[11px] text-slate-500">¿Actualizaste el padrón?</span>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Publicar a Nube'}</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
