/**
 * Módulo de Persistencia Local y Respaldo de Atletismo Escolar Pro
 * Almacenamiento seguro offline-first con localStorage y exportación a JSON.
 */

const STORAGE_KEY = 'atletismo_escolar_pro_v1';

export const DEFAULT_TOURNAMENT_INFO = {
  id: 'juegos-escolares-2026',
  name: 'Juegos Deportivos Escolares de Atletismo Primaria 2026',
  edition: 'Etapa de Zona y Conducción Escolar',
  venue: 'Pista de Atletismo Municipal y Estadio Escolar',
  venueAddress: 'Av. Insurgentes Sur #450, Unidad Deportiva Municipal',
  date: '2026-11-20',
  lanesCount: 6,
  fieldAttemptsCount: 3,
  adminPin: 'atletismo2026',
  organizer: 'Supervisión de Educación Física Escolar',
  activeCategory: 'primaria_abierta',
  categoryGroupingMode: 'unified', // 'unified' = Categoría Única (Solo Varonil y Femenil sin separar por edades) | 'by_grades' = Dividir por Grados (3°-4° y 5°-6°)
  customLogo: null, // Logotipo personalizado en Base64 (si es null, usa el logotipo oficial del Gobierno de Puebla / SEP)
  showLogoInControlDesk: false, // Botón en ajustes: permite activarlo también en la Mesa de Control
  enableDiplomas: false, // Opción en ajustes para activar/desactivar la emisión de diplomas de ganadores
  registrationDeadline: '', // Fecha límite de inscripción (YYYY-MM-DD)
  registrationDeadlineEnabled: false // Activar/desactivar fecha límite de inscripciones
};

export const MASTER_RECOVERY_KEY = 'SEP-PUEBLA-2026';

export function loadTournamentState() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const cloud = parsed.cloudSession || {};
          // Predeterminado SIEMPRE CONECTADO A LA NUBE para evitar que los maestros no registren datos
          const isOnline = cloud.userExplicitlyChoseOffline ? false : true;

          return {
            tournament: { ...DEFAULT_TOURNAMENT_INFO, ...(parsed.tournament || {}) },
            schools: Array.isArray(parsed.schools) ? parsed.schools : [],
            athletes: Array.isArray(parsed.athletes) ? parsed.athletes : [],
            relays: Array.isArray(parsed.relays) ? parsed.relays : [],
            results: parsed.results || {},
            cloudSession: {
              enabled: isOnline,
              userExplicitlyChoseOffline: Boolean(cloud.userExplicitlyChoseOffline),
              roomCode: (cloud.roomCode || 'ATLETISMO-2026').trim().toUpperCase()
            }
          };
        }
      }
    }
  } catch (e) {
    console.error('Error cargando estado de torneo:', e);
  }

  return {
    tournament: DEFAULT_TOURNAMENT_INFO,
    schools: [],
    athletes: [],
    relays: [],
    results: {},
    cloudSession: { enabled: true, userExplicitlyChoseOffline: false, roomCode: 'ATLETISMO-2026' }
  };
}

export function saveTournamentState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Error guardando estado local:', e);
    return false;
  }
}

export function exportTournamentBackupToFile(state) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(state, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `respaldo_atletismo_escolar_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importTournamentFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.tournament || !Array.isArray(parsed.athletes)) {
          throw new Error('El archivo no tiene la estructura válida de Atletismo Escolar Pro.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsText(file);
  });
}

export function purgeAllTournamentData() {
  localStorage.removeItem(STORAGE_KEY);
  return {
    tournament: DEFAULT_TOURNAMENT_INFO,
    schools: [],
    athletes: [],
    relays: [],
    results: {},
    cloudSession: { enabled: false, roomCode: 'ATLETISMO-2026' }
  };
}
