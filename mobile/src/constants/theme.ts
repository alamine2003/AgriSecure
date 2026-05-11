// Palette identique à l'app web AgriWatch (dark mode)
export const C = {
  // Arrière-plans
  bg:       '#0f0a05',   // background principal
  bgCard:   '#1a1008',   // carte / composant
  bgCard2:  '#231408',   // carte légèrement plus claire

  // Couleur de marque : ambre / orange (= primary web)
  primary:  '#f59e0b',
  primaryDk:'#ea580c',
  primaryLt:'#fbbf24',

  // Textes
  text:     '#f5f0e8',   // texte principal (blanc chaud)
  textMuted:'#9a8060',   // texte secondaire

  // Bordures
  border:   'rgba(245,158,11,0.14)',
  borderLt: 'rgba(245,158,11,0.07)',

  // États
  danger:   '#ef4444',
  dangerBg: 'rgba(239,68,68,0.12)',
  dangerBd: 'rgba(239,68,68,0.25)',
  success:  '#22c55e',
  successBg:'rgba(34,197,94,0.12)',

  // Gradient plein écran (écrans auth)
  grad: ['#0f0a05', '#1e1008', '#2a1508'] as const,
} as const;

// Niveaux de danger (identiques aux couleurs web)
export const DANGER_CFG = {
  HIGH:   { label: 'Élevé',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: 'flame'            as const },
  MEDIUM: { label: 'Moyen',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: 'warning'          as const },
  LOW:    { label: 'Faible', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: 'shield-checkmark' as const },
};

// 14 régions du Sénégal (identiques au backend)
export const REGIONS = [
  'Dakar','Diourbel','Fatick','Kaffrine','Kaolack','Kedougou',
  'Kolda','Louga','Matam','Saint-Louis','Sedhiou','Tambacounda',
  'Thies','Ziguinchor',
];
