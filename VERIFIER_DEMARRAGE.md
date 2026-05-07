# ✅ VÉRIFIER LE DÉMARRAGE

## 1. Attendre 30 secondes

Les conteneurs démarrent progressivement:
- Frontend ✅ (rapide)
- Postgres ✅ (moyen)
- Redis ✅ (rapide)
- Minio ✅ (moyen)
- Backend ⏳ (lent - migrations DB)
- Nginx ⏳ (après backend)

**Attendre ~30 secondes** pour que tout démarre.

---

## 2. Vérifier le statut

```bash
docker-compose ps
```

**Vous devriez voir tous "Up" ou "Up (healthy)":**
```
NAME                                    STATUS
alamine_bouba_project_v0-backend-1      Up
alamine_bouba_project_v0-frontend-1     Up
alamine_bouba_project_v0-nginx-1        Up
alamine_bouba_project_v0-postgres-1     Up (healthy)
alamine_bouba_project_v0-redis-1        Up (healthy)
...
```

---

## 3. Vérifier les logs backend

```bash
docker-compose logs backend | tail -20
```

**Chercher:**
```
Daphne running on 0.0.0.0:8000
```

---

## 4. Vérifier les logs nginx

```bash
docker-compose logs nginx | tail -10
```

**Chercher:**
```
start worker process
```

---

## 5. Tester l'application

**Ouvrir navigateur:**
```
http://localhost
```

**Vous devriez voir la page de login.**

---

## 6. Tester le nouveau dashboard

1. **Login** avec compte agent
2. **URL:** http://localhost/agent/dashboard
3. **Vérifier:**
   - ✅ 4 stats cards colorées
   - ✅ Section "Mes Périmètres"
   - ✅ Bouton "Nouveau Périmètre"
   - ✅ Sections: Caméras, Alertes, Détections

4. **Cliquer "Nouveau Périmètre":**
   - ✅ Dialog s'ouvre
   - ✅ Carte charge
   - ✅ Dessiner fonctionne

---

## 🚨 Si problème

### Backend ne démarre pas
```bash
docker-compose logs backend
```

### Nginx erreur
```bash
docker-compose logs nginx
```

### Frontend ne charge pas
```bash
docker-compose logs frontend
```

---

**Temps d'attente:** 30 secondes  
**Puis test:** http://localhost
