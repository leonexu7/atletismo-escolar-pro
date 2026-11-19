import React, { useState } from 'react';
import { Lock, Key, X, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  actualAdminPin = 'atletismo2026'
}) {
  const [inputPin, setInputPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (inputPin === actualAdminPin) {
      setInputPin('');
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg('Contraseña incorrecta. Solo el comité organizador de la Mesa de Control tiene acceso.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        {/* Cabecera Limpia */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b-2 border-rose-500">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-sm">Acceso a Mesa de Control</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="text-slate-600 space-y-1">
            <p className="font-medium text-slate-800">
              Ingresa la contraseña para desbloquear las funciones de coordinación:
            </p>
            <ul className="list-disc pl-4 text-[11px] text-slate-500 space-y-0.5">
              <li>Supervisión de las 11 pruebas en tiempo real.</li>
              <li>Emisión e impresión de Diplomas Oficiales en PDF.</li>
              <li>Ajustes generales del torneo y respaldo de datos.</li>
            </ul>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Contraseña de Acceso *
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                placeholder="Ingresa la contraseña"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Key className="w-3.5 h-3.5 text-rose-400" />
              <span>Desbloquear Mesa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
