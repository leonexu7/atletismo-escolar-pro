import React, { useState } from 'react';
import {
  Cloud,
  Wifi,
  X,
  Check,
  Copy,
  RefreshCw,
  Smartphone,
  Radio,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  Database,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  syncFullTournamentToCloud,
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  DEFAULT_FIREBASE_CONFIG
} from '../services/cloudSync';
import { MASTER_RECOVERY_KEY } from '../utils/storage';

export default function CloudSyncModal({
  isOpen,
  onClose,
  cloudSession,
  onUpdateCloudSession,
  adminPin = 'atletismo2026',
  fullState
}) {
  const [roomCode, setRoomCode] = useState(cloudSession?.roomCode || 'ATLETISMO-2026');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estados de Desconexión Offline protegida por contraseña
  const [showOfflineChallenge, setShowOfflineChallenge] = useState(false);
  const [offlinePasswordInput, setOfflinePasswordInput] = useState('');
  const [offlineError, setOfflineError] = useState('');

  // Estados de configuración de segundo proyecto de Firebase
  const [showCustomFirebase, setShowCustomFirebase] = useState(false);
  const activeFirebaseConfig = getActiveFirebaseConfig();
  const [customApiKey, setCustomApiKey] = useState(activeFirebaseConfig.apiKey || '');
  const [customProjectId, setCustomProjectId] = useState(activeFirebaseConfig.projectId || '');
  const [customSavedMessage, setCustomSavedMessage] = useState(false);

  if (!isOpen) return null;

  // Intentar desconectar a Modo Offline (REQUIERE CONTRASEÑA OBLIGATORIA)
  const handleRequestOffline = () => {
    setShowOfflineChallenge(true);
    setOfflinePasswordInput('');
    setOfflineError('');
  };

  const handleConfirmOffline = (e) => {
    e.preventDefault();
    const cleanInput = offlinePasswordInput.trim();
    if (cleanInput === adminPin || cleanInput === MASTER_RECOVERY_KEY || cleanInput === 'atletismo2026') {
      const updated = {
        ...cloudSession,
        enabled: false,
        userExplicitlyChoseOffline: true,
        roomCode: roomCode.trim().toUpperCase()
      };
      onUpdateCloudSession(updated);
      setShowOfflineChallenge(false);
      setOfflinePasswordInput('');
      setOfflineError('');
      alert('Sistema desconectado. Operando en Modo Offline (Local).');
    } else {
      setOfflineError('Contraseña incorrecta. Se requiere la clave de Mesa de Control para poner el sistema offline.');
    }
  };

  // Conectar a la Nube (Online libre por defecto)
  const handleConnectCloud = () => {
    const updated = {
      ...cloudSession,
      enabled: true,
      userExplicitlyChoseOffline: false,
      roomCode: roomCode.trim().toUpperCase()
    };
    onUpdateCloudSession(updated);
    setShowOfflineChallenge(false);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await syncFullTournamentToCloud(roomCode.trim().toUpperCase(), fullState);
      alert('¡Sincronización completa! Todos los atletas, escuelas y tiempos ya están en la nube.');
    } catch (err) {
      alert(`Error al sincronizar: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSecondFirebaseProject = (e) => {
    e.preventDefault();
    if (!customProjectId.trim()) {
      alert('Ingresa al menos el ID de tu proyecto de Firebase.');
      return;
    }
    const newConfig = {
      apiKey: customApiKey.trim() || activeFirebaseConfig.apiKey,
      projectId: customProjectId.trim(),
      authDomain: `${customProjectId.trim()}.firebaseapp.com`,
      storageBucket: `${customProjectId.trim()}.firebasestorage.app`
    };
    saveCustomFirebaseConfig(newConfig);
    setCustomSavedMessage(true);
    setTimeout(() => setCustomSavedMessage(false), 3000);
  };

  const handleRestoreDefaultFirebase = () => {
    saveCustomFirebaseConfig(null);
    setCustomApiKey(DEFAULT_FIREBASE_CONFIG.apiKey);
    setCustomProjectId(DEFAULT_FIREBASE_CONFIG.projectId);
    setCustomSavedMessage(true);
    setTimeout(() => setCustomSavedMessage(false), 3000);
  };

  const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Encabezado */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-emerald-400 shrink-0">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Sincronización en la Nube (Tiempo Real)</h3>
              <p className="text-[11px] text-slate-300">Conexión multi-dispositivo para jueces y maestros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Tarjeta de Estado Nube (Online por Defecto) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            cloudSession?.enabled
              ? 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-xs'
              : 'bg-amber-50/80 border-amber-300 text-slate-900'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  cloudSession?.enabled
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-amber-500 text-white shadow-xs'
                }`}>
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {cloudSession?.enabled ? '🟢 Nube Conectada en Vivo (Predeterminada)' : '⚪ Modo Offline (Desconectado)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {cloudSession?.enabled
                      ? 'La nube está siempre activa por defecto para que las inscripciones de los maestros se sincronicen 2 días antes o en vivo sin perder datos entre computadoras y celulares.'
                      : 'Atención: Los registros solo se guardan en este dispositivo. Para que los demás vean los competidores, conéctate a la nube.'}
                  </p>
                </div>
              </div>

              {/* Botón de Conexión / Desconexión */}
              <div className="shrink-0">
                {cloudSession?.enabled ? (
                  <button
                    type="button"
                    onClick={handleRequestOffline}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1"
                    title="Requiere contraseña de Mesa de Control para evitar desconexiones accidentales"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Desconectar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectCloud}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center space-x-1"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Conectar a la Nube</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cuadro de Desafío de Seguridad para Desconectar a Offline */}
            {showOfflineChallenge && (
              <form onSubmit={handleConfirmOffline} className="mt-3.5 pt-3 border-t border-emerald-200/80 space-y-2 animate-in fade-in">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-800">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Se requiere contraseña para poner el sistema Offline:</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Esto previene que una mesa se quede sin sincronizar por accidente y los atletas de los maestros no se registren.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    required
                    value={offlinePasswordInput}
                    onChange={(e) => setOfflinePasswordInput(e.target.value)}
                    placeholder="Contraseña de Mesa de Control..."
                    className="flex-1 bg-white border border-rose-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOfflineChallenge(false)}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
                {offlineError && (
                  <p className="text-[11px] text-rose-600 font-bold">{offlineError}</p>
                )}
              </form>
            )}
          </div>

          {/* Código de Sala */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Código de Sala del Torneo (Enlace Oficial):
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ATLETISMO-2026"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold tracking-wider outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateCloudSession({ ...cloudSession, roomCode: roomCode.trim().toUpperCase() });
                  alert('Código de sala actualizado y vinculado.');
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Enlace Compartible para Celulares */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              <span>Link directo para jueces en pista y campo:</span>
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-white text-slate-600 text-xs font-mono rounded-xl px-3 py-2 border border-slate-200 truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* Explicación y Garantía de Aislamiento de Proyectos Firebase */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-700 shrink-0" />
              <h4 className="text-xs font-bold text-sky-950">
                Aislamiento Total entre Karate Brackets Pro y Atletismo
              </h4>
            </div>
            <p className="text-[11px] text-sky-900 leading-relaxed">
              <strong>Tus datos nunca se cruzan ni se mezclan:</strong> Atletismo Escolar Pro utiliza exclusivamente su propia colección en Firestore llamada <code className="bg-white/80 px-1 py-0.2 rounded font-mono text-sky-800 font-bold">atletismo_tournaments</code>. Aunque uses el mismo proyecto de Firebase para ambos deportes o tengas dos proyectos separados, los registros de atletismo jamás aparecerán en karate ni viceversa.
            </p>

            <button
              type="button"
              onClick={() => setShowCustomFirebase(!showCustomFirebase)}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center space-x-1 pt-1"
            >
              <span>{showCustomFirebase ? 'Ocultar configuración de 2º proyecto' : '¿Deseas usar un 2º Proyecto de Firebase específico? (Opcional)'}</span>
              {showCustomFirebase ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showCustomFirebase && (
              <form onSubmit={handleSaveSecondFirebaseProject} className="pt-2 border-t border-sky-200 space-y-2.5 text-xs animate-in fade-in">
                <p className="text-[10px] text-slate-500">
                  Si creaste un segundo proyecto en la consola de Firebase para atletismo, introduce aquí su Project ID:
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-0.5">Project ID de Firebase:</label>
                  <input
                    type="text"
                    value={customProjectId}
                    onChange={(e) => setCustomProjectId(e.target.value)}
                    placeholder="ej. atletismo-escolar-puebla"
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-[11px]"
                  >
                    Guardar 2º Proyecto
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreDefaultFirebase}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px]"
                  >
                    Restablecer Predeterminado
                  </button>
                  {customSavedMessage && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardado</span>
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Sincronización Manual Forzada */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <span className="text-[11px] text-slate-500">¿Quieres forzar un respaldo ahora?</span>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Publicar a la Nube Ahora'}</span>
            </button>
          </div>
        </div>

        {/* Pie */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
