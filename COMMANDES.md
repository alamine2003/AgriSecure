# 🚀 Commandes Rapides - Makefile

Toutes les commandes sont centralisées dans le **Makefile**. Plus besoin de chercher parmi 50 fichiers .bat !

## 📋 Voir toutes les commandes

```bash
make help
```

---

## ⚡ Commandes Essentielles

### Démarrage

```bash
make start-dev    # Mode développement (RECOMMANDÉ, sans nginx)
make start-prod   # Mode production (avec nginx)
```

### Installation complète (première fois)

```bash
make install      # Build + migrate + créer user test
make start-dev    # Démarrer ensuite
```

---

## 🔧 Gestion Services

```bash
make status              # État des services
make restart-all         # Redémarrer tous les services
make restart-frontend    # Redémarrer frontend uniquement
make restart-backend     # Redémarrer backend uniquement
make logs                # Voir les logs (temps réel)
make down                # Arrêter tous les services
```

---

## 🐛 Corrections & Debug

```bash
make fix-login      # Corriger problème login/redirection
make fix-nginx      # Corriger configuration nginx
make test-login     # Tester la connexion API
make diagnostic     # Diagnostic complet du système
```

---

## 📊 Base de Données

```bash
make migrate            # Créer et appliquer migrations
make superuser          # Créer un superutilisateur
make create-test-user   # Créer admin@test.com / admin123
make shell              # Ouvrir shell Django
```

---

## 📋 Logs

```bash
make logs               # Tous les logs (temps réel)
make logs-frontend      # Logs frontend uniquement
make logs-backend       # Logs backend uniquement
make logs-nginx         # Logs nginx uniquement
make logs-all           # Derniers logs (100 lignes)
```

---

## 🧪 Tests

```bash
make test          # Lancer les tests
make coverage      # Rapport de couverture
```

---

## 🌐 Ouvrir dans le Navigateur

```bash
make open-frontend   # http://localhost:3000
make open-backend    # http://localhost:8000/admin/
make open-app        # http://localhost (via nginx)
```

---

## 🧹 Nettoyage

```bash
make clean    # Nettoyer conteneurs + volumes
make reset    # Clean + build + up (reset complet)
```

---

## 💡 Scénarios d'Usage

### Premier démarrage

```bash
make install       # Installation complète
make start-dev     # Démarrer en mode dev
make open-frontend # Ouvrir dans le navigateur
```

**Connexion:** admin@test.com / admin123

---

### Développement quotidien

```bash
make start-dev           # Démarrer
# ... développer ...
make logs-frontend       # Voir logs si problème
make restart-frontend    # Redémarrer après modif
make down                # Arrêter en fin de journée
```

---

### Problème de connexion/redirection

```bash
make fix-login      # Corriger config + créer user test
make test-login     # Tester la connexion
make logs-frontend  # Voir les logs détaillés
```

Puis dans le navigateur:
1. http://localhost:3000
2. F12 (Console)
3. Login avec admin@test.com / admin123
4. Observer les logs `[LOGIN]`

---

### Erreur 502 (nginx)

```bash
make fix-nginx      # Corriger nginx
# OU utiliser mode dev (plus stable):
make start-dev      # Pas de nginx, pas de 502 !
```

---

### Problème mystérieux

```bash
make diagnostic    # Diagnostic complet
make reset         # Reset complet (dernier recours)
make start-dev     # Redémarrer
```

---

## 🎯 Pour la Soutenance

**Avant la démo:**
```bash
make reset              # Partir de zéro
make install            # Installation propre
make create-test-user   # Créer users de test
make start-dev          # Démarrer (mode stable)
make diagnostic         # Vérifier que tout est OK
```

**Pendant la démo:**
```bash
make open-frontend   # Ouvrir l'app
# Présenter les fonctionnalités
make logs            # Montrer les logs en temps réel si besoin
```

---

## 📖 Documentation Complète

- `make help` - Liste complète des commandes
- `make info` - Informations sur le projet
- `GUIDE_DEMARRAGE.md` - Guide détaillé
- `CLAUDE.md` - Architecture technique
- `CORRECTION_LOGIN.md` - Debug login

---

## ✅ Checklist Rapide

```bash
make status       # Tous "Up" ?
make diagnostic   # Pas d'erreurs ?
make open-frontend # Page s'affiche ?
# Login avec admin@test.com / admin123
# Dashboard s'affiche ? ✅ Tout fonctionne !
```

---

**Astuce:** Toutes les commandes `make` fonctionnent de la même façon sur Windows, Linux et macOS !

**Date:** 2026-05-07  
**Version:** 2.0 - Makefile Centralisé
