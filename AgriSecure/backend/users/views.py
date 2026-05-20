from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, update_session_auth_hash
from django.utils.translation import gettext_lazy as _
from django.core.mail import send_mail
from django.conf import settings
import logging
from .models import CustomUser, OTPCode, TrustedDevice
from .serializers import UserSerializer, UserCreateSerializer, ChangePasswordSerializer
from .permissions import IsMaintenancier, MustChangePasswordPermission
from surveillance.audit import log_action

logger = logging.getLogger(__name__)


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class OTPRateThrottle(AnonRateThrottle):
    scope = 'otp'

class LoginStep1View(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        device_token = request.data.get('device_token', '').strip()

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {'detail': _('Email ou mot de passe incorrect.')},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {'detail': _('Ce compte est désactivé.')},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Appareil de confiance → on saute l'OTP
        if device_token:
            try:
                device = TrustedDevice.objects.get(token=device_token, user=user)
                if device.is_valid:
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'otp_required': False,
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserSerializer(user).data,
                    })
                else:
                    device.delete()
            except TrustedDevice.DoesNotExist:
                pass

        otp = OTPCode.generate_for(user)

        try:
            send_mail(
                subject="AgriWatch — Code de vérification",
                message=(
                    f"Bonjour {user.first_name},\n\n"
                    f"Votre code de connexion AgriWatch est : {otp.code}\n\n"
                    "Ce code est valable 10 minutes. Ne le partagez à personne.\n\n"
                    "Cordialement,\nL'équipe AgriWatch"
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@agriwatch.sn'),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Échec envoi OTP pour %s : %s", user.email, e)
            return Response(
                {'detail': "Impossible d'envoyer le code par email. Réessayez."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({'otp_required': True, 'session_token': str(otp.session_token)})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPRateThrottle]

    def post(self, request):
        session_token = request.data.get('session_token', '')
        otp_code = request.data.get('otp_code', '').strip()
        remember_device = bool(request.data.get('remember_device', False))

        try:
            otp = OTPCode.objects.select_related('user').get(
                session_token=session_token,
                code=otp_code,
                is_used=False,
            )
        except OTPCode.DoesNotExist:
            return Response({'detail': 'Code invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp.is_expired:
            return Response({'detail': 'Code expiré. Reconnectez-vous.'}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save(update_fields=['is_used'])

        user = otp.user
        refresh = RefreshToken.for_user(user)
        payload = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }

        if remember_device:
            device = TrustedDevice.create_for(
                user,
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:300],
            )
            payload['device_token'] = str(device.token)

        return Response(payload)

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='agent_agricole')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsMaintenancier]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        log_action(self.request.user, 'CREATE_AGENT', user, self.request)

    def perform_destroy(self, instance):
        log_action(self.request.user, 'DELETE_AGENT', instance, self.request)
        instance.delete()

    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        log_action(request.user, 'ACTIVATE_AGENT', user, request)
        try:
            send_mail(
                subject="AgriWatch — Votre compte a été approuvé",
                message=(
                    f"Bonjour {user.first_name} {user.last_name},\n\n"
                    "Votre compte Agent Agricole sur AgriWatch a été approuvé par un maintenancier.\n"
                    "Vous pouvez désormais vous connecter avec votre email et votre mot de passe.\n\n"
                    "Cordialement,\nL'équipe AgriWatch"
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@agriwatch.sn'),
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Échec de l'envoi de l'email d'approbation pour %s : %s", user.email, e)
        return Response({'status': 'Utilisateur activé'})

    @action(detail=True, methods=['patch'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        log_action(request.user, 'DEACTIVATE_AGENT', user, request)
        return Response({'status': 'Utilisateur désactivé'})

class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        current = (serializer.validated_data.get('old_password')
                   or serializer.validated_data.get('current_password', ''))
        if not user.check_password(current):
            return Response(
                {"current_password": ["Mot de passe actuel incorrect."],
                 "old_password": ["Ancien mot de passe incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.must_change_password = False
        user.save()
        update_session_auth_hash(request, user)
        return Response({"status": "Mot de passe changé avec succès"}, status=status.HTTP_200_OK)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)
