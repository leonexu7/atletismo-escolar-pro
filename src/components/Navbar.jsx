import React from 'react';
import {
  Timer,
  Ruler,
  LayoutDashboard,
  Trophy,
  Users,
  Settings,
  Wifi,
  Lock,
  Unlock,
  LogOut,
  Calendar,
  MapPin
} from 'lucide-react';
import runnerSilhouette from '../assets/runner_silhouette.png';
import defaultBannerLogo from '../assets/puebla_sep_banner.jpg';

export default function Navbar({
  activeTab,
  onSelectTab,
  tournament,
  isAdmin = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenSettings,
  onOpenCloudModal,
  cloudSession,
  readyAwardsCount = 0
}) {
  const shouldShowInstitutionalHeader =
    activeTab === 'registration' || (activeTab === 'control_desk' && tournament?.showLogoInControlDesk);

  const activeLogo = tournament?.customLogo || defaultBannerLogo;

  const tabs = [
    { id: 'registration', label: 'Inscripciones (Maestros)', shortLabel: 'Maestros', icon: Users, requiresAdmin: false },
    { id: 'track_judge', label: 'Juez de Pista', shortLabel: 'Pista', icon: Timer, requiresAdmin: false },
    { id: 'field_judge', label: 'Juez de Campo', shortLabel: 'Campo', icon: Ruler, requiresAdmin: false },
    { id: 'live_results', label: 'Podio y Resultados', shortLabel: 'Podio', icon: Trophy, requiresAdmin: false },
    {
      id: 'control_desk',
      label: 'Mesa de Control',
      shortLabel: 'Control',
      icon: LayoutDashboard,
      requiresAdmin: true,
      badge: readyAwardsCount > 0 ? `${readyAwardsCount} listos` : null
    }
  ];

  const handleTabClick = (tab) => {
    if (tab.requiresAdmin && !isAdmin) {
      onOpenAdminLogin();
      return;
    }
    onSelectTab(tab.id);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* 1. Logotipo Institucional Oficial como ENCABEZADO REAL (Arriba del título de Juegos Deportivos Escolares) */}
      {shouldShowInstitutionalHeader && (
        <div className="bg-white border-b border-slate-200/90 py-2 sm:py-2.5 px-3 sm:px-6 flex items-center justify-center transition-all">
          <img
            src={activeLogo}
            alt="Gobierno del Estado de Puebla - Secretaría de Educación Pública"
            className="h-9 sm:h-12 md:h-14 w-auto max-w-full object-contain"
          />
        </div>
      )}

      {/* 2. Barra con el título oficial de los Juegos Escolares Deportivos */}
      <div className="bg-slate-900 text-white px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2 truncate">
          <span className="font-semibold text-white tracking-wide truncate">
            {tournament?.name || 'Juegos Deportivos Escolares de Atletismo 2026'}
          </span>
          <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 px-1.5 py-0.2 rounded font-bold uppercase hidden md:inline">
            Primaria CONDEBA
          </span>
          <span className="text-slate-400 text-[11px] hidden lg:inline">
            • {tournament?.venue || 'Estadio Escolar'}
          </span>
        </div>

        {/* Acceso de Administrador / Estado de Sesión */}
        <div className="flex items-center space-x-3 text-xs">
          {isAdmin ? (
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Unlock className="w-3 h-3 text-amber-400" />
                <span>Mesa de Control Activa</span>
              </span>
              <button
                onClick={onLogoutAdmin}
                className="text-slate-400 hover:text-white flex items-center space-x-1 text-[11px] bg-slate-800 px-2 py-0.5 rounded transition-colors"
                title="Cerrar Sesión Administrador"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <Lock className="w-3 h-3 text-rose-400" />
              <span>Acceso Mesa de Control</span>
            </button>
          )}

          {/* Estado de Nube */}
          <button
            onClick={onOpenCloudModal}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
              cloudSession?.enabled
                ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className={`w-3 h-3 ${cloudSession?.enabled ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">
              {cloudSession?.enabled ? cloudSession.roomCode : 'Offline'}
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={onOpenSettings}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Ajustes del Torneo"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Navegación Principal en Blanco y Pastel */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logotipo Oficial con Silueta de Corredor Formal */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0"
            onClick={() => onSelectTab('registration')}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs hover:bg-slate-200/80 transition-colors">
              <img
                src={runnerSilhouette}
                alt="Silueta de Corredor Formal"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 block leading-tight">
                ATLETISMO ESCOLAR
              </span>
              <span className="text-[10px] text-slate-500 block leading-none font-medium">
                Gestión Oficial de Juegos Deportivos
              </span>
            </div>
          </div>

          {/* Pestañas de Navegación con Scroll Horizontal Suave en Móviles */}
          <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isLocked = tab.requiresAdmin && !isAdmin;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`relative flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-slate-500'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>

                  {isLocked && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}

                  {tab.badge && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-emerald-500 text-white font-bold rounded-full animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
