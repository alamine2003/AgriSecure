from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import update_session_auth_hash
from django.utils.translation import gettext_lazy as _
from .models import CustomUser
from .serializers import UserSerializer, UserCreateSerializer, ChangePasswordSerializer
from .permissions import IsMaintenancier, MustChangePasswordPermission

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": _("Email ou mot de passe incorrect."),
    }

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='agent_agricole')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsMaintenancier]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'Utilisateur activé'})

    @action(detail=True, methods=['patch'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
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
