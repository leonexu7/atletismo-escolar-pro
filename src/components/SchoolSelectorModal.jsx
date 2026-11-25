import React, { useState, useMemo, useEffect } from 'react';
import {
  School,
  Search,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  MapPin,
  FileText,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cleanCCT, cleanSchoolName, findExistingSchoolMatch } from '../utils/schoolNormalizer';

export default function SchoolSelectorModal({
  isOpen,
  onClose,
  schools = [],
  currentSchool,
  onSelectSchool,
  onSaveSchool
}) {
  const [activeTab, setActiveTab] = useState(() => (schools.length === 0 ? 'new' : 'select')); // 'select' | 'new'
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario para registrar nueva escuela (todos los campos vacíos sin prellenado)
  const [newSchoolForm, setNewSchoolForm] = useState({
    name: '',
    cct: '',
    zone: '',
    inspection: '',
    coachName: ''
  });

  const [coachNameForSelect, setCoachNameForSelect] = useState(
    currentSchool?.coachName || ''
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(schools.length === 0 ? 'new' : 'select');
      setCoachNameForSelect(currentSchool?.coachName || '');
    }
  }, [isOpen, schools.length, currentSchool?.coachName]);

  // Detección reactiva de duplicados al capturar una nueva escuela
  const duplicateMatch = useMemo(() => {
    if (activeTab !== 'new') return { isMatch: false };
    if (!newSchoolForm.name.trim() && !newSchoolForm.cct.trim()) {
      return { isMatch: false };
    }
    return findExistingSchoolMatch(schools, newSchoolForm);
  }, [schools, newSchoolForm, activeTab]);

  if (!isOpen) return null;

  // Filtrado de escuelas existentes
  const filteredSchools = schools.filter(sch => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      sch.name.toLowerCase().includes(term) ||
      (sch.cct && sch.cct.toLowerCase().includes(term)) ||
      (sch.zone && sch.zone.toLowerCase().includes(term)) ||
      (sch.inspection && sch.inspection.toLowerCase().includes(term))
    );
  });

  // Elegir una escuela ya existente de la lista
  const handlePickExistingSchool = (sch) => {
    const updated = {
      ...sch,
      coachName: coachNameForSelect.trim() || sch.coachName || 'Profesor de Educación Física'
    };
    onSaveSchool(updated);
    onSelectSchool(updated);
    onClose();
  };

  // Guardar nueva escuela
  const handleCreateNewSchool = (e) => {
    e.preventDefault();

    if (!newSchoolForm.name.trim()) {
      alert('Por favor ingresa el nombre de la escuela.');
      return;
    }
    if (!newSchoolForm.cct.trim()) {
      alert('Por favor ingresa la Clave de Centro de Trabajo (CCT).');
      return;
    }
    if (!newSchoolForm.coachName.trim()) {
      alert('Por favor ingresa el nombre del profesor a cargo.');
      return;
    }

    // Normalización de Clave CCT
    const normalizedCCT = cleanCCT(newSchoolForm.cct);

    // Si ya existía exactamente por CCT, actualizarla/unirse
    if (duplicateMatch.isMatch && duplicateMatch.matchedSchool) {
      const merged = {
        ...duplicateMatch.matchedSchool,
        coachName: newSchoolForm.coachName.trim(),
        zone: newSchoolForm.zone.trim() || duplicateMatch.matchedSchool.zone,
        inspection: newSchoolForm.inspection.trim() || duplicateMatch.matchedSchool.inspection
      };
      onSaveSchool(merged);
      onSelectSchool(merged);
      onClose();
      return;
    }

    const newSchool = {
      id: `esc-${Date.now()}`,
      name: newSchoolForm.name.trim(),
      shortName: newSchoolForm.name.trim().replace(/^escuela|^esc\.?|^primaria|^prim\.?/i, '').trim() || newSchoolForm.name.trim(),
      cct: normalizedCCT,
      zone: newSchoolForm.zone.trim(),
      inspection: newSchoolForm.inspection.trim(),
      coachName: newSchoolForm.coachName.trim(),
      color: '#e11d48'
    };

    onSaveSchool(newSchool);
    onSelectSchool(newSchool);
    setNewSchoolForm({
      name: '',
      cct: '',
      zone: '',
      inspection: '',
      coachName: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Escuela de Procedencia del Maestro
              </h3>
              <p className="text-xs text-slate-500">
                Configura tu escuela para que sea tu <strong>opción predeterminada</strong> al inscribir alumnos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Modo */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('select')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'select'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Seleccionar Escuela Existente ({schools.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'new'
                ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Registrar Nueva Escuela</span>
          </button>
        </div>

        {/* CONTENIDO 1: SELECCIONAR ESCUELA EXISTENTE */}
        {activeTab === 'select' && (
          <div className="space-y-3.5">
            {/* Campo para el nombre del profesor que está ingresando */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Profesor(a) a cargo (Tu nombre):
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ej. Prof. Roberto González"
                  value={coachNameForSelect}
                  onChange={(e) => setCoachNameForSelect(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Puedes personalizar tu nombre como maestro responsable al seleccionar la escuela.
              </p>
            </div>

            {/* Buscador de escuelas */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre de escuela, Clave CCT o Zona..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista de escuelas registradas */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredSchools.map(sch => {
                const isSelected = currentSchool?.id === sch.id;
                return (
                  <div
                    key={sch.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-300'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{sch.name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.2 rounded-full">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                        {sch.cct && (
                          <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] border border-slate-200">
                            CCT: {sch.cct}
                          </span>
                        )}
                        <span>• {sch.zone || 'Zona Escolar'}</span>
                        {sch.inspection && <span>• {sch.inspection}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePickExistingSchool(sch)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all self-end sm:self-auto shrink-0 ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Actualizar Perfil' : 'Elegir Escuela'}</span>
                    </button>
                  </div>
                );
              })}

              {filteredSchools.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  No se encontraron escuelas con ese nombre o Clave CCT.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('new');
                      setNewSchoolForm(prev => ({ ...prev, name: searchTerm }));
                    }}
                    className="text-rose-600 font-bold underline ml-1"
                  >
                    ¿Deseas registrarla?
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENIDO 2: REGISTRAR NUEVA ESCUELA */}
        {activeTab === 'new' && (
          <form onSubmit={handleCreateNewSchool} className="space-y-3.5 text-xs">
            {/* Aviso inteligente anti-duplicados */}
            {duplicateMatch.isMatch && duplicateMatch.matchedSchool && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>¡Atención anti-duplicados!</strong> {duplicateMatch.message}
                    <p className="mt-0.5 text-amber-800">
                      Evita registrarla de nuevo para que los alumnos no se dividan en escuelas separadas.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handlePickExistingSchool(duplicateMatch.matchedSchool)}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1 shadow-2xs transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Vincularme a &ldquo;{duplicateMatch.matchedSchool.name}&rdquo;</span>
                </button>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nombre de la Escuela Primaria *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Escuela Primaria Benito Juárez"
                value={newSchoolForm.name}
                onChange={(e) => setNewSchoolForm({ ...newSchoolForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Clave de Centro de Trabajo (CCT) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 21EPR0101A"
                  value={newSchoolForm.cct}
                  onChange={(e) => setNewSchoolForm({ ...newSchoolForm, cct: cleanCCT(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono uppercase text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Identificador federal único (evita duplicados).
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Zona Escolar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Zona Escolar 04"
                  value={newSchoolForm.zone}
                  onChange={(e) => setNewSchoolForm({ ...newSchoolForm, zone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Inspección *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Inspección 12"
                  value={newSchoolForm.inspection}
                  onChange={(e) => setNewSchoolForm({ ...newSchoolForm, inspection: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Profesor a cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Prof. Roberto González"
                  value={newSchoolForm.coachName}
                  onChange={(e) => setNewSchoolForm({ ...newSchoolForm, coachName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Guardar y Establecer como Predeterminada</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
