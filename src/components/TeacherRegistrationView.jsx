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
  UserCheck,
  MapPin,
  Calendar,
  ArrowLeftRight,
  Building2
} from 'lucide-react';
import { OFFICIAL_EVENTS, isTrackEvent, isFieldEvent } from '../constants/events';
import { SCHOOL_CATEGORIES, PARTICIPATION_LIMITS } from '../constants/categories';
import { downloadExcelRegistrationTemplate, parseExcelAthletesFile } from '../utils/excelHandler';
import { calculateAge, isRegistrationDeadlineExpired, formatDeadlineFriendly } from '../utils/timeFormatter';
import RelayBuilderModal from './RelayBuilderModal';
import SchoolSelectorModal from './SchoolSelectorModal';

export default function TeacherRegistrationView({
  tournament,
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
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);

  // Datos de la Escuela del Maestro (guardados en localStorage como opción predeterminada)
  const [schoolInfo, setSchoolInfo] = useState(() => {
    try {
      const savedId = localStorage.getItem('atletismo_saved_school_id');
      if (savedId && Array.isArray(schools)) {
        const found = schools.find(s => s.id === savedId);
        if (found) return found;
      }
      const saved = localStorage.getItem('atletismo_saved_school_info');
      if (saved) return JSON.parse(saved);
    } catch (_) {}

    return schools[0] || {
      id: 'esc-1',
      name: 'Esc. Primaria Benito Juárez',
      shortName: 'Benito Juárez',
      cct: '21EPR0101A',
      zone: 'Zona Escolar 04',
      inspection: 'Inspección 12',
      coachName: 'Prof. Roberto González',
      phone: ''
    };
  });

  // Guardar escuela predeterminada al seleccionarla o registrarla
  const handleSelectSchool = (newSchool) => {
    setSchoolInfo(newSchool);
    try {
      localStorage.setItem('atletismo_saved_school_id', newSchool.id);
      localStorage.setItem('atletismo_saved_school_info', JSON.stringify(newSchool));
    } catch (_) {}
    setSuccessNotice(`¡Escuela "${newSchool.name}" establecida como tu opción predeterminada!`);
    setTimeout(() => setSuccessNotice(''), 4500);
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

  // Estado del modal de edición de competidor
  const [editingAthlete, setEditingAthlete] = useState(null);

  // Verificación de fecha límite de inscripciones
  const isDeadlineExpired = isRegistrationDeadlineExpired(tournament);
  const isLockedForTeacher = isDeadlineExpired && !isAdmin;

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
      const isIndividual = ev?.type !== 'relevo' && !eventId.includes('relevo');
      const isRelay = ev?.type === 'relevo' || eventId.includes('relevo');

      const currentIndividuals = currentList.filter(id => {
        const item = OFFICIAL_EVENTS.find(e => e.id === id);
        return item?.type !== 'relevo' && !id.includes('relevo');
      });

      const currentRelays = currentList.filter(id => {
        const item = OFFICIAL_EVENTS.find(e => e.id === id);
        return item?.type === 'relevo' || id.includes('relevo');
      });

      if (isIndividual && currentIndividuals.length >= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS) {
        alert(`Reglamento del Torneo: Máximo ${PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS} pruebas individuales por alumno.`);
        return;
      }

      if (isRelay && currentRelays.length >= PARTICIPATION_LIMITS.MAX_RELAY_EVENTS) {
        alert(`Reglamento del Torneo: Máximo ${PARTICIPATION_LIMITS.MAX_RELAY_EVENTS} pruebas de equipo / relevos por alumno.`);
        return;
      }

      next = [...currentList, eventId];
    }

    formSetter(prev => ({ ...prev, eventIds: next }));
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();

    if (isLockedForTeacher) {
      alert(`El período oficial de inscripciones concluyó el ${formatDeadlineFriendly(tournament.registrationDeadline)}. Los maestros ya no pueden registrar alumnos extemporáneos sin clave de Mesa de Control.`);
      return;
    }

    if (!athleteForm.fullName.trim()) {
      alert('Por favor ingresa el nombre completo del alumno.');
      return;
    }

    if (athleteForm.eventIds.length === 0) {
      alert('Selecciona al menos una prueba para el alumno.');
      return;
    }

    const isUnified = (tournament?.categoryGroupingMode || 'unified') === 'unified';
    const calculatedCategory = isUnified
      ? 'primaria_abierta'
      : (athleteForm.schoolGrade === '3' || athleteForm.schoolGrade === '4' ? 'infantil_menor' : 'infantil_mayor');

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

    if (isLockedForTeacher) {
      alert(`El período de inscripciones cerró el ${formatDeadlineFriendly(tournament.registrationDeadline)}. No es posible modificar datos de alumnos.`);
      return;
    }

    if (!editingAthlete.fullName?.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    if (!editingAthlete.eventIds || editingAthlete.eventIds.length === 0) {
      alert('Debes asignarle al menos una prueba.');
      return;
    }

    const isUnified = (tournament?.categoryGroupingMode || 'unified') === 'unified';
    const calculatedCategory = isUnified
      ? 'primaria_abierta'
      : (editingAthlete.schoolGrade === '3' || editingAthlete.schoolGrade === '4' ? 'infantil_menor' : 'infantil_mayor');

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
    if (isLockedForTeacher) {
      alert(`El período de inscripciones cerró el ${formatDeadlineFriendly(tournament.registrationDeadline)}. No es posible dar de baja a alumnos.`);
      return;
    }

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

    if (isLockedForTeacher) {
      alert(`El período de inscripciones cerró el ${formatDeadlineFriendly(tournament.registrationDeadline)}. No es posible subir archivos de alumnos.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setExcelLoading(true);
    try {
      const parsedList = await parseExcelAthletesFile(file, tournament?.categoryGroupingMode);
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

  // Compartir Cédula por WhatsApp
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

      {/* BANNER OFICIAL: SEDE, UBICACIÓN DEL EVENTO Y MODALIDAD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Sede Oficial del Evento
                </span>
                {tournament?.date && (
                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fecha: <strong className="text-slate-800">{tournament.date}</strong></span>
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {tournament?.venue || 'Pista de Atletismo Municipal y Estadio Escolar'}
              </h2>
              {tournament?.venueAddress && (
                <p className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                  <span className="text-rose-500 font-bold">📍 Dirección:</span>
                  <span className="font-medium text-slate-700">{tournament.venueAddress}</span>
                </p>
              )}
            </div>
          </div>

          {/* Indicador de Categoría Configurada */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 md:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Modalidad de Agrupación
            </span>
            <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
              {(tournament?.categoryGroupingMode || 'unified') === 'unified'
                ? '🤝 Categoría Única (Solo Varonil / Femenil)'
                : '📊 Subdividido por Grados (3°-4° y 5°-6°)'}
            </span>
            <span className="text-[11px] text-slate-500">
              {(tournament?.categoryGroupingMode || 'unified') === 'unified'
                ? 'Compiten juntos alumnos de todas las edades'
                : 'Competencias separadas por grado escolar'}
            </span>
          </div>
        </div>
      </div>

      {/* Banner de Cierre de Inscripciones por Fecha Límite */}
      {isDeadlineExpired && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          isLockedForTeacher
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isLockedForTeacher ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
            }`}>
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm">
                  {isLockedForTeacher
                    ? '🔒 Período de Inscripción de Alumnos Concluido'
                    : '⚠️ Inscripciones Cerradas para Maestros (Modo Mesa de Control Activo)'}
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLockedForTeacher ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  Fecha Límite: {formatDeadlineFriendly(tournament?.registrationDeadline)}
                </span>
              </div>
              <p className="text-[11px] mt-1 leading-relaxed text-slate-700">
                {isLockedForTeacher
                  ? 'La fecha límite acordada para la entrega de cédulas ha concluido. Por normativa para no alterar las series ni el rol de competencias, los maestros ya no pueden registrar, editar ni eliminar competidores. Si requieres un cambio extraordinario justificado, solicita apoyo a la Mesa de Control.'
                  : 'El plazo para los maestros ya venció y el portal público está bloqueado para ellos. Como juez o administrador con clave de Mesa de Control, tienes autorización para realizar modificaciones y registros extemporáneos.'}
              </p>
            </div>
          </div>
          {isLockedForTeacher && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs self-start sm:self-center"
            >
              Acceso Mesa de Control
            </button>
          )}
        </div>
      )}

      {/* Tarjeta de la Escuela con Botón para Cambiar/Registrar y Mesa de Control */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Cédula Escolar Oficial
                </span>
                {schoolInfo.cct && (
                  <span className="text-[10px] font-mono font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded-full border border-slate-700">
                    CCT: {schoolInfo.cct}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">• {schoolInfo.zone || 'Zona Escolar'}</span>
                {schoolInfo.inspection && (
                  <span className="text-xs text-slate-500 font-medium">• {schoolInfo.inspection}</span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                {schoolInfo.name}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Profesor(a) a cargo: <strong className="text-slate-800">{schoolInfo.coachName || 'Sin asignar'}</strong>
              </p>
            </div>
          </div>

          {/* Botones Integrados: Cambiar Escuela + Mesa de Control + Excel + Relevos */}
          <div className="flex flex-wrap items-center gap-2">
            {/* BOTÓN CLAVE: CAMBIAR O REGISTRAR ESCUELA */}
            <button
              type="button"
              onClick={() => setIsSchoolModalOpen(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Cambiar a otra escuela o registrar una nueva institución"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Cambiar / Registrar Escuela</span>
            </button>

            {/* BOTÓN PROMINENTE DE MESA DE CONTROL INTEGRADO */}
            <button
              type="button"
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
              disabled={excelLoading || isLockedForTeacher}
              className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs ${
                isLockedForTeacher
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
              title={isLockedForTeacher ? 'Carga masiva bloqueada por fecha límite' : 'Subir archivo Excel de alumnos'}
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
                  {(tournament?.categoryGroupingMode || 'unified') === 'unified' ? (
                    <>
                      <option value="1">1º Primaria</option>
                      <option value="2">2º Primaria</option>
                      <option value="3">3º Primaria</option>
                      <option value="4">4º Primaria</option>
                      <option value="5">5º Primaria</option>
                      <option value="6">6º Primaria</option>
                    </>
                  ) : (
                    <>
                      <option value="3">3º Primaria (Infantil Menor)</option>
                      <option value="4">4º Primaria (Infantil Menor)</option>
                      <option value="5">5º Primaria (Infantil Mayor)</option>
                      <option value="6">6º Primaria (Infantil Mayor)</option>
                    </>
                  )}
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha Nacimiento:
                  {athleteForm.birthDate && calculateAge(athleteForm.birthDate) !== null && (
                    <span className="text-rose-600 font-extrabold ml-1.5">
                      ({calculateAge(athleteForm.birthDate)} años)
                    </span>
                  )}
                </label>
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
              disabled={isLockedForTeacher}
              className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 ${
                isLockedForTeacher
                  ? 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {isLockedForTeacher ? <Lock className="w-4 h-4 text-slate-500" /> : <Check className="w-4 h-4" />}
              <span>{isLockedForTeacher ? 'Inscripciones Cerradas por Fecha Límite' : 'Inscribir Alumno en la Cédula'}</span>
            </button>
          </form>
        </div>

        {/* Padrón y Gestión de Atletas de la Escuela (7 Columnas) */}
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

            {/* Listado de Tarjetas de Alumnos (con Botón Editar Claro) */}
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
                        <span>Categoría: <strong className="text-slate-700">
                          {(tournament?.categoryGroupingMode || 'unified') === 'unified'
                            ? `Primaria Única (${ath.gender === 'F' ? 'Femenil' : 'Varonil'})`
                            : (ath.categoryId === 'infantil_menor' ? 'Inf. Menor (3°-4°)' : 'Inf. Mayor (5°-6°)')}
                        </strong></span>
                        {ath.birthDate && (
                          <span>
                            Nac: <strong className="text-slate-700">{ath.birthDate}</strong>
                            {calculateAge(ath.birthDate) !== null && (
                              <span className="text-slate-800 font-bold ml-1">
                                ({calculateAge(ath.birthDate)} años)
                              </span>
                            )}
                          </span>
                        )}
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

                    {/* Botón Editar Competidor y Eliminar */}
                    {isLockedForTeacher ? (
                      <div className="flex items-center space-x-1 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                        <span
                          className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg flex items-center space-x-1"
                          title="Inscripciones cerradas por fecha límite. Solo la Mesa de Control puede modificar."
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Bloqueado</span>
                        </span>
                      </div>
                    ) : (
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
                    )}
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

      {/* MODAL DE EDICIÓN DE COMPETIDOR */}
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
                    {(tournament?.categoryGroupingMode || 'unified') === 'unified' ? (
                      <>
                        <option value="1">1º Primaria</option>
                        <option value="2">2º Primaria</option>
                        <option value="3">3º Primaria</option>
                        <option value="4">4º Primaria</option>
                        <option value="5">5º Primaria</option>
                        <option value="6">6º Primaria</option>
                      </>
                    ) : (
                      <>
                        <option value="3">3º Primaria (Infantil Menor)</option>
                        <option value="4">4º Primaria (Infantil Menor)</option>
                        <option value="5">5º Primaria (Infantil Mayor)</option>
                        <option value="6">6º Primaria (Infantil Mayor)</option>
                      </>
                    )}
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fecha Nacimiento:
                    {editingAthlete.birthDate && calculateAge(editingAthlete.birthDate) !== null && (
                      <span className="text-rose-600 font-extrabold ml-1.5">
                        ({calculateAge(editingAthlete.birthDate)} años)
                      </span>
                    )}
                  </label>
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
                                const isIndividual = ev.type !== 'relevo' && !ev.id.includes('relevo');
                                const isRelay = ev.type === 'relevo' || ev.id.includes('relevo');
                                const indivs = current.filter(id => {
                                  const item = OFFICIAL_EVENTS.find(e => e.id === id);
                                  return item?.type !== 'relevo' && !id.includes('relevo');
                                });
                                const relays = current.filter(id => {
                                  const item = OFFICIAL_EVENTS.find(e => e.id === id);
                                  return item?.type === 'relevo' || id.includes('relevo');
                                });

                                if (isIndividual && indivs.length >= PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS) {
                                  alert(`Reglamento del Torneo: Máximo ${PARTICIPATION_LIMITS.MAX_INDIVIDUAL_EVENTS} pruebas individuales.`);
                                  return;
                                }
                                if (isRelay && relays.length >= PARTICIPATION_LIMITS.MAX_RELAY_EVENTS) {
                                  alert(`Reglamento del Torneo: Máximo ${PARTICIPATION_LIMITS.MAX_RELAY_EVENTS} pruebas de equipo / relevos.`);
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

      {/* Modal de Selección y Registro de Escuela con Anti-Duplicados */}
      <SchoolSelectorModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        schools={schools}
        currentSchool={schoolInfo}
        onSelectSchool={handleSelectSchool}
        onSaveSchool={onSaveSchool}
      />
    </div>
  );
}
