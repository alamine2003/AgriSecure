@echo off
echo ===============================================
echo CREATION COMPTE: babsba123@gmail.com
echo ===============================================
echo.

cd /d "%~dp0"

echo NIN: 10062004001
echo Email: babsba123@gmail.com
echo Prenom: Babs
echo Nom: Ba
echo Tel: 771234567
echo Role: agent_agricole
echo.

echo [1/2] Creation du compte via Django shell...
echo.

docker-compose exec -T backend python manage.py shell <<EOF
from users.models import CustomUser

# Supprimer si existe deja (au cas ou)
CustomUser.objects.filter(email='babsba123@gmail.com').delete()

# Creer le compte
user = CustomUser.objects.create_user(
    email='babsba123@gmail.com',
    nin='10062004001',
    first_name='Babs',
    last_name='Ba',
    phone='771234567',
    role='agent_agricole'
)

print('=' * 50)
print('COMPTE CREE AVEC SUCCES')
print('=' * 50)
print(f'Email: {user.email}')
print(f'NIN: {user.nin}')
print(f'Nom complet: {user.first_name} {user.last_name}')
print(f'Password initial: {user.nin}')
print(f'Actif: {user.is_active}')
print(f'Doit changer password: {user.must_change_password}')
print('=' * 50)
EOF

echo.
echo [2/2] Verification dans DB...
echo.
docker-compose exec postgres sh -c "psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c \"SELECT email, nin, first_name, last_name, is_active, must_change_password FROM users_customuser WHERE email='babsba123@gmail.com';\""

echo.
echo ===============================================
echo TEST LOGIN
echo ===============================================
echo.
echo 1. Ouvrir: http://localhost:3000/login
echo 2. Email: babsba123@gmail.com
echo 3. Password: 10062004001
echo 4. Cliquer "Se connecter"
echo.
echo ^> Devrait rediriger vers /change-password
echo.
pause
