import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from './components/Navbar';
import TeacherRegistrationView from './components/TeacherRegistrationView';
import TrackJudgeView from './components/TrackJudgeView';
import FieldJudgeView from './components/FieldJudgeView';
import ControlDeskView from './components/ControlDeskView';
import LiveResultsView from './components/LiveResultsView';
import AthletesRosterView from './components/AthletesRosterView';
import AdminLoginModal from './components/AdminLoginModal';
import TournamentSettingsModal from './components/TournamentSettingsModal';
import CloudSyncModal from './components/CloudSyncModal';

import {
  loadTournamentState,
  saveTournamentState,
  purgeAllTournamentData,
  clearSavedTeacherSchool,
  getRoomCodeFromUrl,
  DEFAULT_TOURNAMENT_INFO,
  STORAGE_KEY
} from './utils/storage';
import { DEMO_ATHLETES, DEMO_SCHOOLS, DEMO_INITIAL_RESULTS, generateLargeStressTournamentData } from './constants/mockData';
import { OFFICIAL_EVENTS } from './constants/events';
import { computeTournamentEventStatus } from './utils/athleticsEngine';
import {
  subscribeToLiveTournament,
  syncFullTournamentToCloud,
  syncEventEntriesToCloud,
  syncSchoolMutationToCloud,
  syncAthletesMutationToCloud,
  syncRelayMutationToCloud,
  syncTournamentSettingsToCloud,
  purgeCloudTournamentData
} from './services/cloudSync';

export default function App() {
  const [state, setState] = useState(() => {
    const urlRoom = getRoomCodeFromUrl();
    // Si ya existe registro persistido en localStorage (incluso si está en ceros tras vaciar) o viene ?room= en URL
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw || urlRoom) {
      return loadTournamentState();
    }
    // Solo en la primera apertura sin datos previos se cargan los datos de demostración
    return {
      tournament: DEFAULT_TOURNAMENT_INFO,
      schools: DEMO_SCHOOLS,
      athletes: DEMO_ATHLETES,
      relays: [],
      results: DEMO_INITIAL_RESULTS,
      cloudSession: { enabled: true, userExplicitlyChoseOffline: false, roomCode: 'ATLETISMO-2026' }
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Pestaña inicial: Portal de Maestros (Inscripciones)
  const [activeTab, setActiveTab] = useState('registration');
  const [selectedPodiumEventId, setSelectedPodiumEventId] = useState('campo_longitud');
  const [selectedPodiumGender, setSelectedPodiumGender] = useState(null);

  // Estado de Administrador (Protege la Mesa de Control y Ajustes)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Guardar en localStorage
  useEffect(() => {
    saveTournamentState(state);
  }, [state]);

  // Suscripción Nube en Vivo
  useEffect(() => {
    if (!state.cloudSession?.enabled) return;

    const unsubscribe = subscribeToLiveTournament(
      state.cloudSession.roomCode,
      (cloudData) => {
        if (cloudData && typeof cloudData === 'object') {
          setState(prev => {
            // Si en Firebase se ordenó vaciar el torneo a ceros (isPurged)
            if (cloudData.isPurged) {
              clearSavedTeacherSchool();
              return {
                ...prev,
                athletes: [],
                schools: [],
                relays: [],
                results: {},
                activeRaceSession: null,
                tournament: cloudData.tournament ? { ...prev.tournament, ...cloudData.tournament } : prev.tournament
              };
            }

            return {
              ...prev,
              results: { ...(prev.results || {}), ...(cloudData.results || {}) },
              athletes: Array.isArray(cloudData.athletes) ? cloudData.athletes : prev.athletes,
              schools: Array.isArray(cloudData.schools) ? cloudData.schools : prev.schools,
              relays: Array.isArray(cloudData.relays) ? cloudData.relays : prev.relays,
              tournament: cloudData.tournament ? { ...prev.tournament, ...cloudData.tournament } : prev.tournament,
              activeRaceSession: cloudData.activeRaceSession !== undefined ? cloudData.activeRaceSession : prev.activeRaceSession
            };
          });
        }
      }
    );

    return () => unsubscribe();
  }, [state.cloudSession?.enabled, state.cloudSession?.roomCode]);

  const readyAwardsCount = useMemo(() => {
    const statusList = computeTournamentEventStatus(OFFICIAL_EVENTS, state);
    return statusList.reduce((acc, s) => {
      if (s.isRelay) return acc + (s.isReadyForAwards ? 1 : 0);
      const maleReady = s.byGender?.M?.isReadyForAwards ? 1 : 0;
      const femaleReady = s.byGender?.F?.isReadyForAwards ? 1 : 0;
      return acc + maleReady + femaleReady;
    }, 0);
  }, [state]);

  // Sincronización automática de respaldo completo cuando se reemplaza todo el torneo
  const pushStateToCloudIfOnline = (partialOrUpdatedState) => {
    const curr = stateRef.current;
    if (curr.cloudSession?.enabled) {
      syncFullTournamentToCloud(curr.cloudSession.roomCode, {
        ...curr,
        ...partialOrUpdatedState
      });
    }
  };

  // Handlers de Resultados (fusión atómica por athleteId/teamId para evitar sobreescrituras entre estaciones)
  const mergeEntriesById = (existingList = [], incomingList = []) => {
    const map = new Map();
    existingList.forEach(item => {
      const key = item?.athleteId || item?.id;
      if (key) map.set(key, item);
    });
    incomingList.forEach(item => {
      const key = item?.athleteId || item?.id;
      if (key) map.set(key, item);
    });
    return Array.from(map.values());
  };

  const handleSaveTrackResult = (eventId, trackEntries, meta = {}) => {
    const curr = stateRef.current;
    const prevEvent = curr.results?.[eventId] || {};
    const mergedTrack = mergeEntriesById(prevEvent.trackEntries || [], trackEntries || []);

    setState(prev => {
      const evPrev = prev.results?.[eventId] || {};
      const nextTrack = mergeEntriesById(evPrev.trackEntries || [], trackEntries || []);
      const nextAwardedByGender = meta.gender
        ? { ...(evPrev.awardedByGender || {}), [meta.gender]: false }
        : evPrev.awardedByGender;
      return {
        ...prev,
        results: {
          ...prev.results,
          [eventId]: {
            ...evPrev,
            trackEntries: nextTrack,
            ...(nextAwardedByGender ? { awardedByGender: nextAwardedByGender } : {}),
            isAwarded: false,
            lastUpdated: new Date().toISOString()
          }
        }
      };
    });

    if (curr.cloudSession?.enabled) {
      syncEventEntriesToCloud(curr.cloudSession.roomCode, eventId, {
        type: 'track',
        entries: trackEntries || mergedTrack,
        resetAwarded: true,
        awardedGender: meta.gender || null,
        fallbackResults: curr.results
      });
    }
  };

  const handleSaveFieldResult = (eventId, fieldEntries, meta = {}) => {
    const curr = stateRef.current;
    const prevEvent = curr.results?.[eventId] || {};
    const mergedField = mergeEntriesById(prevEvent.fieldEntries || [], fieldEntries || []);

    setState(prev => {
      const evPrev = prev.results?.[eventId] || {};
      const nextField = mergeEntriesById(evPrev.fieldEntries || [], fieldEntries || []);
      const nextAwardedByGender = meta.gender
        ? { ...(evPrev.awardedByGender || {}), [meta.gender]: false }
        : evPrev.awardedByGender;
      return {
        ...prev,
        results: {
          ...prev.results,
          [eventId]: {
            ...evPrev,
            fieldEntries: nextField,
            ...(nextAwardedByGender ? { awardedByGender: nextAwardedByGender } : {}),
            isAwarded: false,
            lastUpdated: new Date().toISOString()
          }
        }
      };
    });

    if (curr.cloudSession?.enabled) {
      syncEventEntriesToCloud(curr.cloudSession.roomCode, eventId, {
        type: 'field',
        entries: fieldEntries || mergedField,
        resetAwarded: true,
        awardedGender: meta.gender || null,
        fallbackResults: curr.results
      });
    }
  };

  const handleMarkEventAwarded = (eventId, gender = null) => {
    const curr = stateRef.current;

    setState(prev => {
      const evPrev = prev.results?.[eventId] || {};
      const nextAwardedByGender = gender
        ? { ...(evPrev.awardedByGender || {}), [gender]: true }
        : evPrev.awardedByGender;
      return {
        ...prev,
        results: {
          ...prev.results,
          [eventId]: {
            ...evPrev,
            ...(nextAwardedByGender ? { awardedByGender: nextAwardedByGender } : {}),
            isAwarded: gender ? evPrev.isAwarded : true
          }
        }
      };
    });

    if (curr.cloudSession?.enabled) {
      syncEventEntriesToCloud(curr.cloudSession.roomCode, eventId, {
        type: 'track',
        entries: null,
        resetAwarded: false,
        awardedGender: gender,
        isAwarded: true,
        fallbackResults: curr.results
      });
    }
  };

  // Handlers de Alumnos con Transacciones Atómicas en Nube (sin efectos dentro de setState)
  const handleRegisterAthlete = (athlete) => {
    const curr = stateRef.current;
    setState(prev => ({
      ...prev,
      athletes: [...prev.athletes.filter(a => a.id !== athlete.id), athlete]
    }));

    if (curr.cloudSession?.enabled) {
      syncAthletesMutationToCloud(curr.cloudSession.roomCode, {
        upsert: [athlete],
        fallbackAthletes: curr.athletes
      }).then(res => {
        if (res?.success && res.reassignedCount > 0 && Array.isArray(res.athletes)) {
          setState(prev => ({ ...prev, athletes: res.athletes }));
        }
      });
    }
  };

  const handleRegisterBatchAthletes = (batchList) => {
    if (!Array.isArray(batchList) || batchList.length === 0) return;
    const curr = stateRef.current;
    const batchIds = new Set(batchList.map(b => b.id));

    setState(prev => ({
      ...prev,
      athletes: [...prev.athletes.filter(a => !batchIds.has(a.id)), ...batchList]
    }));

    if (curr.cloudSession?.enabled) {
      syncAthletesMutationToCloud(curr.cloudSession.roomCode, {
        upsert: batchList,
        fallbackAthletes: curr.athletes
      }).then(res => {
        if (res?.success && res.reassignedCount > 0 && Array.isArray(res.athletes)) {
          setState(prev => ({ ...prev, athletes: res.athletes }));
        }
      });
    }
  };

  const handleUpdateAthlete = (updatedAthlete) => {
    const curr = stateRef.current;
    setState(prev => ({
      ...prev,
      athletes: prev.athletes.map(a => a.id === updatedAthlete.id ? updatedAthlete : a)
    }));

    if (curr.cloudSession?.enabled) {
      syncAthletesMutationToCloud(curr.cloudSession.roomCode, {
        upsert: [updatedAthlete],
        fallbackAthletes: curr.athletes
      });
    }
  };

  const handleDeleteAthlete = (athleteId) => {
    const curr = stateRef.current;
    setState(prev => ({
      ...prev,
      athletes: prev.athletes.filter(a => a.id !== athleteId)
    }));

    if (curr.cloudSession?.enabled) {
      syncAthletesMutationToCloud(curr.cloudSession.roomCode, {
        deleteIds: [athleteId],
        fallbackAthletes: curr.athletes
      });
    }
  };

  const handleSaveRelay = (relayTeam) => {
    const curr = stateRef.current;
    setState(prev => ({
      ...prev,
      relays: [...(prev.relays || []).filter(r => r.id !== relayTeam.id), relayTeam]
    }));

    if (curr.cloudSession?.enabled) {
      syncRelayMutationToCloud(curr.cloudSession.roomCode, {
        upsertRelay: relayTeam,
        fallbackRelays: curr.relays
      });
    }
  };

  const handleDeleteRelay = (relayId) => {
    const curr = stateRef.current;
    setState(prev => ({
      ...prev,
      relays: (prev.relays || []).filter(r => r.id !== relayId)
    }));

    if (curr.cloudSession?.enabled) {
      syncRelayMutationToCloud(curr.cloudSession.roomCode, {
        deleteRelayId: relayId,
        fallbackRelays: curr.relays
      });
    }
  };

  const handleSaveSchool = (schoolData) => {
    const curr = stateRef.current;
    setState(prev => {
      const existingIdx = (prev.schools || []).findIndex(s => s.id === schoolData.id);
      let updatedSchools;
      if (existingIdx !== -1) {
        updatedSchools = [...prev.schools];
        updatedSchools[existingIdx] = { ...updatedSchools[existingIdx], ...schoolData };
      } else {
        updatedSchools = [...prev.schools, schoolData];
      }
      return { ...prev, schools: updatedSchools };
    });

    if (curr.cloudSession?.enabled) {
      syncSchoolMutationToCloud(curr.cloudSession.roomCode, schoolData, curr.schools);
    }
  };

  const handleSaveTournament = (updatedTournament, fullReplacement = null) => {
    const curr = stateRef.current;
    if (fullReplacement) {
      setState(fullReplacement);
      pushStateToCloudIfOnline(fullReplacement);
    } else {
      setState(prev => ({ ...prev, tournament: updatedTournament }));
      if (curr.cloudSession?.enabled) {
        syncTournamentSettingsToCloud(curr.cloudSession.roomCode, updatedTournament);
      }
    }
  };

  const handleLoadDemoData = () => {
    const demo = {
      tournament: DEFAULT_TOURNAMENT_INFO,
      schools: DEMO_SCHOOLS,
      athletes: DEMO_ATHLETES,
      relays: [],
      results: DEMO_INITIAL_RESULTS,
      cloudSession: { enabled: true, userExplicitlyChoseOffline: false, roomCode: 'ATLETISMO-2026' }
    };
    setState(demo);
    pushStateToCloudIfOnline(demo);
  };

  const handleLoadLargeSimulation = () => {
    const sim = generateLargeStressTournamentData();
    const fullSimState = {
      tournament: DEFAULT_TOURNAMENT_INFO,
      schools: sim.schools,
      athletes: sim.athletes,
      relays: [],
      results: sim.results,
      cloudSession: { enabled: true, userExplicitlyChoseOffline: false, roomCode: 'ATLETISMO-2026' }
    };
    setState(fullSimState);
    pushStateToCloudIfOnline(fullSimState);
  };

  const handleResetToZero = async () => {
    const currentRoom = state.cloudSession?.roomCode || 'ATLETISMO-2026';

    // 1. Limpiar estado local manteniendo la sala y la nube conectada
    const clean = purgeAllTournamentData(state.cloudSession);
    setState(clean);

    // 2. Vaciar de forma definitiva en Firebase para que no queden competidores residuales
    try {
      await purgeCloudTournamentData(currentRoom, clean.tournament);
      alert('¡Torneo vaciado a cero! Se borraron todos los competidores, escuelas y marcas tanto en este equipo como en la nube de Firebase, manteniendo la sala activa.');
    } catch (err) {
      console.warn('Detalle al sincronizar vaciado con Firebase:', err);
      alert('¡Datos locales vaciados a cero! (Nota: Se presentó un detalle de red al sincronizar con Firebase: ' + (err.message || 'Error de conexión') + ')');
    }
  };

  const handleSelectEventForPodium = (eventId, gender = null) => {
    setSelectedPodiumEventId(eventId);
    setSelectedPodiumGender(gender);
    setActiveTab('live_results');
  };

  // Autenticación de Administrador exitosa
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setActiveTab('control_desk');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    if (activeTab === 'control_desk' || activeTab === 'athletes_roster') {
      setActiveTab('registration');
    }
  };

  useEffect(() => {
    if (activeTab === 'athletes_roster' && !isAdmin) {
      setActiveTab('registration');
    }
  }, [activeTab, isAdmin]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-rose-500 selection:text-white">
      {/* Barra de Navegación Minimalista Pastel */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tournament={state.tournament}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={handleAdminLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        cloudSession={state.cloudSession}
        readyAwardsCount={readyAwardsCount}
        athletesCount={state.athletes.length}
      />

      {/* Contenido Principal */}
      <main className="flex-1 pb-10">
        {activeTab === 'registration' && (
          <TeacherRegistrationView
            tournament={state.tournament}
            schools={state.schools}
            athletes={state.athletes}
            relays={state.relays}
            onSaveSchool={handleSaveSchool}
            onRegisterAthlete={handleRegisterAthlete}
            onRegisterBatchAthletes={handleRegisterBatchAthletes}
            onUpdateAthlete={handleUpdateAthlete}
            onDeleteAthlete={handleDeleteAthlete}
            onSaveRelay={handleSaveRelay}
            onDeleteRelay={handleDeleteRelay}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            onOpenControlDesk={() => setActiveTab('control_desk')}
          />
        )}

        {activeTab === 'track_judge' && (
          <TrackJudgeView
            tournament={state.tournament}
            athletes={state.athletes}
            relays={state.relays || []}
            schools={state.schools}
            results={state.results}
            onSaveTrackResult={handleSaveTrackResult}
            onOpenLiveResults={handleSelectEventForPodium}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            roomCode={state.cloudSession?.roomCode || 'ATLETISMO-2026'}
            activeRaceSession={state.activeRaceSession}
            isCloudEnabled={state.cloudSession?.enabled ?? true}
          />
        )}

        {activeTab === 'field_judge' && (
          <FieldJudgeView
            tournament={state.tournament}
            athletes={state.athletes}
            schools={state.schools}
            results={state.results}
            onSaveFieldResult={handleSaveFieldResult}
            onOpenLiveResults={handleSelectEventForPodium}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        )}

        {activeTab === 'athletes_roster' && (
          <AthletesRosterView
            tournament={state.tournament}
            athletes={state.athletes}
            relays={state.relays || []}
            schools={state.schools}
            onUpdateAthlete={handleUpdateAthlete}
            onDeleteAthlete={handleDeleteAthlete}
            onDeleteRelay={handleDeleteRelay}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        )}

        {activeTab === 'control_desk' && (
          <ControlDeskView
            tournament={state.tournament}
            athletes={state.athletes}
            relays={state.relays || []}
            schools={state.schools}
            results={state.results}
            onSelectEventForPodium={handleSelectEventForPodium}
            onMarkEventAwarded={handleMarkEventAwarded}
            onReturnToRegistration={() => setActiveTab('registration')}
          />
        )}

        {activeTab === 'live_results' && (
          <LiveResultsView
            tournament={state.tournament}
            athletes={state.athletes}
            relays={state.relays || []}
            schools={state.schools}
            results={state.results}
            initialEventId={selectedPodiumEventId}
            initialGender={selectedPodiumGender}
          />
        )}
      </main>

      {/* Pie de Página Minimalista */}
      <footer className="border-t border-slate-200 bg-white py-3.5 px-4 text-center text-xs text-slate-500">
        <p>
          <strong>Atletismo Escolar Pro</strong> — Sistema Oficial de Gestión Deportiva de Primarias (CONDEBA).
        </p>
      </footer>

      {/* Modal de Acceso Administrador (Contraseña Mesa de Control) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        actualAdminPin={state.tournament?.adminPin || 'atletismo2026'}
      />

      {/* Modal de Ajustes */}
      <TournamentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tournament={state.tournament}
        onSaveTournament={handleSaveTournament}
        onLoadDemoData={handleLoadDemoData}
        onLoadLargeSimulation={handleLoadLargeSimulation}
        onResetToZero={handleResetToZero}
        fullState={state}
        isAdmin={isAdmin}
      />

      {/* Modal de Nube y Código Compartible */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        cloudSession={state.cloudSession}
        onUpdateCloudSession={(updated) => setState(prev => ({ ...prev, cloudSession: updated }))}
        adminPin={state.tournament?.adminPin || 'atletismo2026'}
        fullState={state}
      />
    </div>
  );
}
