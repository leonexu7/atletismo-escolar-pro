/**
 * Datos de demostración realistas para Atletismo Escolar Pro
 * Permite probar de inmediato el flujo de maestros, jueceo, podio y diplomas.
 */

export const DEMO_SCHOOLS = [
  {
    id: 'esc-1',
    name: 'Esc. Primaria Benito Juárez',
    shortName: 'Benito Juárez',
    cct: '21EPR0101A',
    zone: 'Zona Escolar 04',
    inspection: 'Inspección 12',
    coachName: 'Prof. Roberto González',
    phone: '55 1234 5678',
    color: '#b91c1c'
  },
  {
    id: 'esc-2',
    name: 'Colegio José María Morelos',
    shortName: 'Col. Morelos',
    cct: '21PPR0202B',
    zone: 'Zona Escolar 04',
    inspection: 'Inspección 12',
    coachName: 'Profra. Marcela Mendoza',
    phone: '55 2345 6789',
    color: '#047857'
  },
  {
    id: 'esc-3',
    name: 'Primaria Niños Héroes',
    shortName: 'Niños Héroes',
    cct: '21DPR0303C',
    zone: 'Zona Escolar 08',
    inspection: 'Inspección 14',
    coachName: 'Prof. Carlos Salgado',
    phone: '55 3456 7890',
    color: '#1d4ed8'
  },
  {
    id: 'esc-4',
    name: 'Instituto Pedagógico Patria',
    shortName: 'Inst. Patria',
    cct: '21PPR0404D',
    zone: 'Zona Escolar 08',
    inspection: 'Inspección 14',
    coachName: 'Profra. Laura Domínguez',
    phone: '55 4567 8901',
    color: '#d97706'
  }
];

export const DEMO_ATHLETES = [
  // Niños Héroes / Benito Juárez en 75m y Salto de Longitud
  {
    id: 'ath-1',
    bibNumber: 101,
    fullName: 'Mateo Alejandro Ramírez',
    gender: 'M',
    birthDate: '2014-03-15',
    schoolGrade: '5',
    schoolId: 'esc-1',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_longitud', 'relevo_4x75m_varonil']
  },
  {
    id: 'ath-2',
    bibNumber: 102,
    fullName: 'Diego Armando Silva',
    gender: 'M',
    birthDate: '2014-06-20',
    schoolGrade: '5',
    schoolId: 'esc-2',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_longitud']
  },
  {
    id: 'ath-3',
    bibNumber: 103,
    fullName: 'Santiago López Morales',
    gender: 'M',
    birthDate: '2013-11-08',
    schoolGrade: '6',
    schoolId: 'esc-3',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_longitud', 'relevo_4x75m_varonil']
  },
  {
    id: 'ath-4',
    bibNumber: 104,
    fullName: 'Emiliano Vargas Ortiz',
    gender: 'M',
    birthDate: '2013-09-12',
    schoolGrade: '6',
    schoolId: 'esc-4',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_bala']
  },
  // Niñas en 75m Femenil y Lanzamiento de Pelota
  {
    id: 'ath-5',
    bibNumber: 105,
    fullName: 'Sofía Valentina Morales',
    gender: 'F',
    birthDate: '2014-01-25',
    schoolGrade: '5',
    schoolId: 'esc-1',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_pelota', 'relevo_4x75m_femenil']
  },
  {
    id: 'ath-6',
    bibNumber: 106,
    fullName: 'Regina Carrillo Solís',
    gender: 'F',
    birthDate: '2014-04-18',
    schoolGrade: '5',
    schoolId: 'esc-2',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_pelota', 'relevo_4x75m_femenil']
  },
  {
    id: 'ath-7',
    bibNumber: 107,
    fullName: 'Camila Torres Ruiz',
    gender: 'F',
    birthDate: '2013-08-14',
    schoolGrade: '6',
    schoolId: 'esc-3',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_pelota']
  },
  {
    id: 'ath-8',
    bibNumber: 108,
    fullName: 'Valeria Guadalupe Castro',
    gender: 'F',
    birthDate: '2013-12-03',
    schoolGrade: '6',
    schoolId: 'esc-4',
    categoryId: 'infantil_mayor',
    eventIds: ['pista_75m', 'campo_pelota']
  },
  // Lanzadores de Bala y Disco
  {
    id: 'ath-9',
    bibNumber: 109,
    fullName: 'Pablo Andrés Méndez',
    gender: 'M',
    birthDate: '2013-05-19',
    schoolGrade: '6',
    schoolId: 'esc-1',
    categoryId: 'infantil_mayor',
    eventIds: ['campo_bala', 'campo_disco']
  },
  {
    id: 'ath-10',
    bibNumber: 110,
    fullName: 'Leonardo Gabriel Reyes',
    gender: 'M',
    birthDate: '2013-07-22',
    schoolGrade: '6',
    schoolId: 'esc-2',
    categoryId: 'infantil_mayor',
    eventIds: ['campo_bala', 'campo_disco']
  },
  {
    id: 'ath-11',
    bibNumber: 111,
    fullName: 'Sebastián Navarro Peña',
    gender: 'M',
    birthDate: '2014-02-10',
    schoolGrade: '5',
    schoolId: 'esc-3',
    categoryId: 'infantil_mayor',
    eventIds: ['campo_bala', 'campo_disco']
  },
  {
    id: 'ath-12',
    bibNumber: 112,
    fullName: 'Ángel David Cisneros',
    gender: 'M',
    birthDate: '2014-09-05',
    schoolGrade: '5',
    schoolId: 'esc-4',
    categoryId: 'infantil_mayor',
    eventIds: ['campo_bala', 'campo_disco']
  }
];

export const DEMO_INITIAL_RESULTS = {
  // Ejemplo de Salto de Longitud con 3 intentos y DESEMPATE por 2ª marca
  campo_longitud: {
    isAwarded: false,
    fieldEntries: [
      {
        athleteId: 'ath-1',
        attempts: [
          { attemptNum: 1, value: 3.45, status: 'valid' },
          { attemptNum: 2, value: 3.85, status: 'valid' }, // Mejor: 3.85, 2ª: 3.70
          { attemptNum: 3, value: 3.70, status: 'valid' }
        ]
      },
      {
        athleteId: 'ath-2',
        attempts: [
          { attemptNum: 1, value: 3.85, status: 'valid' }, // Mejor: 3.85, 2ª: 3.80 -> GANA DESEMPATE
          { attemptNum: 2, value: 3.80, status: 'valid' },
          { attemptNum: 3, value: 3.50, status: 'valid' }
        ]
      },
      {
        athleteId: 'ath-3',
        attempts: [
          { attemptNum: 1, value: 3.65, status: 'valid' },
          { attemptNum: 2, value: null, status: 'foul' },  // Nulo
          { attemptNum: 3, value: 3.72, status: 'valid' }
        ]
      },
      {
        athleteId: 'ath-4',
        attempts: [
          { attemptNum: 1, value: 3.30, status: 'valid' },
          { attemptNum: 2, value: 3.40, status: 'valid' },
          { attemptNum: 3, value: 3.35, status: 'valid' }
        ]
      }
    ]
  },
  // Ejemplo de 75m Planos con tiempos registrados
  pista_75m: {
    isAwarded: false,
    trackEntries: [
      { athleteId: 'ath-1', heatNumber: 1, laneNumber: 2, timeSeconds: 10.42, status: 'valid' },
      { athleteId: 'ath-2', heatNumber: 1, laneNumber: 3, timeSeconds: 10.58, status: 'valid' },
      { athleteId: 'ath-3', heatNumber: 1, laneNumber: 4, timeSeconds: 10.75, status: 'valid' },
      { athleteId: 'ath-4', heatNumber: 1, laneNumber: 5, timeSeconds: 11.12, status: 'valid' }
    ]
  }
};
