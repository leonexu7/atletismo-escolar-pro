import React, { useState } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Award,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  School,
  FileText,
  ArrowLeft,
  ChevronRight,
  Filter,
  Check,
  Download
} from 'lucide-react';
import { OFFICIAL_EVENTS, isFieldEvent, isTrackEvent, isRelayEvent } from '../constants/events';
import { computeTournamentEventStatus } from '../utils/athleticsEngine';
import { generateAwardPresentationSheetPDF } from '../utils/pdfGenerator';
import { evaluateFieldAttempts, rankFieldEventCompetitors, rankTrackEventRunners } from '../utils/tieBreaker';

export default function ControlDeskView({
  tournament,
  athletes = [],
  relays = [],
  schools = [],
  results = {},
  onSelectEventForPodium,
  onMarkEventAwarded,
  onReturnToRegistration
}) {
  const [filterType, setFilterType] = useState('all'); // all | pista | relevos | campo

  const eventStatusList = computeTournamentEventStatus(OFFICIAL_EVENTS, {
    results,
    athletes,
    relays,
    schools
  });

  // Contar ramas individuales y relevos listos para premiar
  const readyBranches = [];
  eventStatusList.forEach(item => {
    if (item.isRelay) {
      if (item.isReadyForAwards) {
        readyBranches.push({ event: item.event, gender: item.event.applicableGenders?.[0] || 'MIXED', label: 'Única' });
      }
    } else {
      if (item.byGender?.M?.isReadyForAwards) {
        readyBranches.push({ event: item.event, gender: 'M', label: 'Varonil' });
      }
      if (item.byGender?.F?.isReadyForAwards) {
        readyBranches.push({ event: item.event, gender: 'F', label: 'Femenil' });
      }
    }
  });
  const completedOrAwardedCount = eventStatusList.filter(e => e.status === 'completed' || e.status === 'awarded').length;

  const getRankedForEvent = (ev, gender = null) => {
    const eventId = ev.id;
    const isField = isFieldEvent(eventId);
    const isRelay = isRelayEvent(eventId);
    const eventResults = results[eventId] || {};

    if (isRelay) {
      const enrolledRelays = (relays || []).filter(r => r.eventId === eventId);
      const trackData = eventResults.trackEntries || [];
      const evaluated = enrolledRelays.map(relay => {
        const school = schools.find(s => s.id === relay.schoolId);
        const found = trackData.find(e => e.athleteId === relay.id);
        const memberObjs = (relay.members || []).map(id => athletes.find(a => a.id === id)).filter(Boolean);
        const bibSummary = memberObjs.map(m => m.bibNumber).filter(Boolean).join('/');
        return {
          id: relay.id,
          fullName: `Equipo ${relay.schoolName || school?.name || 'Escuela'}`,
          schoolName: memberObjs.map(m => m.fullName.split(' ')[0]).join(', ') || (school?.name || 'Escuela Primaria'),
          bibNumber: bibSummary || 'EQ',
          timeSeconds: found?.timeSeconds || null,
          status: found?.status || (found?.timeSeconds ? 'valid' : 'pending'),
          statusReason: found?.statusReason || ''
        };
      });
      return rankTrackEventRunners(evaluated);
    }

    const enrolledAthletes = athletes
      .filter(a => (a.eventIds || []).includes(eventId) && (!gender || a.gender === gender))
      .map(a => {
        const school = schools.find(s => s.id === a.schoolId);
        return {
          ...a,
          schoolName: school?.name || 'Escuela Primaria'
        };
      });

    if (isField) {
      const fieldData = eventResults.fieldEntries || [];
      const evaluated = enrolledAthletes.map(ath => {
        const found = fieldData.find(e => e.athleteId === ath.id);
        const attempts = found?.attempts || [];
        const tech = evaluateFieldAttempts(attempts);
        return { ...ath, ...tech };
      });
      return rankFieldEventCompetitors(evaluated);
    }

    const trackData = eventResults.trackEntries || [];
    const evaluated = enrolledAthletes.map(ath => {
      const found = trackData.find(e => e.athleteId === ath.id);
      return {
        ...ath,
        timeSeconds: found?.timeSeconds || null,
        status: found?.status || (found?.timeSeconds ? 'valid' : 'pending'),
        statusReason: found?.statusReason || ''
      };
    });
    return rankTrackEventRunners(evaluated);
  };

  const handlePrintAwardSheet = (ev, gender = null) => {
    const ranked = getRankedForEvent(ev, gender);

    if (!ranked || ranked.length === 0) {
      alert('Aún no hay competidores registrados en esta categoría.');
      return;
    }

    const genderLabel = ev.id.includes('mixto')
      ? 'Mixto'
      : gender === 'F' || ev.id.includes('femenil')
      ? 'Femenil'
      : gender === 'M' || ev.id.includes('varonil')
      ? 'Varonil'
      : 'Oficial';

    generateAwardPresentationSheetPDF(ranked, ev, tournament, genderLabel);
  };

  const filteredEvents = eventStatusList.filter(item => {
    if (filterType === 'pista') return isTrackEvent(item.event.id) && !item.isRelay;
    if (filterType === 'relevos') return item.isRelay;
    if (filterType === 'campo') return isFieldEvent(item.event.id);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Barra Superior de Navegación Rápida */}
      <div className="flex items-center justify-between">
        {onReturnToRegistration && (
          <button
            onClick={onReturnToRegistration}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Volver a Registro de Alumnos</span>
          </button>
        )}

        <div className="flex items-center space-x-1.5 text-xs text-slate-500 ml-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">Mesa de Control Activa</span>
        </div>
      </div>

      {/* Encabezado y Métricas */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Mesa de Control Central</h2>
              <p className="text-xs text-slate-500">
                Monitoreo simultáneo de las 11 pruebas oficiales de primaria. Recepción de marcas en vivo.
              </p>
            </div>
          </div>

          {readyBranches.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center space-x-2.5">
              <Trophy className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-800 block">
                  ¡{readyBranches.length} {readyBranches.length === 1 ? 'CATEGORÍA LISTA' : 'CATEGORÍAS LISTAS'} PARA PREMIAR!
                </span>
                <span className="text-[11px] text-emerald-600">
                  Podios cerrados por rama para entrega inmediata de medallas.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas de Métricas en Colores Pastel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-100/80">
            <div className="flex items-center justify-between text-sky-700 text-xs mb-1">
              <span className="font-medium">Atletas Inscritos</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black text-slate-900 font-athletic">{athletes.length}</span>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100/80">
            <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
              <span className="font-medium">Escuelas</span>
              <School className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black text-slate-900 font-athletic">{schools.length}</span>
          </div>

          <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100/80">
            <div className="flex items-center justify-between text-rose-700 text-xs mb-1">
              <span className="font-medium">Concluidas</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black text-slate-900 font-athletic">
              {completedOrAwardedCount} <span className="text-sm font-normal text-slate-400">/ 11</span>
            </span>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
            <div className="flex items-center justify-between text-amber-800 text-xs mb-1">
              <span className="font-medium">Listas p/ Premiar</span>
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-2xl font-black text-amber-800 font-athletic">
              {readyBranches.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros Pastel de Pruebas */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filterType === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todas las Pruebas (11)
        </button>
        <button
          onClick={() => setFilterType('pista')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filterType === 'pista'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          🏃 Pista Individual (4)
        </button>
        <button
          onClick={() => setFilterType('relevos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filterType === 'relevos'
              ? 'bg-sky-500 text-white shadow-2xs'
              : 'bg-white text-sky-700 hover:bg-sky-50 border border-sky-200'
          }`}
        >
          🤝 Relevos 4x75m (3)
        </button>
        <button
          onClick={() => setFilterType('campo')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filterType === 'campo'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          🎯 Campo (4)
        </button>
      </div>

      {/* Tablero de Pruebas */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEvents.map(statusItem => {
            const ev = statusItem.event;
            const isCompleted = statusItem.status === 'completed';
            const isAwarded = statusItem.status === 'awarded';
            const isInProgress = statusItem.status === 'in_progress';
            const unitLabel = statusItem.participantUnit || (statusItem.isRelay ? 'equipos' : 'atletas');
            const mStat = statusItem.byGender?.M;
            const fStat = statusItem.byGender?.F;
            const anyBranchReady = statusItem.isRelay
              ? isCompleted
              : Boolean(mStat?.isReadyForAwards || fStat?.isReadyForAwards);

            return (
              <div
                key={ev.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-white shadow-2xs hover:shadow-xs ${
                  isCompleted || anyBranchReady
                    ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/15'
                    : isAwarded
                    ? 'border-slate-200 opacity-90'
                    : isInProgress
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {ev.category}
                    </span>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isCompleted || anyBranchReady
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black'
                        : isAwarded
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : isInProgress
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isCompleted || anyBranchReady ? '¡Lista p/ Premiar!' : isAwarded ? 'Premiada' : isInProgress ? 'En Curso' : 'Pendiente'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-2">{ev.name}</h4>

                  {/* Barra de Progreso General */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Captura de marcas:</span>
                      <span className="font-semibold text-slate-700">{statusItem.completedCount} de {statusItem.totalParticipants} {unitLabel}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted || isAwarded ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${statusItem.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Desglose independiente Varonil / Femenil para pruebas individuales */}
                  {!statusItem.isRelay && (mStat || fStat) && (
                    <div className="grid grid-cols-2 gap-1.5 mb-3 text-[10px]">
                      {[
                        { key: 'M', label: 'Var', stat: mStat, badgeCls: 'bg-sky-50 text-sky-800 border-sky-200' },
                        { key: 'F', label: 'Fem', stat: fStat, badgeCls: 'bg-rose-50 text-rose-800 border-rose-200' }
                      ].map(({ key, label, stat, badgeCls }) => (
                        <div key={key} className={`p-1.5 rounded-xl border ${badgeCls} flex flex-col justify-between gap-1`}>
                          <div className="flex items-center justify-between font-bold">
                            <span>{label}: {stat?.completedCount || 0}/{stat?.totalParticipants || 0}</span>
                            {stat?.isAwarded ? (
                              <span className="text-emerald-700">✓</span>
                            ) : stat?.isReadyForAwards ? (
                              <span className="text-emerald-700 font-black">Listo</span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onSelectEventForPodium(ev.id, key)}
                              className="flex-1 py-0.5 px-1 bg-white/90 hover:bg-white rounded text-[10px] font-bold border border-slate-200/80 text-slate-700"
                              title={`Ver podio ${label === 'Var' ? 'Varonil' : 'Femenil'}`}
                            >
                              Podio
                            </button>
                            {(stat?.isReadyForAwards || stat?.isAwarded) && (
                              <button
                                type="button"
                                onClick={() => handlePrintAwardSheet(ev, key)}
                                className="py-0.5 px-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold border border-amber-300"
                                title={`Hoja Premiación ${label === 'Var' ? 'Varonil' : 'Femenil'}`}
                              >
                                PDF
                              </button>
                            )}
                            {stat?.isReadyForAwards && (
                              <button
                                type="button"
                                onClick={() => onMarkEventAwarded(ev.id, key)}
                                className="p-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                                title={`Marcar ${label === 'Var' ? 'Varonil' : 'Femenil'} premiada`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones para Relevos o Vista Rápida */}
                {statusItem.isRelay && (
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectEventForPodium(ev.id, ev.applicableGenders?.[0] || 'MIXED')}
                      className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ver Podio</span>
                    </button>

                    {(isCompleted || isAwarded) && (
                      <button
                        onClick={() => handlePrintAwardSheet(ev, ev.applicableGenders?.[0] || 'MIXED')}
                        title="Descargar Hoja Oficial de Premiación de Lugares en PDF"
                        className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-600" />
                        <span>Premiación</span>
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => onMarkEventAwarded(ev.id, ev.applicableGenders?.[0] || 'MIXED')}
                        title="Marcar medallas como entregadas"
                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
