import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import TeacherRegistrationView from './components/TeacherRegistrationView';
import TrackJudgeView from './components/TrackJudgeView';
import FieldJudgeView from './components/FieldJudgeView';
import ControlDeskView from './components/ControlDeskView';
import LiveResultsView from './components/LiveResultsView';
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
        cloudSession: { enabled: false, roomCode: 'ATLETISMO-2026' }
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

  // Suscripción Nube
  useEffect(() => {
    if (!state.cloudSession?.enabled) return;

    const unsubscribe = subscribeToLiveTournament(
      state.cloudSession.roomCode,
      (cloudData) => {
        if (cloudData && typeof cloudData === 'object') {
          setState(prev => ({
            ...prev,
            results: { ...(prev.results || {}), ...(cloudData.results || {}) },
            athletes: cloudData.athletes || prev.athletes,
            schools: cloudData.schools || prev.schools
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

  // Handlers de Alumnos
  const handleRegisterAthlete = (athlete) => {
    setState(prev => ({
      ...prev,
      athletes: [...prev.athletes, athlete]
    }));
  };

  const handleRegisterBatchAthletes = (batchList) => {
    setState(prev => ({
      ...prev,
      athletes: [...prev.athletes, ...batchList]
    }));
  };

  const handleUpdateAthlete = (updatedAthlete) => {
    setState(prev => ({
      ...prev,
      athletes: prev.athletes.map(a => a.id === updatedAthlete.id ? updatedAthlete : a)
    }));
  };

  const handleDeleteAthlete = (athleteId) => {
    setState(prev => ({
      ...prev,
      athletes: prev.athletes.filter(a => a.id !== athleteId)
    }));
  };

  const handleSaveRelay = (relayTeam) => {
    setState(prev => ({
      ...prev,
      relays: [...(prev.relays || []).filter(r => r.id !== relayTeam.id), relayTeam]
    }));
  };

  const handleSaveTournament = (updatedTournament, fullReplacement = null) => {
    if (fullReplacement) {
      setState(fullReplacement);
    } else {
      setState(prev => ({ ...prev, tournament: updatedTournament }));
    }
  };

  const handleLoadDemoData = () => {
    setState({
      tournament: DEFAULT_TOURNAMENT_INFO,
      schools: DEMO_SCHOOLS,
      athletes: DEMO_ATHLETES,
      relays: [],
      results: DEMO_INITIAL_RESULTS,
      cloudSession: { enabled: false, roomCode: 'ATLETISMO-2026' }
    });
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
    if (activeTab === 'control_desk') {
      setActiveTab('registration');
    }
  };

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
      />

      {/* Contenido Principal */}
      <main className="flex-1 pb-10">
        {activeTab === 'registration' && (
          <TeacherRegistrationView
            schools={state.schools}
            athletes={state.athletes}
            relays={state.relays}
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
      />

      {/* Modal de Nube y Código Compartible */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        cloudSession={state.cloudSession}
        onUpdateCloudSession={(updated) => setState(prev => ({ ...prev, cloudSession: updated }))}
        fullState={state}
      />
    </div>
  );
}
