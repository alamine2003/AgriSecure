# ✅ Vérification Affichage NIN

## Modifications Apportées

### 1. Table Agents Agricoles (`AgentsManagement.jsx`)

**Avant:**
```
| Agent              | Statut | 1ère connexion | Actions |
| Yacine Sall        | Actif  | À changer      | [...]   |
| yacinesall@...     |        |                |         |
```

**Après:**
```
| Agent              | NIN         | Statut | 1ère connexion | Actions |
| Yacine Sall        | 10062004001 | Actif  | À changer      | [...]   |
| yacinesall@...     |             |        |                |         |
| 761872773          |             |        |                |         |
```

### 2. Affichage du NIN

**Colonne ajoutée:** 
- Position: Entre "Agent" et "Statut"
- Format: Police monospace (font-mono) pour meilleure lisibilité
- Taille: text-sm font-medium
- Toujours visible pour tous les agents

**Code modifié:**
```jsx
<th className="py-2 pr-4">NIN</th>
...
<td className="py-3 pr-4">
  <div className="font-mono text-sm font-medium">{u.nin}</div>
</td>
```

### 3. Backend (Déjà Fonctionnel)

Le serializer `UserSerializer` inclut déjà le champ `nin`:
```python
fields = [
    'id', 'email', 'nin', 'first_name', 'last_name',
    'phone', 'role', 'must_change_password',
    'is_active', 'created_at'
]
```

Le NIN est en `read_only_fields` donc il est accessible pour affichage mais non modifiable via API.

## Pour Tester

### 1. Redémarrer Frontend
```bash
docker-compose restart frontend
```

### 2. Accéder Page Agents
```
Login maintenancier → Sidebar "Agents"
```

### 3. Vérifier Colonnes
La table doit maintenant afficher:
1. **Agent** (nom, email, téléphone)
2. **NIN** (nouveau, en police monospace)
3. **Statut** (Actif/Inactif)
4. **1ère connexion** (À changer/OK)
5. **Actions** (Edit, Pause/Check, Delete)

### 4. Exemple Visuel

```
┌─────────────────────┬─────────────┬────────┬──────────────┬─────────┐
│ Agent               │ NIN         │ Statut │ 1ère connex. │ Actions │
├─────────────────────┼─────────────┼────────┼──────────────┼─────────┤
│ Yacine Sall         │ 10062004001 │ Actif  │ À changer    │ ✏ ⏸ 🗑 │
│ yacinesall@gmail... │             │        │              │         │
│ 761872773           │             │        │              │         │
├─────────────────────┼─────────────┼────────┼──────────────┼─────────┤
│ Moussa Ndiaye       │ 99988877766 │ Actif  │ OK           │ ✏ ⏸ 🗑 │
│ demo@agriwatch.sn   │             │        │              │         │
│ 771234567           │             │        │              │         │
└─────────────────────┴─────────────┴────────┴──────────────┴─────────┘
```

## Autres Pages avec NIN

### Page Demandes d'Inscription (`RegistrationRequests.jsx`)

Le NIN est déjà affiché avec l'icône Hash:
```jsx
<Hash className="w-4 h-4 text-muted-foreground" />
<span className="font-medium">NIN:</span>
<span>{request.nin}</span>
```

**Exemple:**
```
┌────────────────────────────────────────────┐
│ Moussa Ndiaye                              │
│ Demandé le 7 mai 2026                      │
├────────────────────────────────────────────┤
│ # NIN: 99988877766                         │
│ ✉ demo@agriwatch.sn                        │
│ ☎ 771234567                                │
│ 📍 Dakar - Rufisque                        │
└────────────────────────────────────────────┘
```

### Formulaire de Création Agent

Le NIN est un champ obligatoire dans le formulaire:
```jsx
<FloatingInput
  id="nin"
  label="NIN"
  value={form.nin}
  onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value }))}
  required
/>
```

## Avantages de l'Affichage NIN

1. **Identification unique:** Le NIN est l'identifiant national unique de chaque agent
2. **Mot de passe initial:** Le NIN sert de mot de passe initial pour la première connexion
3. **Traçabilité:** Facilite la recherche et l'identification des agents
4. **Vérification:** Le maintenancier peut vérifier le NIN lors du traitement des demandes
5. **Support:** En cas de problème de connexion, le maintenancier peut communiquer le NIN

## Notes Importantes

### Sécurité du NIN

Le NIN est affiché uniquement aux maintenanciers:
- ✅ Maintenancier: Voit tous les NIN dans la table
- ❌ Agent Agricole: Ne voit pas les NIN des autres agents
- ✅ API: NIN en read-only (non modifiable après création)

### Unicité du NIN

Le backend vérifie l'unicité:
```python
nin = models.CharField(max_length=20, unique=True)
```

Si un NIN existe déjà:
```
Erreur: "Un compte existe déjà avec ce NIN."
```

### Format Recommandé

Le NIN sénégalais est généralement:
- **11 chiffres** (ex: 12345678901)
- Ou **format CEDEAO** avec préfixe pays

La validation peut être ajoutée ultérieurement si nécessaire.

## Commandes de Vérification

### Voir tous les NIN en base de données
```bash
docker-compose exec db psql -U postgres -d surveillance_db \
  -c "SELECT nin, first_name, last_name, email FROM users_customuser WHERE role='agent_agricole';"
```

### Tester API directement
```bash
# Obtenir liste agents (avec token maintenancier)
curl -X GET http://localhost:8000/api/v1/users/ \
  -H "Authorization: Bearer <token>" \
  | jq '.[] | {nin, first_name, last_name}'
```

## Résultat Final

✅ **Colonne NIN ajoutée** dans table agents
✅ **Format lisible** (police monospace)
✅ **Toujours visible** pour maintenanciers
✅ **Backend déjà configuré** (champ inclus dans serializer)
✅ **Validation unicité** en place
✅ **Prêt pour soutenance**

---

**Note:** Après redémarrage du frontend, la colonne NIN sera immédiatement visible dans la page de gestion des agents.
