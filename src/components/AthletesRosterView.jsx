import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  X,
  School,
  Award,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Lock
} from 'lucide-react';
import { OFFICIAL_EVENTS, isTrackEvent, isFieldEvent } from '../constants/events';
import { exportMasterAthletesRosterToExcel } from '../utils/excelHandler';
import { generateMasterAthletesRosterPDF } from '../utils/pdfGenerator';
import { calculateAge, isRegistrationDeadlineExpired, formatDeadlineFriendly } from '../utils/timeFormatter';

const PAGE_SIZE = 30;

export default function AthletesRosterView({
  tournament,
  athletes = [],
  schools = [],
  onUpdateAthlete,
  onDeleteAthlete,
  isAdmin = false,
  onOpenAdminLogin
}) {
  const isDeadlineExpired = isRegistrationDeadlineExpired(tournament);
  const isLockedForTeacher = isDeadlineExpired && !isAdmin;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('ALL'); // ALL | M | F
  const [selectedSchoolId, setSelectedSchoolId] = useState('ALL');
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [sortField, setSortField] = useState('bibNumber'); // bibNumber | name | school
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllRows, setShowAllRows] = useState(false);

  // Modal de edición de atleta en padrón
  const [editingAthlete, setEditingAthlete] = useState(null);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGender, selectedSchoolId, selectedEventId, selectedGrade, sortField, sortAsc]);

  // Estadísticas globales del padrón
  const stats = useMemo(() => {
    const total = athletes.length;
    const boys = athletes.filter(a => a.gender === 'M').length;
    const girls = athletes.filter(a => a.gender === 'F').length;
    const schoolIds = new Set(athletes.map(a => a.schoolId).filter(Boolean));
    const totalRegistrations = athletes.reduce((acc, a) => acc + (a.eventIds?.length || 0), 0);

    return {
      total,
      boys,
      girls,
      schoolsCount: schoolIds.size,
      totalRegistrations
    };
  }, [athletes]);

  // Filtrado y ordenamiento de atletas
  const filteredAthletes = useMemo(() => {
    let result = [...athletes];

    // Búsqueda por texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(ath => {
        const school = schools.find(s => s.id === ath.schoolId);
        return (
          ath.fullName.toLowerCase().includes(term) ||
          String(ath.bibNumber || '').includes(term) ||
          (ath.curp && ath.curp.toLowerCase().includes(term)) ||
          (school && school.name.toLowerCase().includes(term)) ||
          (ath.schoolName && ath.schoolName.toLowerCase().includes(term))
        );
      });
    }

    // Filtro Rama
    if (selectedGender !== 'ALL') {
      result = result.filter(a => a.gender === selectedGender);
    }

    // Filtro Escuela
    if (selectedSchoolId !== 'ALL') {
      result = result.filter(a => a.schoolId === selectedSchoolId);
    }

    // Filtro Prueba
    if (selectedEventId !== 'ALL') {
      result = result.filter(a => (a.eventIds || []).includes(selectedEventId));
    }

    // Filtro Grado
    if (selectedGrade !== 'ALL') {
      result = result.filter(a => String(a.schoolGrade) === selectedGrade);
    }

    // Ordenamiento
    result.sort((a, b) => {
      let comp = 0;
      if (sortField === 'bibNumber') {
        const bibA = a.bibNumber !== null && a.bibNumber !== undefined ? Number(a.bibNumber) : 99999;
        const bibB = b.bibNumber !== null && b.bibNumber !== undefined ? Number(b.bibNumber) : 99999;
        comp = bibA - bibB;
      } else if (sortField === 'name') {
        comp = a.fullName.localeCompare(b.fullName);
      } else if (sortField === 'school') {
        const schA = schools.find(s => s.id === a.schoolId)?.name || '';
        const schB = schools.find(s => s.id === b.schoolId)?.name || '';
        comp = schA.localeCompare(schB);
      }
      return sortAsc ? comp : -comp;
    });

    return result;
  }, [athletes, schools, searchTerm, selectedGender, selectedSchoolId, selectedEventId, selectedGrade, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGender('ALL');
    setSelectedSchoolId('ALL');
    setSelectedEventId('ALL');
    setSelectedGrade('ALL');
  };

  const hasActiveFilters =
    searchTerm ||
    selectedGender !== 'ALL' ||
    selectedSchoolId !== 'ALL' ||
    selectedEventId !== 'ALL' ||
    selectedGrade !== 'ALL';

  const totalPages = Math.max(1, Math.ceil(filteredAthletes.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAthletes = useMemo(() => {
    if (showAllRows) return filteredAthletes;
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredAthletes.slice(start, start + PAGE_SIZE);
  }, [filteredAthletes, showAllRows, safePage]);

  const handleSaveAthleteEdit = (e) => {
    e.preventDefault();
    if (!editingAthlete) return;
    if (isLockedForTeacher) {
      setEditError(`El periodo de registro oficial cerró el ${formatDeadlineFriendly(tournament?.registrationDeadline)}. Se requiere acceso de Mesa de Control para modificar atletas.`);
      return;
    }

    if (!editingAthlete.fullName?.trim()) {
      setEditError('El nombre del alumno es obligatorio.');
      return;
    }

    if (editingAthlete.bibNumber !== null && editingAthlete.bibNumber !== undefined && String(editingAthlete.bibNumber).trim() !== '') {
      const targetBib = String(editingAthlete.bibNumber).trim();
      const collision = athletes.find(
        a => a.id !== editingAthlete.id && String(a.bibNumber ?? '').trim() === targetBib
      );
      if (collision) {
        setEditError(`El dorsal #${targetBib} ya pertenece a ${collision.fullName}. Usa otro número.`);
        return;
      }
    }

    const validGenderEvents = (editingAthlete.eventIds || []).filter(eId => {
      if (editingAthlete.gender === 'M' && eId === 'relevo_4x75m_femenil') return false;
      if (editingAthlete.gender === 'F' && eId === 'relevo_4x75m_varonil') return false;
      return true;
    });

    const isUnified = (tournament?.categoryGroupingMode || 'unified') === 'unified';
    const calculatedCategory = isUnified
      ? 'primaria_abierta'
      : (editingAthlete.schoolGrade === '3' || editingAthlete.schoolGrade === '4' ? 'infantil_menor' : 'infantil_mayor');

    const schoolObj = schools.find(s => s.id === editingAthlete.schoolId);

    onUpdateAthlete({
      ...editingAthlete,
      fullName: editingAthlete.fullName.trim(),
      schoolName: schoolObj?.name || editingAthlete.schoolName,
      categoryId: calculatedCategory,
      eventIds: validGenderEvents
    });
    setEditError('');
    setEditingAthlete(null);
  };

  const toggleEditEvent = (eventId) => {
    if (!editingAthlete) return;
    const ev = OFFICIAL_EVENTS.find(e => e.id === eventId);
    if (editingAthlete.gender === 'M' && eventId === 'relevo_4x75m_femenil') {
      setEditError('Un competidor varonil no puede inscribirse en Relevo 4x75m Femenil.');
      return;
    }
    if (editingAthlete.gender === 'F' && eventId === 'relevo_4x75m_varonil') {
      setEditError('Una competidora femenil no puede inscribirse en Relevo 4x75m Varonil.');
      return;
    }

    const current = editingAthlete.eventIds || [];
    let updated;
    if (current.includes(eventId)) {
      updated = current.filter(id => id !== eventId);
    } else {
      const isRelay = ev?.type === 'relevo' || eventId.includes('relevo');
      const indivCount = current.filter(id => {
        const item = OFFICIAL_EVENTS.find(e => e.id === id);
        return item?.type !== 'relevo' && !id.includes('relevo');
      }).length;
      const relayCount = current.filter(id => {
        const item = OFFICIAL_EVENTS.find(e => e.id === id);
        return item?.type === 'relevo' || id.includes('relevo');
      }).length;

      if (!isRelay && indivCount >= 2) {
        setEditError('Reglamento del Torneo: Máximo 2 pruebas individuales por competidor.');
        return;
      }
      if (isRelay && relayCount >= 2) {
        setEditError('Reglamento del Torneo: Máximo 2 pruebas de equipo / relevos por competidor.');
        return;
      }
      updated = [...current, eventId];
    }
    setEditError('');
    setEditingAthlete({ ...editingAthlete, eventIds: updated });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Encabezado Principal del Padrón */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Padrón General de Atletas
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-700 flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>Exclusivo Mesa de Control</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Directorio oficial centralizado con todos los alumnos inscritos, dorsales, escuelas y modalidades deportivas.
            </p>
          </div>
        </div>

        {/* Botones de Descarga Oficial */}
        <div className="flex items-center space-x-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => exportMasterAthletesRosterToExcel(athletes, schools, tournament)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Descargar padrón maestro completo en Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => generateMasterAthletesRosterPDF(athletes, schools, tournament)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            title="Generar planilla de cotejo en PDF para impresión"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Planilla PDF</span>
          </button>
        </div>
      </div>

      {/* Alerta de Cierre de Inscripciones por Fecha Límite */}
      {isLockedForTeacher && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center space-x-2.5 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Periodo de inscripción cerrado ({formatDeadlineFriendly(tournament?.registrationDeadline)}):</span>{' '}
              El padrón se encuentra en modo sólo lectura para evitar adiciones o modificaciones no autorizadas.
            </div>
          </div>
          {onOpenAdminLogin && (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="self-start sm:self-auto shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              Desbloquear Mesa de Control
            </button>
          )}
        </div>
      )}

      {/* Tarjetas de Estadísticas en Colores Pastel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-athletic text-xl font-bold flex-shrink-0">
            {stats.total}
          </div>
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Total Atletas</span>
            <span className="text-xs font-bold text-slate-900">{stats.total} Registrados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-athletic text-xl font-bold flex-shrink-0">
            {stats.boys}
          </div>
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Rama Varonil</span>
            <span className="text-xs font-bold text-sky-800">
              {stats.boys} ({stats.total ? Math.round((stats.boys / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center font-athletic text-xl font-bold flex-shrink-0">
            {stats.girls}
          </div>
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Rama Femenil</span>
            <span className="text-xs font-bold text-rose-800">
              {stats.girls} ({stats.total ? Math.round((stats.girls / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-athletic text-xl font-bold flex-shrink-0">
            {stats.schoolsCount}
          </div>
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Escuelas</span>
            <span className="text-xs font-bold text-emerald-800">{stats.schoolsCount} Participantes</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Buscador reactivo principal */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre del alumno, número de dorsal o escuela..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Fila de Selectores de Filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Rama */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Rama / Género
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="ALL">Todas las ramas</option>
              <option value="M">Varonil (Niños)</option>
              <option value="F">Femenil (Niñas)</option>
            </select>
          </div>

          {/* Escuela */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Escuela
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="ALL">Todas las escuelas</option>
              {schools.map(sch => (
                <option key={sch.id} value={sch.id}>
                  {sch.shortName || sch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prueba */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Prueba Oficial
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="ALL">Todas las pruebas</option>
              <optgroup label="Pruebas de Pista">
                {OFFICIAL_EVENTS.filter(e => isTrackEvent(e.id)).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </optgroup>
              <optgroup label="Pruebas de Campo">
                {OFFICIAL_EVENTS.filter(e => isFieldEvent(e.id)).map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Grado Escolar */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Grado Escolar
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="ALL">Todos los grados</option>
              <option value="3">3° Primaria</option>
              <option value="4">4° Primaria</option>
              <option value="5">5° Primaria</option>
              <option value="6">6° Primaria</option>
            </select>
          </div>
        </div>

        {/* Resumen del filtro y reseteo */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Mostrando <strong>{filteredAthletes.length}</strong> de <strong>{athletes.length}</strong> atletas inscritos
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla Maestra del Padrón */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {filteredAthletes.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs italic">
            No se encontraron atletas que coincidan con los criterios de búsqueda o filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors w-20 text-center"
                    onClick={() => toggleSort('bibNumber')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Dorsal</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Atleta (Nombre Completo)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-center">Rama</th>
                  <th className="py-3 px-3.5 text-center">Grado / Edad</th>
                  <th
                    className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSort('school')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Escuela Primaria</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3.5">Pruebas Inscritas</th>
                  <th className="py-3 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAthletes.map((athlete, idx) => {
                  const school = schools.find(s => s.id === athlete.schoolId);
                  const isBoy = athlete.gender === 'M';
                  const rowNum = showAllRows ? idx + 1 : (safePage - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <tr
                      key={athlete.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Consecutivo */}
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {rowNum}
                      </td>

                      {/* Dorsal */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="font-athletic text-base font-bold px-2 py-0.5 rounded-lg bg-slate-900 text-amber-300 border border-slate-700 shadow-2xs">
                          {athlete.bibNumber || 'S/N'}
                        </span>
                      </td>

                      {/* Nombre y CURP */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {athlete.fullName}
                        </div>
                        {athlete.curp && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            CURP: {athlete.curp}
                          </div>
                        )}
                      </td>

                      {/* Rama */}
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isBoy
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isBoy ? 'Varonil' : 'Femenil'}
                        </span>
                      </td>

                      {/* Grado y Edad */}
                      <td className="py-3 px-3.5 text-center text-slate-600 font-medium whitespace-nowrap">
                        <div>{athlete.schoolGrade ? `${athlete.schoolGrade}° Primaria` : '-'}</div>
                        {athlete.birthDate && (
                          <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                            {athlete.birthDate}
                            {calculateAge(athlete.birthDate) !== null && (
                              <span className="font-bold text-slate-800 ml-1">
                                ({calculateAge(athlete.birthDate)} años)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Escuela */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-800">
                          {school?.name || athlete.schoolName || 'Escuela Primaria'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {school?.zone || 'Zona Escolar'} {school?.coachName ? `• ${school.coachName}` : ''}
                        </div>
                      </td>

                      {/* Pruebas */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(athlete.eventIds || []).map(eId => {
                            const ev = OFFICIAL_EVENTS.find(e => e.id === eId);
                            const isTrack = isTrackEvent(eId);
                            const isRelay = eId.includes('relevo');

                            return (
                              <span
                                key={eId}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  isRelay
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : isTrack
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {ev?.name || eId}
                              </span>
                            );
                          })}
                          {(!athlete.eventIds || athlete.eventIds.length === 0) && (
                            <span className="text-[10px] text-slate-400 italic">Sin pruebas</span>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3.5 text-right">
                        {isLockedForTeacher ? (
                          <div className="flex items-center justify-end">
                            <span
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200"
                              title="Inscripciones concluidas por fecha límite oficial. Requiere clave de Mesa de Control para modificar."
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Cerrado</span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditError('');
                                setEditingAthlete({ ...athlete });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Editar datos del atleta"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Confirmas eliminar a ${athlete.fullName} del padrón general?`)) {
                                  onDeleteAthlete(athlete.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Eliminar del padrón"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Controles de Paginación para fluidez con +200 atletas */}
        {filteredAthletes.length > PAGE_SIZE && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium">
              {showAllRows
                ? `Mostrando los ${filteredAthletes.length} competidores`
                : `Mostrando ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredAthletes.length)} de ${filteredAthletes.length} competidores`}
            </span>
            <div className="flex items-center space-x-1.5">
              {!showAllRows && (
                <>
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-700">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowAllRows(prev => !prev)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors"
              >
                {showAllRows ? 'Paginar (30/pág)' : `Ver todos (${filteredAthletes.length})`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición Rápida de Atleta desde Mesa de Control */}
      {editingAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Editar Atleta en Padrón General
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAthlete(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAthleteEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nombre Completo del Alumno *
                </label>
                <input
                  type="text"
                  required
                  value={editingAthlete.fullName}
                  onChange={(e) => setEditingAthlete({ ...editingAthlete, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Número de Dorsal (#)
                  </label>
                  <input
                    type="number"
                    value={editingAthlete.bibNumber || ''}
                    onChange={(e) => setEditingAthlete({ ...editingAthlete, bibNumber: e.target.value ? parseInt(e.target.value, 10) : null })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Rama / Género *
                  </label>
                  <select
                    value={editingAthlete.gender}
                    onChange={(e) => setEditingAthlete({ ...editingAthlete, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="M">Varonil</option>
                    <option value="F">Femenil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Grado Escolar
                  </label>
                  <select
                    value={editingAthlete.schoolGrade || '5'}
                    onChange={(e) => setEditingAthlete({ ...editingAthlete, schoolGrade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {(tournament?.categoryGroupingMode || 'unified') === 'unified' && (
                      <>
                        <option value="1">1° Primaria</option>
                        <option value="2">2° Primaria</option>
                      </>
                    )}
                    <option value="3">3° Primaria</option>
                    <option value="4">4° Primaria</option>
                    <option value="5">5° Primaria</option>
                    <option value="6">6° Primaria</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Fecha Nacimiento:
                    {editingAthlete.birthDate && calculateAge(editingAthlete.birthDate) !== null && (
                      <span className="text-indigo-600 font-extrabold ml-1.5">
                        ({calculateAge(editingAthlete.birthDate)} años)
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={editingAthlete.birthDate || ''}
                    onChange={(e) => setEditingAthlete({ ...editingAthlete, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Escuela de Procedencia
                </label>
                <select
                  value={editingAthlete.schoolId || ''}
                  onChange={(e) => setEditingAthlete({ ...editingAthlete, schoolId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {schools.map(sch => (
                    <option key={sch.id} value={sch.id}>{sch.name}</option>
                  ))}
                </select>
              </div>

              {/* Selección de Pruebas */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Pruebas Asignadas (Máximo 2 individuales y 2 de equipo/relevos):
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {OFFICIAL_EVENTS.map(ev => {
                    const isSelected = (editingAthlete.eventIds || []).includes(ev.id);
                    const isIncompatibleRelay =
                      (editingAthlete.gender === 'M' && ev.id === 'relevo_4x75m_femenil') ||
                      (editingAthlete.gender === 'F' && ev.id === 'relevo_4x75m_varonil');

                    return (
                      <button
                        type="button"
                        key={ev.id}
                        disabled={isIncompatibleRelay}
                        onClick={() => toggleEditEvent(ev.id)}
                        className={`p-2.5 rounded-lg text-center border transition-all text-xs font-semibold ${
                          isIncompatibleRelay
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-indigo-600 border-indigo-700 text-white font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>{ev.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {editError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAthlete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}