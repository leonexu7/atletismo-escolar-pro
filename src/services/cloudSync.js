/**
 * Servicio de Sincronización en Tiempo Real Multi-Estación
 * Conecta las estaciones de jueceo (Pista, Longitud, Bala, Disco, Pelota)
 * directamente con la Mesa de Control Central y la Pantalla de Podio.
 */

import { initializeApp, getApps, getApp } from '@firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc
} from '@firebase/firestore';

const CUSTOM_FIREBASE_KEY = 'atletismo_custom_firebase_config';

/**
 * Obtiene la configuración de Firebase de forma segura.
 * Prioriza variables de entorno o configuración personalizada en localStorage.
 */
export function getActiveFirebaseConfig() {
  try {
    const saved = localStorage.getItem(CUSTOM_FIREBASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (_) {}

  // Si no hay configuración manual en localStorage, intenta leer de variables de entorno seguras
  return {
    apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || "",
    authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || "",
    projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "",
    storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || "",
    messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "",
    appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || ""
  };
}

let firestoreInstance = null;

export function getFirestoreDB() {
  if (firestoreInstance) return firestoreInstance;

  try {
    const config = getActiveFirebaseConfig();
    // Si no cuenta con una API key válida configurada, opera limpiamente en Modo Local / Offline
    if (!config || !config.apiKey || !config.projectId) {
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (err) {
    console.warn('Firestore no inicializado (Modo offline / local activo):', err.message);
    return null;
  }
}

/**
 * Suscribe a la Mesa de Control y Pantalla en Vivo a las actualizaciones en tiempo real
 * emitidas por cualquier juez desde cualquier parte del campo.
 */
export function subscribeToLiveTournament(roomCode = 'ATLETISMO-2026', onUpdateCallback) {
  const db = getFirestoreDB();
  if (!db) return () => {};

  const docRef = doc(db, 'atletismo_tournaments', roomCode);

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        onUpdateCallback(cloudData);
      }
    },
    (error) => {
      console.warn('Conexión en vivo Firestore interrumpida, operando con caché local:', error.message);
    }
  );

  return unsubscribe;
}

/**
 * Publica una actualización atómica desde la estación del juez (Intento de campo o Tiempo de pista)
 */
export function syncEventUpdateToCloud(roomCode = 'ATLETISMO-2026', eventId, eventData) {
  const db = getFirestoreDB();
  if (!db) return Promise.resolve(false);

  const docRef = doc(db, 'atletismo_tournaments', roomCode);

  return setDoc(
    docRef,
    {
      [`results.${eventId}`]: eventData,
      lastUpdated: new Date().toISOString()
    },
    { merge: true }
  ).catch(err => {
    console.error('Error al sincronizar evento con la nube:', err);
    return false;
  });
}

/**
 * Publica el estado completo del torneo (atletas, escuelas, pruebas) a la nube
 */
export function syncFullTournamentToCloud(roomCode = 'ATLETISMO-2026', fullState) {
  const db = getFirestoreDB();
  if (!db) return Promise.resolve(false);

  const docRef = doc(db, 'atletismo_tournaments', roomCode);
  return setDoc(docRef, {
    ...fullState,
    lastSyncTimestamp: new Date().toISOString()
  });
}
