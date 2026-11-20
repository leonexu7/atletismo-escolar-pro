import React, { useState, useRef } from 'react';
import {
  Settings,
  X,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Check,
  Shield,
  Image,
  Award,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { exportTournamentBackupToFile, importTournamentFromFile, MASTER_RECOVERY_KEY } from '../utils/storage';
import defaultBannerLogo from '../assets/puebla_sep_banner.jpg';

export default function TournamentSettingsModal({
  isOpen,
  onClose,
  tournament,
  onSaveTournament,
  onLoadDemoData,
  onResetToZero,
  fullState
}) {
  const [formData, setFormData] = useState({ ...tournament });
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Data = ev.target.result;
      setFormData(prev => ({ ...prev, customLogo: base64Data }));
    };
    reader.readAsDataURL(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveTournament(formData);
    onClose();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedState = await importTournamentFromFile(file);
      if (window.confirm('¿Deseas restaurar este respaldo? Reemplazará los datos actuales.')) {
        onSaveTournament(importedState.tournament, importedState);
        alert('Torneo restaurado exitosamente.');
        onClose();
      }
    } catch (err) {
      alert(`Error al importar archivo: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Encabezado */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Ajustes del Torneo Escolar</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-3.5 overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Torneo:</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Sede / Pista:</label>
              <input
                type="text"
                placeholder="Ej. Estadio Olímpico Municipal"
                value={formData.venue || ''}
                onChange={(e) => handleChange('venue', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha del Evento:</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              📍 Ubicación / Dirección del Evento (Aparecerá en el portal de inscripción):
            </label>
            <input
              type="text"
              placeholder="Ej. Av. Insurgentes Sur #450, Unidad Deportiva Benito Juárez"
              value={formData.venueAddress || ''}
              onChange={(e) => handleChange('venueAddress', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
            />
          </div>

          {/* Agrupación de Categorías (Requerimiento Usuario) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <label className="block text-xs font-bold text-slate-800">
              Modalidad de División de Categorías:
            </label>
            
            <div className="space-y-2">
              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                (formData.categoryGroupingMode || 'unified') === 'unified'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="categoryGroupingMode"
                  value="unified"
                  checked={(formData.categoryGroupingMode || 'unified') === 'unified'}
                  onChange={() => handleChange('categoryGroupingMode', 'unified')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-400"
                />
                <div className="text-xs">
                  <strong className="block font-bold">Categoría Única Primaria (Juntar a todos por Rama)</strong>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    No separa por edades ni grados (uno de 8 y uno de 11 compiten juntos). Solo se divide en Varonil y Femenil.
                  </span>
                </div>
              </label>

              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                formData.categoryGroupingMode === 'by_grades'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="categoryGroupingMode"
                  value="by_grades"
                  checked={formData.categoryGroupingMode === 'by_grades'}
                  onChange={() => handleChange('categoryGroupingMode', 'by_grades')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-400"
                />
                <div className="text-xs">
                  <strong className="block font-bold">Dividir por Grados / Edades (Infantil Menor y Mayor)</strong>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Separa las pruebas en Infantil Menor (3°-4° grado / 8-9 años) e Infantil Mayor (5°-6° grado / 10-11 años).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Configuración de Logotipo Institucional (Requerimiento Usuario) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Logotipo Institucional de Encabezado:
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                formData.customLogo
                  ? 'bg-sky-100 text-sky-800 border border-sky-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {formData.customLogo ? 'Personalizado' : 'Oficial Puebla (Predeterminado)'}
              </span>
            </div>

            {/* Vista Previa del Logotipo */}
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-center min-h-[70px]">
              <img
                src={formData.customLogo || defaultBannerLogo}
                alt="Vista previa logotipo"
                className="max-h-16 w-auto max-w-full object-contain"
              />
            </div>

            {/* Acciones para cambiar o restablecer */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
              >
                <Image className="w-3.5 h-3.5 text-sky-600" />
                <span>{formData.customLogo ? 'Cambiar por otra Imagen' : 'Subir Imagen Personalizada'}</span>
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />

              {formData.customLogo && (
                <button
                  type="button"
                  onClick={() => handleChange('customLogo', null)}
                  className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                  title="Restablecer al logotipo oficial de Puebla"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Puebla</span>
                </button>
              )}
            </div>

            {/* Botón para mostrar en Mesa de Control */}
            <label className="flex items-center justify-between pt-2 border-t border-slate-200/80 cursor-pointer">
              <div className="pr-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Mostrar Logotipo también en la Mesa de Control
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Por defecto solo aparece en el Registro de Alumnos. Activa esta casilla para mostrarlo también en la pantalla de control.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.showLogoInControlDesk)}
                onChange={(e) => handleChange('showLogoInControlDesk', e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-400 h-4 w-4 shrink-0"
              />
            </label>
          </div>

          {/* Opción de Diplomas de Premiación (Activar / Desactivar) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="pr-3">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Activar Impresión de Diplomas de Ganadores</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Por defecto está desactivada para simplificar la interfaz. Actívala si necesitas generar e imprimir diplomas oficiales en PDF para los medallistas.
                </span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.enableDiplomas)}
                onChange={(e) => handleChange('enableDiplomas', e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-400 h-4 w-4 shrink-0"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Carriles de Pista:</label>
              <select
                value={formData.lanesCount || 6}
                onChange={(e) => handleChange('lanesCount', parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
              >
                <option value={6}>6 Carriles (Escolar)</option>
                <option value={8}>8 Carriles (Olímpica)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Intentos en Campo:</label>
              <select
                value={formData.fieldAttemptsCount || 3}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-bold"
              >
                <option value={3}>3 Intentos (Reglamentario)</option>
              </select>
            </div>
          </div>

          {/* Zona de Seguridad Especial para la Contraseña de Mesa de Control */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Contraseña Oficial de Mesa de Control (PIN)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Estado: •••••••• (Oculta por seguridad contra bromas)
                  </span>
                </div>
              </div>

              {!isChangingPin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(true);
                    setPinChangeError('');
                    setCurrentPinInput('');
                    setNewPinInput('');
                    setConfirmPinInput('');
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cambiar Clave</span>
                </button>
              )}
            </div>

            {pinChangeSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-2 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">¡Contraseña de Mesa de Control actualizada exitosamente! Recuerda guardar los ajustes.</span>
              </div>
            )}

            {/* Procedimiento Especial de Cambio de Contraseña */}
            {isChangingPin && (
              <div className="bg-white border-2 border-amber-300 rounded-xl p-3.5 space-y-3 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Procedimiento de Cambio Seguro</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-600">
                  Para evitar que alguien cambie la contraseña por broma o accidente, debes validar primero tu contraseña actual.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      1. Contraseña Actual *
                    </label>
                    <input
                      type="password"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      placeholder="Ingresa la contraseña actual..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        2. Nueva Contraseña *
                      </label>
                      <input
                        type="password"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="Mínimo 4 caracteres..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        3. Confirmar Nueva Contraseña *
                      </label>
                      <input
                        type="password"
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value)}
                        placeholder="Repite la contraseña..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {pinChangeError && (
                  <p className="text-[11px] text-rose-600 font-bold bg-rose-50 border border-rose-200 p-2 rounded-lg">
                    {pinChangeError}
                  </p>
                )}

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPinChangeError('');
                      const cleanCurrent = currentPinInput.trim();
                      const cleanNew = newPinInput.trim();
                      const cleanConfirm = confirmPinInput.trim();

                      const actualCurrentPin = formData.adminPin || 'atletismo2026';
                      if (cleanCurrent !== actualCurrentPin && cleanCurrent !== MASTER_RECOVERY_KEY) {
                        setPinChangeError('La contraseña actual no es correcta. No puedes modificar la clave.');
                        return;
                      }

                      if (cleanNew.length < 4) {
                        setPinChangeError('La nueva contraseña debe tener al menos 4 caracteres.');
                        return;
                      }

                      if (cleanNew !== cleanConfirm) {
                        setPinChangeError('Las contraseñas nuevas no coinciden. Verifícalas.');
                        return;
                      }

                      setFormData(prev => ({ ...prev, adminPin: cleanNew }));
                      setIsChangingPin(false);
                      setCurrentPinInput('');
                      setNewPinInput('');
                      setConfirmPinInput('');
                      setPinChangeSuccess(true);
                      setTimeout(() => setPinChangeSuccess(false), 4000);
                    }}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-2xs"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gestión de Respaldos */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase">Respaldos y Datos</h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportTournamentBackupToFile(fullState)}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar Respaldo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Importar Respaldo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Cargar datos de prueba?')) {
                    onLoadDemoData();
                    onClose();
                  }
                }}
                className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 transition-colors"
              >
                Cargar Demo
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('⚠️ ¿Vaciar a CERO todos los datos para iniciar un torneo en blanco?')) {
                    onResetToZero();
                    onClose();
                  }
                }}
                className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 transition-colors"
              >
                Vaciar a Cero
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold">
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Ajustes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
