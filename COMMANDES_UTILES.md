# 🛠️ COMMANDES UTILES - AgriWatch

Guide de référence rapide pour le développement, le débogage et le déploiement.

---

## 🚀 Démarrage & Arrêt

### Lancer l'Application Complète

```bash
# Lancer tous les services (backend + DB + Redis + MinIO)
docker-compose up

# Lancer en arrière-plan
docker-compose up -d

# Voir les logs en temps réel
docker-compose logs -f

# Voir logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Arrêter l'Application

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer volumes (⚠️ données perdues)
docker-compose down -v

# Redémarrer un service spécifique
docker-compose restart backend
```

### Frontend Séparé

```bash
# Lancer dev server Vite
cd frontend
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

---

## 📦 Installation & Setup

### Première Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd Alamine_Bouba_Project_v0

# 2. Créer fichier .env (copier depuis .env.example)
cp .env.example .env

# 3. Installer dépendances frontend
cd frontend
npm install
cd ..

# 4. Build images Docker
docker-compose build

# 5. Lancer services
docker-compose up -d

# 6. Appliquer migrations
docker-compose exec backend python manage.py migrate

# 7. Créer superuser
docker-compose exec backend python manage.py createsuperuser

# 8. Lancer frontend
cd frontend
npm run dev
```

---

## 🗄️ Base de Données

### Migrations

```bash
# Créer migrations
docker-compose exec backend python manage.py makemigrations

# Appliquer migrations
docker-compose exec backend python manage.py migrate

# Voir status migrations
docker-compose exec backend python manage.py showmigrations

# Rollback migration spécifique
docker-compose exec backend python manage.py migrate surveillance 0003

# Fake migration (si déjà appliquée manuellement)
docker-compose exec backend python manage.py migrate --fake surveillance 0004
```

### Shell Django

```bash
# Ouvrir shell Django
docker-compose exec backend python manage.py shell

# Dans le shell:
>>> from users.models import User
>>> User.objects.all()
>>> User.objects.filter(role='agent_agricole')
>>> user = User.objects.get(email='test@example.com')
>>> user.must_change_password = False
>>> user.save()
>>> exit()
```

### Backup & Restore

```bash
# Backup base de données
docker-compose exec -T postgres pg_dump -U agriwatch_user agriwatch_db > backup.sql

# Restore base de données
docker-compose exec -T postgres psql -U agriwatch_user agriwatch_db < backup.sql

# Export données spécifiques (JSON)
docker-compose exec backend python manage.py dumpdata surveillance.Camera > cameras.json
docker-compose exec backend python manage.py dumpdata users.User > users.json

# Import données
docker-compose exec backend python manage.py loaddata cameras.json
```

---

## 🔍 Débogage

### Logs Backend

```bash
# Logs temps réel backend
docker-compose logs -f backend

# Logs avec filtrage
docker-compose logs backend | grep "ERROR"
docker-compose logs backend | grep "complete_installation"

# Dernières 100 lignes
docker-compose logs --tail=100 backend
```

### Logs Frontend

```bash
# Dans terminal frontend
# Les logs s'affichent automatiquement

# Vérifier erreurs build
npm run build 2>&1 | grep "ERROR"
```

### Inspecter Containers

```bash
# Lister containers actifs
docker-compose ps

# Shell dans container backend
docker-compose exec backend bash

# Shell dans container postgres
docker-compose exec postgres bash

# Voir ressources utilisées
docker stats
```

### Vérifier Connexions

```bash
# Tester connexion PostgreSQL
docker-compose exec postgres psql -U agriwatch_user -d agriwatch_db -c "SELECT 1;"

# Tester connexion Redis
docker-compose exec redis redis-cli ping

# Tester API backend
curl http://localhost:8000/api/v1/health/
curl http://localhost:8000/api/v1/users/
```

---

## 👤 Gestion Utilisateurs

### Créer Utilisateurs

```bash
# Créer superuser
docker-compose exec backend python manage.py createsuperuser

# Créer maintenancier via shell
docker-compose exec backend python manage.py shell
>>> from users.models import User
>>> user = User.objects.create_user(
...     email='main@agriwatch.sn',
...     nin='1234567890123',
...     password='Admin@123',
...     first_name='Jean',
...     last_name='Dupont',
...     role='maintenancier',
...     is_staff=True,
...     must_change_password=False
... )
>>> exit()

# Créer agent via shell
>>> user = User.objects.create_user(
...     email='agent@agriwatch.sn',
...     nin='9876543210987',
...     password='Agent@123',
...     first_name='Moussa',
...     last_name='Fall',
...     role='agent_agricole',
...     must_change_password=True
... )
```

### Modifier Utilisateurs

```bash
# Réinitialiser mot de passe
docker-compose exec backend python manage.py shell
>>> from users.models import User
>>> user = User.objects.get(email='agent@agriwatch.sn')
>>> user.set_password('NewPassword@123')
>>> user.save()

# Forcer changement mot de passe
>>> user.must_change_password = True
>>> user.save()

# Activer/Désactiver
>>> user.is_active = False
>>> user.save()

# Changer rôle
>>> user.role = 'maintenancier'
>>> user.save()
```

### Lister Utilisateurs

```bash
docker-compose exec backend python manage.py shell
>>> from users.models import User
>>> User.objects.all()
>>> User.objects.filter(role='agent_agricole').count()
>>> User.objects.filter(must_change_password=True)
>>> User.objects.filter(is_active=False)
```

---

## 📊 Données de Test

### Créer Données Test

```bash
# Via shell Django
docker-compose exec backend python manage.py shell

# Créer RegistrationRequest
>>> from surveillance.models import RegistrationRequest
>>> req = RegistrationRequest.objects.create(
...     nin='1111111111111',
...     email='test@example.com',
...     first_name='Test',
...     last_name='User',
...     phone='+221 77 123 45 67',
...     region='Dakar',
...     locality='Plateau',
...     address='Rue Test',
...     farm_size='5 hectares',
...     status='PENDING'
... )

# Créer Camera
>>> from surveillance.models import Camera
>>> from users.models import User
>>> agent = User.objects.get(email='agent@agriwatch.sn')
>>> camera = Camera.objects.create(
...     agent=agent,
...     name='Caméra Test',
...     stream_url='rtsp://test',
...     latitude=14.6937,
...     longitude=-17.4441,
...     is_active=True
... )

# Créer FieldPerimeter
>>> from surveillance.models import FieldPerimeter
>>> perimeter = FieldPerimeter.objects.create(
...     agent=agent,
...     name='Champ Test',
...     coordinates=[[14.79, -16.92], [14.80, -16.92], [14.80, -16.91], [14.79, -16.91]],
...     center_lat=14.795,
...     center_lng=-16.915,
...     area_hectares=2.45
... )
```

### Supprimer Données Test

```bash
docker-compose exec backend python manage.py shell

# Supprimer toutes demandes
>>> from surveillance.models import RegistrationRequest
>>> RegistrationRequest.objects.all().delete()

# Supprimer tous agents (⚠️ attention)
>>> from users.models import User
>>> User.objects.filter(role='agent_agricole').delete()

# Supprimer toutes caméras
>>> from surveillance.models import Camera
>>> Camera.objects.all().delete()

# Reset auto-increment
>>> from django.db import connection
>>> cursor = connection.cursor()
>>> cursor.execute("ALTER SEQUENCE surveillance_camera_id_seq RESTART WITH 1;")
```

---

## 🧪 Tests

### Tests Backend

```bash
# Lancer tous les tests
docker-compose exec backend pytest

# Tests d'une app spécifique
docker-compose exec backend pytest surveillance/tests/

# Test d'un fichier spécifique
docker-compose exec backend pytest surveillance/tests/test_models.py

# Test avec coverage
docker-compose exec backend pytest --cov=surveillance --cov-report=html

# Tests verbeux
docker-compose exec backend pytest -v

# Arrêter au premier échec
docker-compose exec backend pytest -x
```

### Tests Frontend

```bash
cd frontend

# Lancer tests Vitest (si configuré)
npm run test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 🔧 Maintenance

### Nettoyer Docker

```bash
# Supprimer containers arrêtés
docker container prune

# Supprimer images non utilisées
docker image prune

# Supprimer volumes non utilisés (⚠️ données perdues)
docker volume prune

# Tout nettoyer (⚠️⚠️⚠️)
docker system prune -a --volumes
```

### Rebuild Clean

```bash
# Arrêter tout
docker-compose down -v

# Supprimer images
docker-compose rm -f
docker rmi $(docker images | grep agriwatch | awk '{print $3}')

# Rebuild from scratch
docker-compose build --no-cache

# Relancer
docker-compose up -d

# Recréer DB
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Logs Persistants

```bash
# Sauvegarder logs backend
docker-compose logs backend > logs_backend_$(date +%Y%m%d_%H%M%S).txt

# Sauvegarder tous les logs
docker-compose logs > logs_all_$(date +%Y%m%d_%H%M%S).txt
```

---

## 🚀 Déploiement Production

### Build Production

```bash
# Frontend
cd frontend
npm run build
# Fichiers dans dist/

# Backend (déjà Dockerisé)
docker-compose -f docker-compose.prod.yml build
```

### Variables Environnement Production

```bash
# Modifier .env pour production
DJANGO_DEBUG=False
DJANGO_SETTINGS_MODULE=core.settings.prod
DJANGO_SECRET_KEY=<générer nouveau secret>
ALLOWED_HOSTS=agriwatch.sn,www.agriwatch.sn

# Générer secret key
docker-compose exec backend python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Collectstatic

```bash
# Collecter fichiers statiques
docker-compose exec backend python manage.py collectstatic --noinput
```

---

## 📝 Commandes Personnalisées

### Créer Superuser Automatique

```bash
# Script pour créer superuser sans interaction
docker-compose exec backend python manage.py shell << EOF
from users.models import User
if not User.objects.filter(email='admin@agriwatch.sn').exists():
    User.objects.create_superuser(
        email='admin@agriwatch.sn',
        nin='0000000000000',
        password='Admin@123',
        first_name='Admin',
        last_name='System'
    )
    print("Superuser créé")
else:
    print("Superuser existe déjà")
EOF
```

### Vérifier Status Installation

```bash
# Script de vérification complète
echo "=== Services Docker ==="
docker-compose ps

echo -e "\n=== Backend Health ==="
curl -s http://localhost:8000/api/v1/health/ | jq .

echo -e "\n=== Utilisateurs ==="
docker-compose exec backend python manage.py shell -c "from users.models import User; print(f'Total: {User.objects.count()}, Agents: {User.objects.filter(role=\"agent_agricole\").count()}')"

echo -e "\n=== Caméras ==="
docker-compose exec backend python manage.py shell -c "from surveillance.models import Camera; print(f'Total: {Camera.objects.count()}')"

echo -e "\n=== Demandes ==="
docker-compose exec backend python manage.py shell -c "from surveillance.models import RegistrationRequest; print(f'Total: {RegistrationRequest.objects.count()}, Pending: {RegistrationRequest.objects.filter(status=\"PENDING\").count()}')"
```

---

## 🐛 Résolution Problèmes Courants

### Erreur Port Déjà Utilisé

```bash
# Trouver processus sur port 8000
lsof -i :8000
netstat -ano | findstr :8000  # Windows

# Tuer processus
kill -9 <PID>

# Ou changer port dans docker-compose.yml
ports:
  - "8001:8000"
```

### Erreur Migrations

```bash
# Fake toutes les migrations
docker-compose exec backend python manage.py migrate --fake

# Réinitialiser migrations (⚠️ données perdues)
docker-compose exec backend python manage.py migrate surveillance zero
docker-compose exec backend python manage.py migrate surveillance
```

### Redis Connection Error

```bash
# Vérifier Redis running
docker-compose ps redis

# Redémarrer Redis
docker-compose restart redis

# Tester connexion
docker-compose exec redis redis-cli ping
```

### PostgreSQL Connection Error

```bash
# Vérifier Postgres running
docker-compose ps postgres

# Vérifier credentials dans .env
cat .env | grep POSTGRES

# Recréer database (⚠️ données perdues)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec backend python manage.py migrate
```

---

## 📚 Ressources

### Documentation

- Django: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- Django Channels: https://channels.readthedocs.io/
- React: https://react.dev/
- TailwindCSS: https://tailwindcss.com/
- Docker: https://docs.docker.com/

### Commandes Git Utiles

```bash
# Status
git status

# Commit
git add .
git commit -m "feat: description"

# Push
git push origin main

# Créer branche
git checkout -b feature/nouvelle-fonctionnalite

# Voir logs
git log --oneline --graph

# Annuler dernier commit (garder changements)
git reset --soft HEAD~1

# Stash
git stash
git stash pop
```

---

**Version:** 2.0 Final  
**Dernière Mise à Jour:** 2026-05-07

💡 **Conseil:** Sauvegardez ce fichier pour référence rapide!
