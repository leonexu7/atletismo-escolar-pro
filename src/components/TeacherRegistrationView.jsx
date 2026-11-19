import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  School,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
  Search,
  Sparkles,
  Award,
  Lock,
  Unlock,
  MessageSquare,
  Share2,
  UserCheck
} from 'lucide-react';
import { OFFICIAL_EVENTS, isTrackEvent, isFieldEvent } from '../constants/events';
import { SCHOOL_CATEGORIES, PARTICIPATION_LIMITS } from '../constants/categories';
import { downloadExcelRegistrationTemplate, parseExcelAthletesFile } from '../utils/excelHandler';
import RelayBuilderModal from './RelayBuilderModal';

export default function TeacherRegistrationView({
  schools = [],
  athletes = [],
  relays = [],
  onSaveSchool,
  onRegisterAthlete,
  onRegisterBatchAthletes,
  onUpdateAthlete,
  onDeleteAthlete,
  onSaveRelay,
  isAdmin = false,
  onOpenAdminLogin,
  onOpenControlDesk
}) {
  // Datos de la Escuela del Maestro (guardados en localStorage)
  const [schoolInfo, setSchoolInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('atletismo_saved_school_info');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      id: 'esc-1',
      name: 'Esc. Primaria Benito Juárez',
      zone: 'Zona Escolar 04',
      coachName: 'Prof. Roberto González',
      phone: ''
    };
  });

  const [isSchoolLocked, setIsSchoolLocked] = useState(() => {
    return Boolean(localStorage.getItem('atletismo_saved_school_info'));
  });

  // Guardar escuela
  const handleToggleSchoolLock = () => {
    if (!isSchoolLocked) {
      if (!schoolInfo.name.trim()) {
        alert('Por favor escribe el nombre de tu escuela.');
        return;
      }
      setIsSchoolLocked(true);
      try {
        localStorage.setItem('atletismo_saved_school_info', JSON.stringify(schoolInfo));
      } catch (_) {}
    } else {
      setIsSchoolLocked(false);
    }
  };

  // Formulario individual para nuevo alumno
  const [athleteForm, setAthleteForm] = useState({
    fullName: '',
    gender: 'M',
    schoolGrade: '5',
    birthDate: '2014-01-01',
    bibNumber: '',
    eventIds: []
  });

  // Estado del modal de edición de competidor (estilo karate)
  const [editingAthlete, setEditingAthlete] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('ALL');
  const [isRelayModalOpen, setIsRelayModalOpen] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const fileInputRef = useRef(null);

  // Alumnos pertenecientes a la escuela activa
  const schoolAthletes = athletes.filter(a =>
    a.schoolId === schoolInfo.id || a.schoolName === schoolInfo.name
  );

  const handleToggleEvent = (eventId, formSetter, currentList) => {
    const isAlready = currentList.includes(eventId);
    let next = [];

    if (isAlready) {
      next = currentList.filter(id => id !== eventId);
    } else {
      const ev = OFFICIAL_EVENTS.find(e => e.id === eventId);
      const isIndividual = ev?.type !== 'relevo';
      const currentIndividuals = currentList.filter(id => {
        const item = OFFICIAL_EVENTS.find(e => e.id === id);
        return item?.type !== 'relevo';
      });

      if (isIndividual && currentIndividuals.length >= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS) {
        alert(`Reglamento Escolar: Máximo ${PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS} pruebas individuales por alumno.`);
        return;
      }

      next = [...currentList, eventId];
    }

    formSetter(prev => ({ ...prev, eventIds: next }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();

    if (!athleteForm.fullName.trim()) {
      alert('Por favor ingresa el nombre completo del alumno.');
      return;
    }

    if (athleteForm.eventIds.length === 0) {
      alert('Selecciona al menos una prueba para el alumno.');
      return;
    }

    const calculatedCategory = (athleteForm.schoolGrade === '3' || athleteForm.schoolGrade === '4')
      ? 'infantil_menor'
      : 'infantil_mayor';

    const assignedBib = athleteForm.bibNumber
      ? parseInt(athleteForm.bibNumber, 10)
      : Math.floor(100 + athletes.length + 1);

    const newAthlete = {
      id: `ath-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...athleteForm,
      fullName: athleteForm.fullName.trim(),
      bibNumber: assignedBib,
      categoryId: calculatedCategory,
      schoolId: schoolInfo.id,
      schoolName: schoolInfo.name
    };

    onRegisterAthlete(newAthlete);
    setSuccessNotice(`¡${newAthlete.fullName} inscrito correctamente en ${newAthlete.eventIds.length} prueba(s)!`);
    setTimeout(() => setSuccessNotice(''), 4000);

    setAthleteForm({
      fullName: '',
      gender: athleteForm.gender,
      schoolGrade: athleteForm.schoolGrade,
      birthDate: '2014-01-01',
      bibNumber: '',
      eventIds: []
    });
  };

  // Guardar edición de un atleta existente
  const handleSaveEditedAthlete = (e) => {
    e.preventDefault();
    if (!editingAthlete.fullName?.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    if (!editingAthlete.eventIds || editingAthlete.eventIds.length === 0) {
      alert('Debes asignarle al menos una prueba.');
      return;
    }

    const calculatedCategory = (editingAthlete.schoolGrade === '3' || editingAthlete.schoolGrade === '4')
      ? 'infantil_menor'
      : 'infantil_mayor';

    const updated = {
      ...editingAthlete,
      fullName: editingAthlete.fullName.trim(),
      bibNumber: editingAthlete.bibNumber ? parseInt(editingAthlete.bibNumber, 10) : editingAthlete.bibNumber,
      categoryId: calculatedCategory
    };

    onUpdateAthlete(updated);
    setEditingAthlete(null);
    setSuccessNotice(`¡Datos de ${updated.fullName} actualizados con éxito!`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const handleDeleteCoachAthlete = (ath) => {
    if (window.confirm(`¿Dar de baja a ${ath.fullName} de la cédula de tu escuela?`)) {
      onDeleteAthlete(ath.id);
      setSuccessNotice(`Alumno dado de baja.`);
      setTimeout(() => setSuccessNotice(''), 3000);
    }
  };

  // Carga masiva por Excel
  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelLoading(true);
    try {
      const parsedList = await parseExcelAthletesFile(file);
      if (parsedList.length === 0) {
        alert('No se detectaron alumnos válidos en la hoja Atletas.');
        return;
      }

      const formatted = parsedList.map((p, idx) => ({
        ...p,
        schoolId: schoolInfo.id,
        schoolName: schoolInfo.name,
        bibNumber: p.bibNumber || (100 + athletes.length + idx + 1)
      }));

      onRegisterBatchAthletes(formatted);
      setSuccessNotice(`¡Se inscribieron ${formatted.length} alumnos desde el archivo Excel!`);
      setTimeout(() => setSuccessNotice(''), 4500);
    } catch (err) {
      alert(`Error al procesar archivo Excel: ${err.message}`);
    } finally {
      setExcelLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Compartir Cédula por WhatsApp (estilo karate)
  const handleSendWhatsAppRoster = () => {
    if (schoolAthletes.length === 0) {
      alert('Aún no tienes alumnos registrados para generar el reporte de WhatsApp.');
      return;
    }

    const athletesSummary = schoolAthletes.map((a, i) =>
      `${i + 1}. *${a.fullName}* (#${a.bibNumber || 'S/N'}) - ${a.gender === 'M' ? 'Var' : 'Fem'} ${a.schoolGrade}º Primaria [${(a.eventIds || []).map(id => OFFICIAL_EVENTS.find(e => e.id === id)?.shortName || id).join(', ')}]`
    ).join('\n');

    const text = encodeURIComponent(
      `🏃 *CÉDULA DE INSCRIPCIÓN - ATLETISMO ESCOLAR PRIMARIA*\n\n` +
      `🏫 *Escuela:* ${schoolInfo.name}\n` +
      `📍 *Zona:* ${schoolInfo.zone}\n` +
      `👨‍🏫 *Profesor:* ${schoolInfo.coachName}\n\n` +
      `📊 *Total de Alumnos Inscritos:* ${schoolAthletes.length}\n\n` +
      `*Padrón de Competidores:*\n` +
      athletesSummary +
      `\n\n✅ _Datos cargados en el sistema oficial de atletismo._`
    );

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredAthletes = schoolAthletes.filter(ath => {
    const matchesSearch = ath.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(ath.bibNumber).includes(searchTerm);
    const matchesGender = filterGender === 'ALL' || ath.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Aviso de Éxito */}
      {successNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Tarjeta de la Escuela con Botón Integrado de Mesa de Control */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Cédula Escolar Oficial
                </span>
                <span className="text-xs text-slate-500">{schoolInfo.zone}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {schoolInfo.name}
              </h2>
              <p className="text-xs text-slate-500">
                Profesor(a): <strong className="text-slate-700">{schoolInfo.coachName || 'Sin asignar'}</strong>
              </p>
            </div>
          </div>

          {/* Botones Integrados: Mesa de Control + Excel + Relevos */}
          <div className="flex flex-wrap items-center gap-2">
            {/* BOTÓN PROMINENTE DE MESA DE CONTROL INTEGRADO */}
            <button
              onClick={() => {
                if (isAdmin) {
                  onOpenControlDesk();
                } else {
                  onOpenAdminLogin();
                }
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
              title="Acceso a la Mesa de Control Central con contraseña"
            >
              {isAdmin ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5 text-rose-400" />}
              <span>{isAdmin ? 'Mesa de Control (Activa)' : 'Mesa de Control (Organizador)'}</span>
            </button>

            <button
              onClick={downloadExcelRegistrationTemplate}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Plantilla Excel</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={excelLoading}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{excelLoading ? 'Cargando...' : 'Subir Excel'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelUpload}
            />

            <button
              onClick={() => setIsRelayModalOpen(true)}
              className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Armar Relevos</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Formulario de Inscripción Individual (5 Columnas) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <UserPlus className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Inscribir Nuevo Alumno</h3>
              <p className="text-[11px] text-slate-500">Agrega a tus alumnos uno a uno a la cédula</p>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre Completo del Alumno *</label>
              <input
                type="text"
                placeholder="Ej. Mateo Ramírez Cruz"
                value={athleteForm.fullName}
                onChange={(e) => setAthleteForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rama / Sexo *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAthleteForm(prev => ({ ...prev, gender: 'M' }))}
                    className={`py-1.5 text-center rounded-xl border font-bold transition-all ${
                      athleteForm.gender === 'M'
                        ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Varonil
                  </button>
                  <button
                    type="button"
                    onClick={() => setAthleteForm(prev => ({ ...prev, gender: 'F' }))}
                    className={`py-1.5 text-center rounded-xl border font-bold transition-all ${
                      athleteForm.gender === 'F'
                        ? 'bg-pink-50 text-pink-700 border-pink-300 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Femenil
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grado Escolar *</label>
                <select
                  value={athleteForm.schoolGrade}
                  onChange={(e) => setAthleteForm(prev => ({ ...prev, schoolGrade: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
                >
                  <option value="3">3º Primaria (Infantil Menor)</option>
                  <option value="4">4º Primaria (Infantil Menor)</option>
                  <option value="5">5º Primaria (Infantil Mayor)</option>
                  <option value="6">6º Primaria (Infantil Mayor)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dorsal (Opcional):</label>
                <input
                  type="number"
                  placeholder="Automático"
                  value={athleteForm.bibNumber}
                  onChange={(e) => setAthleteForm(prev => ({ ...prev, bibNumber: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha Nacimiento:</label>
                <input
                  type="date"
                  value={athleteForm.birthDate}
                  onChange={(e) => setAthleteForm(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-400 outline-none"
                />
              </div>
            </div>

            {/* Selector de Pruebas Pastel */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">Modalidades de Competencia:</label>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200">
                  {athleteForm.eventIds.length} seleccionadas (Máx 2 indiv.)
                </span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {OFFICIAL_EVENTS.map(ev => {
                  const isChecked = athleteForm.eventIds.includes(ev.id);
                  const isTrack = isTrackEvent(ev.id);

                  return (
                    <label
                      key={ev.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? isTrack
                            ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEvent(ev.id, setAthleteForm, athleteForm.eventIds)}
                          className="rounded text-rose-500 focus:ring-rose-400 h-3.5 w-3.5"
                        />
                        <span>{ev.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {ev.type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Inscribir Alumno en la Cédula</span>
            </button>
          </form>
        </div>

        {/* Padrón y Gestión de Atletas de la Escuela (7 Columnas - Estilo Karate) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Alumnos de mi Escuela ({schoolAthletes.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pulsa <strong>"Editar"</strong> para modificar datos, pruebas o dorsal.
                  </p>
                </div>
              </div>

              {/* Búsqueda y Filtro */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 sm:w-40">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 outline-none focus:bg-white focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-2 py-1.5 outline-none"
                >
                  <option value="ALL">Todos</option>
                  <option value="M">Var</option>
                  <option value="F">Fem</option>
                </select>
              </div>
            </div>

            {/* Listado de Tarjetas de Alumnos (Estilo Karate con Botón Editar Claro) */}
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto mt-2 pr-1">
              {filteredAthletes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  Aún no hay alumnos registrados para esta escuela. Usa el formulario a la izquierda o carga tu Excel.
                </div>
              ) : (
                filteredAthletes.map((ath, idx) => (
                  <div
                    key={ath.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{ath.fullName}</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          #{ath.bibNumber || 'S/N'}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                            ath.gender === 'F' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {ath.gender === 'F' ? 'Femenil' : 'Varonil'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-7">
                        <span>Grado: <strong className="text-slate-700">{ath.schoolGrade}º Primaria</strong></span>
                        <span>Categoría: <strong className="text-slate-700">{ath.categoryId === 'infantil_menor' ? 'Inf. Menor (3°-4°)' : 'Inf. Mayor (5°-6°)'}</strong></span>
                        {ath.birthDate && <span>Nac: <strong>{ath.birthDate}</strong></span>}
                      </div>

                      {/* Chips de Pruebas */}
                      <div className="flex flex-wrap gap-1 pl-7 pt-1">
                        {(ath.eventIds || []).map(evId => {
                          const ev = OFFICIAL_EVENTS.find(e => e.id === evId);
                          const isTrack = isTrackEvent(evId);
                          return (
                            <span
                              key={evId}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                isTrack
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {ev?.name || evId}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botón Editar Competidor y Eliminar (Exacto estilo karate) */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => setEditingAthlete({ ...ath })}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                        title="Editar los datos y pruebas de este alumno"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoachAthlete(ath)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar alumno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botón de WhatsApp al final del listado */}
          {schoolAthletes.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSendWhatsAppRoster}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center space-x-2 shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Cédula por WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE COMPETIDOR (ESTILO KARATE) */}
      {editingAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Editar Alumno</h3>
                  <p className="text-[11px] text-slate-500">Modifica su nombre, grado o pruebas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAthlete(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedAthlete} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editingAthlete.fullName}
                  onChange={(e) => setEditingAthlete({ ...editingAthlete, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rama / Sexo *</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingAthlete({ ...editingAthlete, gender: 'M' })}
                      className={`py-1.5 text-center rounded-xl border font-bold ${
                        editingAthlete.gender === 'M' ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Var
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAthlete({ ...editingAthlete, gender: 'F' })}
                      className={`py-1.5 text-center rounded-xl border font-bold ${
                        editingAthlete.gender === 'F' ? 'bg-pink-50 text-pink-700 border-pink-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      Fem
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grado Escolar *</label>
                  <select
                    value={editingAthlete.schoolGrade}
                    onChange={(e) => setEditingAthlete({ ...editingAthlete, schoolGrade: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="3">3º Primaria</option>
                    <option value="4">4º Primaria</option>
                    <option value="5">5º Primaria</option>
                    <option value="6">6º Primaria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dorsal (Bib #):</label>
                  <input
                    type="number"
                    value={editingAthlete.bibNumber || ''}
                    onChange={(e) => setEditingAthlete({ ...editingAthlete, bibNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-mono outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Nacimiento:</label>
                  <input
                    type="date"
                    value={editingAthlete.birthDate || ''}
                    onChange={(e) => setEditingAthlete({ ...editingAthlete, birthDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Pruebas */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pruebas en las que compite:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {OFFICIAL_EVENTS.map(ev => {
                    const isChecked = (editingAthlete.eventIds || []).includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer ${
                          isChecked ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const current = editingAthlete.eventIds || [];
                              const isAlready = current.includes(ev.id);
                              let next = [];
                              if (isAlready) {
                                next = current.filter(id => id !== ev.id);
                              } else {
                                const isIndividual = ev.type !== 'relevo';
                                const indivs = current.filter(id => OFFICIAL_EVENTS.find(e => e.id === id)?.type !== 'relevo');
                                if (isIndividual && indivs.length >= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS) {
                                  alert(`Máximo ${PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS} pruebas individuales.`);
                                  return;
                                }
                                next = [...current, ev.id];
                              }
                              setEditingAthlete({ ...editingAthlete, eventIds: next });
                            }}
                            className="rounded text-sky-600"
                          />
                          <span>{ev.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{ev.type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAthlete(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Relevos */}
      <RelayBuilderModal
        isOpen={isRelayModalOpen}
        onClose={() => setIsRelayModalOpen(false)}
        school={schoolInfo}
        availableAthletes={athletes}
        existingRelays={relays}
        onSaveRelay={onSaveRelay}
      />
    </div>
  );
}
