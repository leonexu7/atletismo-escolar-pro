import React, { useState, useEffect, useMemo } from 'react';
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
  DEFAULT_TOURNAMENT_INFO
} from './utils/storage';
import { DEMO_ATHLETES, DEMO_SCHOOLS, DEMO_INITIAL_RESULTS } from './constants/mockData';
import { OFFICIAL_EVENTS } from './constants/events';
import { computeTournamentEventStatus } from './utils/athleticsEngine';
import {
  subscribeToLiveTournament,
  syncEventUpdateToCloud,
  syncFullTournamentToCloud
} from './services/cloudSync';

export default function App() {
  const [state, setState] = useState(() => {
    const loaded = loadTournamentState();
    if (!loaded.athletes || loaded.athletes.length === 0) {
      return {
        tournament: DEFAULT_TOURNAMENT_INFO,
        schools: DEMO_SCHOOLS,
        athletes: DEMO_ATHLETES,
        relays: [],
        results: DEMO_INITIAL_RESULTS,
        cloudSession: { enabled: true, userExplicitlyChoseOffline: false, roomCode: 'ATLETISMO-2026' }
      };
    }
    return loaded;
  });

  // Pestaña inicial: Portal de Maestros (Inscripciones), tal como en el sistema de karate
  const [activeTab, setActiveTab] = useState('registration');
  const [selectedPodiumEventId, setSelectedPodiumEventId] = useState('campo_longitud');

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
          setState(prev => ({
            ...prev,
            results: { ...(prev.results || {}), ...(cloudData.results || {}) },
            athletes: Array.isArray(cloudData.athletes) && cloudData.athletes.length > 0 ? cloudData.athletes : prev.athletes,
            schools: Array.isArray(cloudData.schools) && cloudData.schools.length > 0 ? cloudData.schools : prev.schools,
            relays: Array.isArray(cloudData.relays) ? cloudData.relays : prev.relays,
            tournament: cloudData.tournament ? { ...prev.tournament, ...cloudData.tournament } : prev.tournament,
            activeRaceSession: cloudData.activeRaceSession || prev.activeRaceSession
          }));
        }
      }
    );

    return () => unsubscribe();
  }, [state.cloudSession?.enabled, state.cloudSession?.roomCode]);

  const readyAwardsCount = useMemo(() => {
    const statusList = computeTournamentEventStatus(OFFICIAL_EVENTS, state);
    return statusList.filter(s => s.isReadyForAwards).length;
  }, [state]);

  // Sincronización automática de cambios de atletas y escuelas con la nube
  const pushStateToCloudIfOnline = (partialOrUpdatedState) => {
    if (state.cloudSession?.enabled) {
      syncFullTournamentToCloud(state.cloudSession.roomCode, {
        ...state,
        ...partialOrUpdatedState
      });
    }
  };

  // Handlers de Resultados
  const handleSaveTrackResult = (eventId, trackEntries) => {
    const updatedResults = {
      ...state.results,
      [eventId]: {
        ...(state.results[eventId] || {}),
        trackEntries,
        isAwarded: false,
        lastUpdated: new Date().toISOString()
      }
    };

    setState(prev => ({ ...prev, results: updatedResults }));

    if (state.cloudSession?.enabled) {
      syncEventUpdateToCloud(state.cloudSession.roomCode, eventId, updatedResults[eventId]);
    }
  };

  const handleSaveFieldResult = (eventId, fieldEntries) => {
    const updatedResults = {
      ...state.results,
      [eventId]: {
        ...(state.results[eventId] || {}),
        fieldEntries,
        isAwarded: false,
        lastUpdated: new Date().toISOString()
      }
    };

    setState(prev => ({ ...prev, results: updatedResults }));

    if (state.cloudSession?.enabled) {
      syncEventUpdateToCloud(state.cloudSession.roomCode, eventId, updatedResults[eventId]);
    }
  };

  const handleMarkEventAwarded = (eventId) => {
    const updatedResults = {
      ...state.results,
      [eventId]: {
        ...(state.results[eventId] || {}),
        isAwarded: true
      }
    };
    setState(prev => ({ ...prev, results: updatedResults }));
    if (state.cloudSession?.enabled) {
      syncEventUpdateToCloud(state.cloudSession.roomCode, eventId, updatedResults[eventId]);
    }
  };

  // Handlers de Alumnos con Autoguardado en Nube Inmediato
  const handleRegisterAthlete = (athlete) => {
    setState(prev => {
      const updatedAthletes = [...prev.athletes, athlete];
      const nextState = { ...prev, athletes: updatedAthletes };
      pushStateToCloudIfOnline(nextState);
      return nextState;
    });
  };

  const handleRegisterBatchAthletes = (batchList) => {
    setState(prev => {
      const updatedAthletes = [...prev.athletes, ...batchList];
      const nextState = { ...prev, athletes: updatedAthletes };
      pushStateToCloudIfOnline(nextState);
      return nextState;
    });
  };

  const handleUpdateAthlete = (updatedAthlete) => {
    setState(prev => {
      const updatedAthletes = prev.athletes.map(a => a.id === updatedAthlete.id ? updatedAthlete : a);
      const nextState = { ...prev, athletes: updatedAthletes };
      pushStateToCloudIfOnline(nextState);
      return nextState;
    });
  };

  const handleDeleteAthlete = (athleteId) => {
    setState(prev => {
      const updatedAthletes = prev.athletes.filter(a => a.id !== athleteId);
      const nextState = { ...prev, athletes: updatedAthletes };
      pushStateToCloudIfOnline(nextState);
      return nextState;
    });
  };

  const handleSaveRelay = (relayTeam) => {
    setState(prev => {
      const updatedRelays = [...(prev.relays || []).filter(r => r.id !== relayTeam.id), relayTeam];
      const nextState = { ...prev, relays: updatedRelays };
      pushStateToCloudIfOnline(nextState);
      return nextState;
    });
  };

  const handleSaveSchool = (schoolData) => {
    setState(prev => {
      const existingIdx = (prev.schools || []).findIndex(s => s.id === schoolData.id);
      let updatedSchools;
      if (existingIdx !== -1) {
        updatedSchools = [...prev.schools];
        updatedSchools[existingIdx] = { ...updatedSchools[existingIdx], ...schoolData };
      } else {
        updatedSchools = [...prev.schools, schoolData];
      }
      const nextState = { ...prev, schools: updatedSchools };
      pushStateToCloudIfOnline(nextState);
      return nextState;
    });
  };

  const handleSaveTournament = (updatedTournament, fullReplacement = null) => {
    if (fullReplacement) {
      setState(fullReplacement);
      pushStateToCloudIfOnline(fullReplacement);
    } else {
      setState(prev => {
        const nextState = { ...prev, tournament: updatedTournament };
        pushStateToCloudIfOnline(nextState);
        return nextState;
      });
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

  const handleResetToZero = () => {
    const clean = purgeAllTournamentData();
    setState(clean);
  };

  const handleSelectEventForPodium = (eventId) => {
    setSelectedPodiumEventId(eventId);
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
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            onOpenControlDesk={() => setActiveTab('control_desk')}
          />
        )}

        {activeTab === 'track_judge' && (
          <TrackJudgeView
            tournament={state.tournament}
            athletes={state.athletes}
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
            schools={state.schools}
            onUpdateAthlete={handleUpdateAthlete}
            onDeleteAthlete={handleDeleteAthlete}
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
        )}

        {activeTab === 'control_desk' && (
          <ControlDeskView
            tournament={state.tournament}
            athletes={state.athletes}
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
            schools={state.schools}
            results={state.results}
            initialEventId={selectedPodiumEventId}
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
