const now = Date.now();
const ago = (min: number) => new Date(now - min * 60 * 1000).toISOString();

export const MOCK_CREDENTIALS = { email: 'agent@agriwatch.sn', password: 'agent123' };

export const MOCK_USER = {
  id: 'mock-u1',
  username: 'agent.demo',
  email: 'agent@agriwatch.sn',
  role: 'agent_agricole' as const,
  must_change_password: false,
  first_name: 'Moussa',
  last_name: 'Diallo',
};

export const MOCK_STATS = {
  cameras_count: 3,
  weekly_detections: 14,
  weekly_alerts: 5,
  last_detection: ago(25),
};

export const MOCK_CAMERAS = [
  { id: 'cam-1', name: 'Caméra Nord', location: 'Parcelle Nord — Thiès', camera_index: 1, is_active: true,  latitude: '14.7910', longitude: '-16.9570', installed_at: '2024-11-01T09:00:00Z' },
  { id: 'cam-2', name: 'Caméra Sud',  location: 'Parcelle Sud — Thiès',  camera_index: 2, is_active: true,  latitude: '14.7875', longitude: '-16.9540', installed_at: '2024-11-15T10:00:00Z' },
  { id: 'cam-3', name: 'Entrée principale', location: 'Portail — Route RN1', camera_index: 3, is_active: false, latitude: null, longitude: null, installed_at: '2024-12-01T08:00:00Z' },
];

export const MOCK_ALERTS = [
  {
    id: 'al-1', message: 'Intrusion humaine détectée dans la parcelle Nord. Niveau de danger élevé.', is_read: false, resolved_at: null, created_at: ago(20),
    detection_detail: { label: 'Personne', camera_name: 'Caméra Nord', danger_level: 'HIGH' as const, confidence: 0.92, detected_at: ago(20) },
  },
  {
    id: 'al-2', message: 'Troupeau de bovins détecté près de la clôture Sud.', is_read: false, resolved_at: null, created_at: ago(65),
    detection_detail: { label: 'Vache', camera_name: 'Caméra Sud', danger_level: 'MEDIUM' as const, confidence: 0.87, detected_at: ago(65) },
  },
  {
    id: 'al-3', message: 'Passage d'un chien détecté à l'entrée principale.', is_read: true, resolved_at: ago(30), created_at: ago(180),
    detection_detail: { label: 'Chien', camera_name: 'Entrée principale', danger_level: 'LOW' as const, confidence: 0.79, detected_at: ago(180) },
  },
  {
    id: 'al-4', message: 'Mouvement suspect détecté — faible luminosité.', is_read: true, resolved_at: null, created_at: ago(360),
    detection_detail: { label: 'Personne', camera_name: 'Caméra Nord', danger_level: 'MEDIUM' as const, confidence: 0.71, detected_at: ago(360) },
  },
  {
    id: 'al-5', message: 'Oiseau détecté sur le périmètre — aucun risque.', is_read: true, resolved_at: ago(200), created_at: ago(720),
    detection_detail: { label: 'Oiseau', camera_name: 'Caméra Sud', danger_level: 'LOW' as const, confidence: 0.83, detected_at: ago(720) },
  },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n-1', title: 'Alerte intrusion — Parcelle Nord', message: 'Une personne a été détectée à 09h40. Vérifiez immédiatement.', notification_type: 'alert',  is_read: false, created_at: ago(20) },
  { id: 'n-2', title: 'Détection animale confirmée',      message: 'Un troupeau de bovins circule près du périmètre Sud.', notification_type: 'detection', is_read: false, created_at: ago(65) },
  { id: 'n-3', title: 'Système opérationnel',             message: 'Toutes les caméras sont connectées et fonctionnelles.', notification_type: 'system', is_read: true, created_at: ago(240) },
  { id: 'n-4', title: 'Rendez-vous d\'installation',      message: 'Un technicien interviendra le 15 juin pour la caméra Est.', notification_type: 'installation', is_read: true, created_at: ago(1440) },
];

export const MOCK_REPORTS = [
  { id: 'r-1', title: 'Rapport hebdomadaire — Semaine 22', description: 'Synthèse des détections et alertes de la semaine du 27 mai au 2 juin 2025.', report_type: 'weekly',  pdf_file: undefined, created_at: ago(2880), period_start: '2025-05-27T00:00:00Z', period_end: '2025-06-02T23:59:59Z' },
  { id: 'r-2', title: 'Rapport quotidien — 26 mai 2025',  description: '5 détections, 2 alertes critiques.',                                                report_type: 'daily',   pdf_file: undefined, created_at: ago(4320), period_start: '2025-05-26T00:00:00Z', period_end: '2025-05-26T23:59:59Z' },
  { id: 'r-3', title: 'Rapport mensuel — Mai 2025',       description: 'Bilan complet du mois de mai : 43 détections, 12 alertes.',                         report_type: 'monthly', pdf_file: undefined, created_at: ago(7200), period_start: '2025-05-01T00:00:00Z', period_end: '2025-05-31T23:59:59Z' },
];

export function mockGet<T>(path: string): T {
  if (path.includes('/dashboard/overview'))    return MOCK_STATS as unknown as T;
  if (path.includes('/cameras'))               return { results: MOCK_CAMERAS } as unknown as T;
  if (path.includes('/alerts'))                return { results: MOCK_ALERTS } as unknown as T;
  if (path.includes('/notifications'))         return { results: MOCK_NOTIFICATIONS } as unknown as T;
  if (path.includes('/reports'))               return { results: MOCK_REPORTS } as unknown as T;
  return {} as T;
}

export function mockPatch<T>(path: string, body: object): T {
  if (path.includes('/alerts/') && path.includes('/read')) {
    const id = path.split('/alerts/')[1].replace('/read/', '').replace('/read', '');
    const alert = MOCK_ALERTS.find(a => a.id === id);
    if (alert) alert.is_read = true;
  }
  if (path.includes('/notifications/')) {
    const id = path.split('/notifications/')[1].replace('/', '');
    const n = MOCK_NOTIFICATIONS.find(n => n.id === id);
    if (n) n.is_read = true;
  }
  return {} as T;
}
