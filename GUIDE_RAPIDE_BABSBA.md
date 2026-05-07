# 🚀 Guide Rapide - Compte babsba123@gmail.com

## Scripts Disponibles

### 1. Vérifier si le compte existe
```bash
.\check-babsba.bat
```

**Résultats possibles:**

**A) Aucun résultat** → Le compte n'existe pas
```
 email | nin | first_name | last_name | is_active | must_change_password 
-------+-----+------------+-----------+-----------+----------------------
(0 rows)
```
➡️ **Action:** Exécuter `.\create-babsba.bat`

**B) Compte existe mais inactif** (is_active = f)
```
      email           |     nin     | first_name | last_name | is_active | must_change_password 
----------------------+-------------+------------+-----------+-----------+----------------------
 babsba123@gmail.com  | 10062004001 | Babs       | Ba        | f         | t
```
➡️ **Action:** Exécuter `.\activate-babsba.bat`

**C) Compte existe et actif** (is_active = t)
```
      email           |     nin     | first_name | last_name | is_active | must_change_password 
----------------------+-------------+------------+-----------+-----------+----------------------
 babsba123@gmail.com  | 10062004001 | Babs       | Ba        | t         | t
```
➡️ **Action:** Tester login directement

---

### 2. Créer le compte (si n'existe pas)
```bash
.\create-babsba.bat
```

**Ce script va:**
1. Supprimer le compte s'il existe déjà (nettoyage)
2. Créer un nouveau compte avec:
   - Email: `babsba123@gmail.com`
   - NIN: `10062004001`
   - Prénom: `Babs`
   - Nom: `Ba`
   - Téléphone: `771234567`
   - Rôle: `agent_agricole`
   - Password initial: `10062004001` (= NIN)
3. Afficher les détails du compte créé
4. Vérifier dans la base de données

**Après exécution:**
✅ Le compte est créé et actif
✅ Prêt à tester le login

---

### 3. Activer le compte (si désactivé)
```bash
.\activate-babsba.bat
```

**Ce script va:**
1. Activer le compte (`is_active = true`)
2. Vérifier que l'activation a réussi

---

## 🧪 Tester le Login

### Première Connexion

1. **Ouvrir:** http://localhost:3000/login
2. **Email:** `babsba123@gmail.com`
3. **Password:** `10062004001`
4. **Cliquer:** "Se connecter"

**Résultat attendu:**
- ✅ Redirection vers `/change-password`
- 📢 Message: "Change ton mot de passe pour continuer"

### Changer le Mot de Passe

1. **Ancien mot de passe:** `10062004001`
2. **Nouveau mot de passe:** `BabsBa2024!` (min 8 caractères)
3. **Confirmer:** `BabsBa2024!`
4. **Cliquer:** "Changer le mot de passe"

**Résultat attendu:**
- ✅ Redirection vers `/dashboard`
- 📢 Message: "Mot de passe changé avec succès"
- 🎯 Accès au dashboard agent

### Reconnexion

1. **Logout** (si besoin)
2. **Login avec:**
   - Email: `babsba123@gmail.com`
   - Password: `BabsBa2024!` (le nouveau)
3. **Résultat:** Accès direct au dashboard ✅

---

## ⚠️ Problèmes Courants

### Erreur: "Email ou mot de passe incorrect"

**Vérifier:**
1. Le compte existe: `.\check-babsba.bat`
2. Le compte est actif (is_active = t)
3. Le bon mot de passe:
   - Si `must_change_password = t` → Password = NIN (`10062004001`)
   - Si `must_change_password = f` → Password = le nouveau (après changement)

**Solution rapide:**
```bash
.\create-babsba.bat
```
Cela recrée le compte avec password = NIN.

---

### Le compte existe déjà avec ce NIN/email

**Si vous voulez recréer:**
```bash
# Via PowerShell
docker-compose exec postgres psql -U postgres -d surveillance_db -c "DELETE FROM users_customuser WHERE email='babsba123@gmail.com';"

# Puis créer
.\create-babsba.bat
```

---

### Réinitialiser le password au NIN (si oublié)

```bash
# Ouvrir shell Django
docker-compose exec backend python manage.py shell
```

```python
from users.models import CustomUser
user = CustomUser.objects.get(email='babsba123@gmail.com')
user.set_password(user.nin)  # Remet le NIN comme password
user.must_change_password = True
user.save()
print(f"✅ Password réinitialisé: {user.nin}")
exit()
```

---

## 📋 Commandes Manuelles (PowerShell)

### Vérifier le compte
```powershell
docker-compose exec postgres psql -U postgres -d surveillance_db -c "SELECT email, nin, is_active, must_change_password FROM users_customuser WHERE email='babsba123@gmail.com';"
```

### Créer le compte
```powershell
docker-compose exec backend python manage.py shell
```
```python
from users.models import CustomUser
user = CustomUser.objects.create_user(
    email='babsba123@gmail.com',
    nin='10062004001',
    first_name='Babs',
    last_name='Ba',
    phone='771234567',
    role='agent_agricole'
)
print(f"✅ Créé: {user.email}, password={user.nin}")
exit()
```

### Activer le compte
```powershell
docker-compose exec postgres psql -U postgres -d surveillance_db -c "UPDATE users_customuser SET is_active=true WHERE email='babsba123@gmail.com';"
```

### Supprimer le compte
```powershell
docker-compose exec postgres psql -U postgres -d surveillance_db -c "DELETE FROM users_customuser WHERE email='babsba123@gmail.com';"
```

---

## ✅ Workflow Complet de Test

### Scénario: Créer et tester un nouveau compte

**1. Vérifier état actuel**
```bash
.\check-babsba.bat
```

**2. Créer le compte**
```bash
.\create-babsba.bat
```

**3. Vérifier création**
✅ Le script affiche les détails du compte

**4. Tester login**
- Aller sur: http://localhost:3000/login
- Email: `babsba123@gmail.com`
- Password: `10062004001`
- ✅ Redirection `/change-password`

**5. Changer password**
- Ancien: `10062004001`
- Nouveau: `BabsBa2024!`
- ✅ Accès dashboard

**6. Re-login avec nouveau password**
- Logout
- Email: `babsba123@gmail.com`
- Password: `BabsBa2024!`
- ✅ Dashboard direct

---

## 🎓 Pour la Soutenance

### Démo Login Agent

**Étape 1: Montrer compte existant**
```bash
.\check-babsba.bat
```
Expliquer les colonnes (email, NIN, actif, must_change_password)

**Étape 2: Login première fois**
- Montrer formulaire login
- Entrer email + NIN
- Montrer redirection automatique `/change-password`

**Étape 3: Changement mot de passe obligatoire**
- Expliquer sécurité (NIN temporaire)
- Changer le password
- Montrer accès dashboard

**Étape 4: Features dashboard agent**
- Statistiques
- Détections récentes
- Alertes

---

## 📞 Support

**Service ne démarre pas:**
```bash
docker-compose up -d
docker-compose ps
```

**Logs backend:**
```bash
docker-compose logs backend --tail=50
```

**Logs postgres:**
```bash
docker-compose logs postgres --tail=30
```

**Redémarrer tout:**
```bash
docker-compose restart
```

---

## 🎯 Résumé Actions Rapides

| Situation | Commande |
|-----------|----------|
| Compte n'existe pas | `.\create-babsba.bat` |
| Compte désactivé | `.\activate-babsba.bat` |
| Vérifier statut | `.\check-babsba.bat` |
| Password oublié | Shell Django → `set_password(nin)` |
| Recréer compte | Supprimer puis `.\create-babsba.bat` |

**✅ Tout est prêt pour la soutenance !** 🚀
