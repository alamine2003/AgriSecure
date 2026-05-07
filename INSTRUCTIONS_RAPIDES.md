# ⚡ Instructions Rapides - Résolution Login

## ⚠️ Problème Identifié

L'erreur `role "postgres" does not exist` signifie que le nom d'utilisateur PostgreSQL est défini par variable d'environnement.

## ✅ Solution: Nouveaux Scripts (Version 2)

### 🎯 Scripts Corrigés à Utiliser

#### 1. Vérifier le compte
```bash
.\check-babsba-v2.bat
```

#### 2. Créer le compte
```bash
.\create-babsba-v2.bat
```

#### 3. Activer le compte
```bash
.\activate-babsba-v2.bat
```

**Ces scripts utilisent automatiquement les bonnes variables d'environnement du conteneur PostgreSQL.**

---

## 🚀 Workflow Rapide

### Option A: Via Scripts (Recommandé)

**Étape 1:** Créer le compte
```bash
.\create-babsba-v2.bat
```

**Ce script va:**
- ✅ Supprimer le compte s'il existe déjà
- ✅ Créer un nouveau compte avec:
  - Email: `babsba123@gmail.com`
  - NIN: `10062004001`
  - Password: `10062004001`
- ✅ Afficher les détails
- ✅ Vérifier dans la DB

**Étape 2:** Tester le login
1. Ouvrir: http://localhost:3000/login
2. Email: `babsba123@gmail.com`
3. Password: `10062004001`
4. ✅ Devrait rediriger vers `/change-password`

---

### Option B: Via Interface Web (Plus Simple)

**Méthode 1: Login Maintenancier et Créer**

1. **Login maintenancier**
   - Aller sur: http://localhost:3000/login
   - Email: [votre email maintenancier]
   - Password: [votre password maintenancier]

2. **Créer l'agent**
   - Cliquer **"Agents"** dans sidebar
   - Remplir formulaire:
     * NIN: `10062004001`
     * Email: `babsba123@gmail.com`
     * Prénom: `Babs`
     * Nom: `Ba`
     * Téléphone: `771234567`
   - Cliquer **"Créer"**
   - ✅ Notification: "Agent créé - L'agent peut se connecter avec son NIN (10062004001)"

3. **Tester login agent**
   - Logout maintenancier
   - Login avec:
     * Email: `babsba123@gmail.com`
     * Password: `10062004001`
   - ✅ Devrait fonctionner !

**Méthode 2: Page Inscription Publique**

1. **Aller sur inscription**
   - http://localhost:3000/register-agent

2. **Remplir formulaire**
   - NIN: `10062004001`
   - Email: `babsba123@gmail.com`
   - Prénom: `Babs`
   - Nom: `Ba`
   - Téléphone: `771234567`
   - Région: `Dakar`
   - Localité: `Dakar`
   - Adresse: `Médina`
   - Cliquer **"Envoyer la Demande"**

3. **Approuver (maintenancier)**
   - Login maintenancier
   - Cliquer **"Demandes"** (sidebar)
   - Voir demande de Babs Ba
   - Cliquer **"Approuver"**
   - Confirmer

4. **Login agent**
   - Email: `babsba123@gmail.com`
   - Password: `10062004001`

---

## 🎯 Recommandation

**LA PLUS SIMPLE:** Utiliser l'interface web (Méthode 1)

1. Login maintenancier
2. Agents → Créer
3. Remplir formulaire
4. Tester login agent

**Avantages:**
- ✅ Pas de ligne de commande
- ✅ Interface visuelle
- ✅ Vérification immédiate
- ✅ Parfait pour démo soutenance

---

## 📋 Vérifier les Credentials Maintenancier

Si vous ne connaissez pas les credentials maintenancier:

```bash
.\create-babsba-v2.bat
```

Et regardez la section **"[3/3] Compte maintenancier pour test"**

Ou créez un superuser:
```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## 🐛 Dépannage

### Script ne fonctionne pas

**Solution:** Utiliser l'interface web (plus fiable)

### Impossible de login maintenancier

**Créer un superuser:**
```bash
docker-compose exec backend python manage.py createsuperuser
```

Suivre les prompts:
- Email: admin@admin.com
- NIN: 00000000000
- Prénom: Admin
- Nom: System
- Password: [votre choix]

### Services ne démarrent pas

```bash
docker-compose down
docker-compose up -d
docker-compose ps
```

---

## ✅ Test Final

Après avoir créé le compte (via script OU interface):

1. **Ouvrir:** http://localhost:3000/login
2. **Email:** `babsba123@gmail.com`
3. **Password:** `10062004001`
4. **Cliquer:** "Se connecter"

**Résultat attendu:**
- ✅ Redirection vers `/change-password`
- 📢 Message: "Change ton mot de passe pour continuer"

**Changer le password:**
- Ancien: `10062004001`
- Nouveau: `BabsBa2024!`
- Confirmer: `BabsBa2024!`

**Résultat:**
- ✅ Accès au dashboard agent
- 🎉 **Succès !**

---

## 🎓 Pour la Soutenance

**Scénario Recommandé:**

1. **Montrer inscription publique**
   - Remplir formulaire d'inscription
   - Envoyer demande

2. **Login maintenancier**
   - Montrer dashboard maintenancier
   - Aller sur "Demandes"
   - Approuver la demande en direct

3. **Login agent (nouvellement créé)**
   - Login avec NIN
   - Changer password obligatoire
   - Accès dashboard agent

**Durée:** ~5 minutes
**Impact:** 🔥 Démo complète du workflow

---

## 📞 Support Rapide

**Besoin d'aide immédiate:**

1. Services démarrés ?
   ```bash
   docker-compose ps
   ```

2. Logs backend:
   ```bash
   docker-compose logs backend --tail=30
   ```

3. Frontend accessible ?
   - http://localhost:3000

**Tout redémarrer:**
```bash
docker-compose restart
```

---

## 🎯 Résumé Ultra-Rapide

**SOLUTION LA PLUS SIMPLE:**

1. Login maintenancier sur http://localhost:3000/login
2. Agents → Créer un agent avec NIN `10062004001` et email `babsba123@gmail.com`
3. Logout
4. Login agent avec email + NIN
5. ✅ **Ça marche !**

**🚀 Prêt pour la soutenance !**
