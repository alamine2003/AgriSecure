# 🏗️ ARCHITECTURE MODULAIRE - Atomic Design

## 🎯 Objectif

Refactoriser l'application en **composants réutilisables** selon le pattern **Atomic Design** pour:
- ✅ Meilleure maintenabilité
- ✅ Réutilisabilité maximale
- ✅ Facilité de test
- ✅ Amélioration progressive facile
- ✅ Code DRY (Don't Repeat Yourself)

---

## 📐 Hiérarchie Atomic Design

```
Atoms (Atomes)
  ↓ combinés en
Molecules (Molécules)
  ↓ combinés en
Organisms (Organismes)
  ↓ combinés en
Templates (Modèles)
  ↓ instanciés en
Pages
```

---

## 🔬 Composants Créés

### ⚛️ ATOMS (Composants de base)

**`components/atoms/`**

1. **StatCard.jsx** (60 lignes)
   - Card statistique avec icône, valeur, gradient
   - Props: `label, value, subtitle, icon, gradient, onClick`
   - Utilisé dans: StatsGrid

2. **ActionButton.jsx** (50 lignes)
   - Bouton d'action stylisé avec icône
   - Variants: primary, success, danger, warning
   - Sizes: sm, md, lg
   - Props: `children, icon, variant, size, onClick, disabled`

3. **SectionHeader.jsx** (40 lignes)
   - En-tête de section avec icône, titre, badge, action
   - Props: `title, icon, count, action, gradient`
   - Utilisé dans: Toutes les sections

4. **EmptyState.jsx** (45 lignes)
   - Affichage état vide avec action
   - Props: `icon, title, description, actionLabel, actionIcon, onAction`
   - Utilisé dans: Toutes les sections quand vide

5. **LoadingSpinner.jsx** (30 lignes)
   - Spinner de chargement animé
   - Props: `icon, text, size`
   - Utilisé dans: Toutes les sections pendant chargement

---

### 🧬 MOLECULES (Combinaisons d'atomes)

**`components/molecules/`**

1. **CameraCard.jsx** (70 lignes)
   - Card caméra avec statut, localisation, bouton action
   - Props: `camera, onView`
   - Combine: Icon, Badge, ActionButton
   - Utilisé dans: CamerasSection

2. **PerimeterCard.jsx** (85 lignes)
   - Card périmètre avec stats, actions modifier/supprimer
   - Props: `perimeter, onEdit, onDelete`
   - Combine: Icon, Badge, ActionButton (×2)
   - Utilisé dans: PerimetersSection

3. **AlertItem.jsx** (55 lignes)
   - Item d'alerte avec badge "New" si non-lu
   - Props: `alert, formatDate`
   - Combine: Icon, Badge, formatDate
   - Utilisé dans: AlertsSection

4. **DetectionItem.jsx** (75 lignes)
   - Item détection avec niveau danger coloré
   - Props: `detection, formatDate`
   - Combine: Badge, Icon dynamique selon danger
   - Utilisé dans: DetectionsSection

---

### 🧪 ORGANISMS (Sections complètes)

**`components/organisms/`**

1. **StatsGrid.jsx** (60 lignes)
   - Grille 4 statistiques
   - Props: `stats`
   - Combine: StatCard (×4)
   - Config interne: couleurs, icônes, labels

2. **PerimetersSection.jsx** (80 lignes)
   - Section complète périmètres
   - Props: `perimeters, isLoading, onEdit, onDelete, onNew`
   - Combine: SectionHeader, EmptyState, LoadingSpinner, PerimeterCard[]
   - Gère: États vide, chargement, grille responsive

3. **CamerasSection.jsx** (75 lignes)
   - Section complète caméras
   - Props: `cameras, isLoading, onView, activeCameras`
   - Combine: SectionHeader, EmptyState, LoadingSpinner, CameraCard[]
   - Grille: 2 colonnes

4. **AlertsSection.jsx** (70 lignes)
   - Section complète alertes
   - Props: `alerts, isLoading, unreadCount, formatDate`
   - Combine: SectionHeader, EmptyState, LoadingSpinner, AlertItem[]
   - Layout: Liste verticale

5. **DetectionsSection.jsx** (70 lignes)
   - Section complète détections
   - Props: `detections, isLoading, formatDate`
   - Combine: SectionHeader, EmptyState, LoadingSpinner, DetectionItem[]
   - Layout: Liste verticale

---

### 📄 TEMPLATES (Structure de page)

**`components/templates/`**

1. **DashboardLayout.jsx** (60 lignes)
   - Structure globale: Header + Main scrollable
   - Props: `children, onNewPerimeter, onSurveillance`
   - Combine: ActionButton (×2), Header, Main
   - Hauteur: 100vh avec overflow contrôlé

---

### 📃 PAGES (Instances complètes)

**`pages/`**

1. **AgentDashboardModular.jsx** (280 lignes)
   - Page dashboard complète version modulaire
   - Combine: DashboardLayout + StatsGrid + 4 Sections + Dialog
   - Gère: Queries, Mutations, États, Handlers
   - Logique: Séparée de la présentation

---

## 📊 Statistiques

### Avant (Monolithique)
```
AgentDashboardUnified.jsx: 800 lignes
- Tout dans un fichier
- Difficile à maintenir
- Duplication de code
- Difficile à tester
```

### Après (Modulaire)
```
Total: 1145 lignes réparties en 16 fichiers

Atoms:         5 fichiers × ~45 lignes  = ~225 lignes
Molecules:     4 fichiers × ~70 lignes  = ~280 lignes
Organisms:     5 fichiers × ~72 lignes  = ~360 lignes
Templates:     1 fichier  × 60 lignes   = 60 lignes
Pages:         1 fichier  × 280 lignes  = 280 lignes

Avantages:
✅ Composants réutilisables (économie future)
✅ Testables unitairement
✅ Faciles à modifier isolément
✅ Documentés (JSDoc)
✅ DRY principe respecté
```

---

## 🎯 Réutilisabilité

### Composants Réutilisables Ailleurs

**StatCard**: Dashboard maintenancier, rapports, analytics
**ActionButton**: Toutes les pages (formulaires, actions)
**SectionHeader**: Toutes les pages avec sections
**EmptyState**: Toutes les listes vides
**LoadingSpinner**: Tous les chargements asynchrones
**CameraCard**: Page surveillance, liste caméras
**AlertItem**: Page alertes complète
**DetectionItem**: Page détections complète

---

## 🛠️ Comment Utiliser

### Créer une Nouvelle Page Dashboard

```jsx
import { DashboardLayout } from '@/components/templates/DashboardLayout'
import { StatsGrid } from '@/components/organisms/StatsGrid'

export default function MyNewDashboard() {
  const stats = {
    activeCameras: 10,
    totalCameras: 15,
    // ...
  }

  return (
    <DashboardLayout
      onNewPerimeter={() => {}}
      onSurveillance={() => {}}
    >
      <div className="mb-6">
        <StatsGrid stats={stats} />
      </div>
      
      {/* Ajouter d'autres sections */}
    </DashboardLayout>
  )
}
```

---

### Ajouter une Nouvelle Section

```jsx
// 1. Créer organism
export const MyNewSection = ({ data, isLoading }) => {
  return (
    <Card>
      <SectionHeader
        title="Ma Section"
        icon={MyIcon}
        count={data.length}
      />
      
      <CardContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <EmptyState title="Aucune donnée" />
        ) : (
          data.map(item => <MyItemCard key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  )
}

// 2. Utiliser dans page
<MyNewSection data={myData} isLoading={isLoading} />
```

---

### Créer un Nouveau Bouton

```jsx
import { ActionButton } from '@/components/atoms/ActionButton'
import { Plus } from 'lucide-react'

<ActionButton
  icon={Plus}
  onClick={handleCreate}
  variant="success"
  size="md"
>
  Créer
</ActionButton>
```

---

## 🎨 Personnalisation

### Thème Colors

Définis dans chaque composant via `gradient` prop:

```jsx
const gradients = {
  blue: "from-blue-500 to-indigo-600",
  green: "from-emerald-500 to-teal-600",
  red: "from-red-500 to-rose-600",
  orange: "from-orange-500 to-red-600"
}
```

### Modifier Facilement

**Exemple: Changer couleur section caméras**

Fichier: `organisms/CamerasSection.jsx` ligne 10
```jsx
<SectionHeader
  gradient="from-emerald-50 to-teal-50"  // ← Changer ici
/>
```

**Exemple: Ajouter stat**

Fichier: `organisms/StatsGrid.jsx` ligne 10
```jsx
const statsConfig = [
  // ... stats existantes
  {
    label: 'Nouvelle Stat',
    value: stats.newValue,
    icon: NewIcon,
    gradient: 'from-purple-500 to-pink-600'
  }
]
```

---

## 🧪 Tests Unitaires (TODO)

### Structure Tests

```
tests/
├── atoms/
│   ├── StatCard.test.jsx
│   ├── ActionButton.test.jsx
│   └── ...
├── molecules/
│   ├── CameraCard.test.jsx
│   └── ...
└── organisms/
    ├── StatsGrid.test.jsx
    └── ...
```

### Exemple Test

```jsx
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/atoms/StatCard'
import { Camera } from 'lucide-react'

test('affiche la stat correctement', () => {
  render(
    <StatCard
      label="Test"
      value={10}
      subtitle="test subtitle"
      icon={Camera}
      gradient="from-blue-500 to-blue-600"
    />
  )
  
  expect(screen.getByText('Test')).toBeInTheDocument()
  expect(screen.getByText('10')).toBeInTheDocument()
})
```

---

## 📁 Structure Finale

```
frontend/src/
├── components/
│   ├── atoms/                   ← Composants de base
│   │   ├── StatCard.jsx
│   │   ├── ActionButton.jsx
│   │   ├── SectionHeader.jsx
│   │   ├── EmptyState.jsx
│   │   └── LoadingSpinner.jsx
│   │
│   ├── molecules/               ← Combinaisons simples
│   │   ├── CameraCard.jsx
│   │   ├── PerimeterCard.jsx
│   │   ├── AlertItem.jsx
│   │   └── DetectionItem.jsx
│   │
│   ├── organisms/               ← Sections complexes
│   │   ├── StatsGrid.jsx
│   │   ├── PerimetersSection.jsx
│   │   ├── CamerasSection.jsx
│   │   ├── AlertsSection.jsx
│   │   └── DetectionsSection.jsx
│   │
│   ├── templates/               ← Structures de page
│   │   └── DashboardLayout.jsx
│   │
│   └── ui/                      ← Shadcn UI components
│       ├── card.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── dialog.jsx
│       └── ...
│
└── pages/
    ├── AgentDashboardModular.jsx  ← Version modulaire (NEW)
    ├── AgentDashboardUnified.jsx  ← Version monolithique (OLD)
    └── ...
```

---

## ✅ Avantages Architecture

### Maintenabilité
- ✅ Composant cassé? Fixer 1 fichier ~50 lignes
- ✅ Bug visuellement localisé (ex: CameraCard)
- ✅ Changement isolé n'impacte pas le reste

### Réutilisabilité
- ✅ StatCard réutilisable pour analytics, rapports
- ✅ ActionButton partout (100+ utilisations potentielles)
- ✅ EmptyState/LoadingSpinner dans toutes listes

### Testabilité
- ✅ Tests unitaires par composant
- ✅ Props mockables facilement
- ✅ Snapshot testing simple

### Scalabilité
- ✅ Ajouter section = créer organism
- ✅ Nouveau dashboard = assembler organismes
- ✅ Pas toucher code existant

### Documentation
- ✅ JSDoc sur chaque composant
- ✅ Props clairement définies
- ✅ Exemples d'usage en commentaire

---

## 🚀 Migration

### Phase 1: Pages Prioritaires ✅
- [x] AgentDashboard (FAIT)
- [ ] MaintenancierDashboard
- [ ] Surveillance

### Phase 2: Formulaires
- [ ] PerimeterDefinition
- [ ] CameraForm
- [ ] UserForm

### Phase 3: Listes
- [ ] CamerasList
- [ ] DetectionsList
- [ ] AlertsList

---

## 📖 Documentation Composants

### Chaque Composant Documente

```jsx
/**
 * Composant [Niveau] - [Nom]
 * [Description brève]
 * 
 * @param {Object} props
 * @param {string} props.label - Label affiché
 * @param {number} props.value - Valeur statistique
 * ...
 * 
 * @example
 * <StatCard
 *   label="Caméras"
 *   value={10}
 *   icon={Camera}
 *   gradient="from-blue-500 to-blue-600"
 * />
 */
export const StatCard = ({ label, value, ... }) => {
  // ...
}
```

---

## 🎯 Prochaines Étapes

1. **Tester version modulaire**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Tester: http://localhost:3000/agent/dashboard

2. **Créer tests unitaires**
   ```bash
   npm test components/atoms/StatCard.test.jsx
   ```

3. **Migrer autres pages**
   - Dupliquer pattern pour MaintenancierDashboard
   - Réutiliser composants existants

4. **Documentation Storybook** (optionnel)
   ```bash
   npm install @storybook/react
   ```

---

**Version:** Architecture v1.0  
**Date:** 2026-05-07  
**Fichiers:** 16 composants modulaires  
**Lignes:** ~1145 (vs 800 monolithique)  
**ROI:** +43% code mais ∞× réutilisabilité

🏗️ **Architecture professionnelle, maintenable, scalable!**
