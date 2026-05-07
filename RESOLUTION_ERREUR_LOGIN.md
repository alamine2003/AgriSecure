# 🔧 Résolution Erreur Login 401

## Problème Observé

**Erreur:** "Email ou mot de passe incorrect" (401 Unauthorized)
**Compte testé:** babsba123@gmail.com / 10062004001

## Diagnostic Rapide

### Étape 1: Vérifier si le compte existe

Exécuter:
```bash
.\debug-login.bat
```

Ou manuellement:
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "SELECT email, nin, is_active, must_change_password FROM users_customuser WHERE email='babsba123@gmail.com';"
```

### Étape 2: Interpréter les Résultats

#### Cas A: Le compte N'EXISTE PAS
```
 email | nin | is_active | must_change_password 
-------+-----+-----------+----------------------
(0 rows)
```

**Solution:** Créer le compte (voir section "Créer le Compte" ci-dessous)

#### Cas B: Le compte EXISTE mais est INACTIF
```
      email           |     nin     | is_active | must_change_password 
----------------------+-------------+-----------+----------------------
 babsba123@gmail.com  | 10062004001 | f         | t
```

**Solution:** Activer le compte
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "UPDATE users_customuser SET is_active=true WHERE email='babsba123@gmail.com';"
```

#### Cas C: Le compte EXISTE, ACTIF mais mot de passe changé
```
      email           |     nin     | is_active | must_change_password 
----------------------+-------------+-----------+----------------------
 babsba123@gmail.com  | 10062004001 | t         | f
```

**Problème:** Le mot de passe a déjà été changé, le NIN ne fonctionne plus.

**Solution:** Réinitialiser le mot de passe au NIN
```bash
docker-compose exec backend python manage.py shell
```
```python
from users.models import CustomUser
user = CustomUser.objects.get(email='babsba123@gmail.com')
user.set_password(user.nin)  # Remet le NIN comme mot de passe
user.must_change_password = True
user.save()
print(f"Mot de passe réinitialisé: {user.nin}")
exit()
```

#### Cas D: Le compte EXISTE, ACTIF, mot de passe = NIN
```
      email           |     nin     | is_active | must_change_password 
----------------------+-------------+-----------+----------------------
 babsba123@gmail.com  | 10062004001 | t         | t
```

**Le compte est correct !** Si l'erreur persiste, vérifier:
1. Backend accessible: `curl http://localhost:8000/api/v1/auth/login/`
2. Logs backend: `docker-compose logs backend --tail=50`

## Créer le Compte

### Méthode 1: Via Interface Maintenancier (Recommandé)

1. **Login maintenancier**
   - Aller sur http://localhost:3000/login
   - Email: [email maintenancier]
   - Password: [password maintenancier]

2. **Créer l'agent**
   - Cliquer "Agents" dans sidebar
   - Remplir formulaire:
     * NIN: 10062004001
     * Email: babsba123@gmail.com
     * Prénom: Babs
     * Nom: Ba
     * Téléphone: 771234567
   - Cliquer "Créer"
   - ✅ Notification: "Agent créé"

3. **Tester connexion agent**
   - Logout maintenancier
   - Login avec babsba123@gmail.com / 10062004001

### Méthode 2: Via Page Inscription Publique

1. **Aller sur page d'inscription**
   - http://localhost:3000/register-agent

2. **Remplir formulaire complet**
   - NIN: 10062004001
   - Email: babsba123@gmail.com
   - Prénom: Babs
   - Nom: Ba
   - Téléphone: 771234567
   - Région: Dakar
   - Localité: Dakar
   - Adresse: Médina
   - Superficie: (optionnel)

3. **Envoyer demande**
   - ✅ "Demande envoyée avec succès"

4. **Approuver la demande (maintenancier)**
   - Login maintenancier
   - Cliquer "Demandes" (sidebar)
   - Voir demande de Babs Ba
   - Cliquer "Approuver"
   - Confirmer

5. **Tester connexion**
   - Logout
   - Login avec babsba123@gmail.com / 10062004001

### Méthode 3: Via Shell Django

```bash
docker-compose exec backend python manage.py shell
```

```python
from users.models import CustomUser

# Créer l'utilisateur
user = CustomUser.objects.create_user(
    email='babsba123@gmail.com',
    nin='10062004001',
    first_name='Babs',
    last_name='Ba',
    phone='771234567',
    role='agent_agricole'
)

print(f"✅ Compte créé:")
print(f"   Email: {user.email}")
print(f"   NIN: {user.nin}")
print(f"   Password initial: {user.nin}")
print(f"   Actif: {user.is_active}")
print(f"   Doit changer password: {user.must_change_password}")

exit()
```

## Vérification Post-Création

### 1. Vérifier dans DB
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "SELECT email, nin, is_active, must_change_password FROM users_customuser WHERE email='babsba123@gmail.com';"
```

Résultat attendu:
```
      email           |     nin     | is_active | must_change_password 
----------------------+-------------+-----------+----------------------
 babsba123@gmail.com  | 10062004001 | t         | t
```

### 2. Tester Login
1. Ouvrir http://localhost:3000/login
2. Email: babsba123@gmail.com
3. Password: 10062004001
4. Cliquer "Se connecter"

**Résultat attendu:**
- ✅ Redirection vers `/change-password`
- Message: "Change ton mot de passe pour continuer"

### 3. Changer le mot de passe
1. Ancien mot de passe: 10062004001
2. Nouveau mot de passe: BabsBa123! (min 8 caractères)
3. Confirmer
4. ✅ Accès au dashboard agent

## Erreurs Courantes

### Erreur: "Ancien mot de passe incorrect"
**Cause:** Le mot de passe a déjà été changé
**Solution:** Réinitialiser au NIN (voir Cas C ci-dessus)

### Erreur: Compte désactivé
**Cause:** `is_active = false` dans DB
**Solution:** 
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "UPDATE users_customuser SET is_active=true WHERE email='babsba123@gmail.com';"
```

Ou via interface maintenancier:
- Aller sur "Agents"
- Cliquer bouton "Check" (✓) sur le compte

### Erreur: NIN ou Email déjà utilisé
**Cause:** Un compte existe déjà avec ce NIN ou cet email
**Solution:** Utiliser un autre NIN/email ou supprimer le compte existant

## Commandes Utiles

### Lister tous les agents
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "SELECT email, nin, first_name, last_name, is_active FROM users_customuser WHERE role='agent_agricole' ORDER BY created_at DESC;"
```

### Supprimer un compte
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "DELETE FROM users_customuser WHERE email='babsba123@gmail.com';"
```

### Activer tous les comptes inactifs
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "UPDATE users_customuser SET is_active=true WHERE role='agent_agricole';"
```

### Réinitialiser tous les mots de passe au NIN
```bash
docker-compose exec backend python manage.py shell
```
```python
from users.models import CustomUser
agents = CustomUser.objects.filter(role='agent_agricole')
for agent in agents:
    agent.set_password(agent.nin)
    agent.must_change_password = True
    agent.save()
    print(f"✅ {agent.email} → password: {agent.nin}")
exit()
```

## Test Complet (Nouveau Compte)

### Créer et tester un nouveau compte de A à Z

**1. Créer via maintenancier**
```
Login maintenancier → Agents → Créer:
- NIN: 11223344556
- Email: test.demo@agri.sn
- Prénom: Test
- Nom: Demo
- Tel: 771112233
```

**2. Login agent**
```
Email: test.demo@agri.sn
Password: 11223344556
→ Redirection /change-password ✓
```

**3. Changer password**
```
Ancien: 11223344556
Nouveau: TestDemo123!
Confirmer: TestDemo123!
→ Accès dashboard ✓
```

**4. Re-login avec nouveau password**
```
Logout → Login:
Email: test.demo@agri.sn
Password: TestDemo123!
→ Accès dashboard direct ✓
```

## Support Backend

### Vérifier logs d'authentification
```bash
docker-compose logs backend --tail=100 | grep -i "login\|auth\|401"
```

### Redémarrer backend si problème
```bash
docker-compose restart backend
docker-compose logs backend --tail=50
```

### Vérifier JWT settings
```bash
docker-compose exec backend python manage.py shell
```
```python
from django.conf import settings
print("JWT Settings:")
print(f"ACCESS_TOKEN_LIFETIME: {settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']}")
print(f"REFRESH_TOKEN_LIFETIME: {settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']}")
exit()
```

---

## Résumé Actions Rapides

**Le compte n'existe pas:**
```bash
# Via maintenancier web OU
docker-compose exec backend python manage.py shell
# puis créer avec create_user()
```

**Le compte existe mais inactif:**
```bash
docker-compose exec db psql -U postgres -d surveillance_db -c "UPDATE users_customuser SET is_active=true WHERE email='babsba123@gmail.com';"
```

**Le mot de passe a été changé (must_change_password=false):**
```bash
docker-compose exec backend python manage.py shell
# puis réinitialiser avec set_password(user.nin)
```

✅ **Le problème devrait être résolu après l'une de ces actions !**
