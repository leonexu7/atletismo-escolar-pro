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

const CLOUD_STORAGE_KEY = 'atletismo_cloud_session_v1';

// Configuración Firebase activa predeterminada (heredada de la infraestructura del usuario o personalizada)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBAv_Ofl7V497CO278BmyGruwPzPpQmaXY",
  authDomain: "torneo--de-karate.firebaseapp.com",
  projectId: "torneo--de-karate",
  storageBucket: "torneo--de-karate.firebasestorage.app",
  messagingSenderId: "439672085234",
  appId: "1:439672085234:web:c85cc9d8125c6c81248e6b"
};

let firestoreInstance = null;

export function getFirestoreDB() {
  if (firestoreInstance) return firestoreInstance;

  try {
    const app = getApps().length === 0 ? initializeApp(DEFAULT_FIREBASE_CONFIG) : getApp();
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
