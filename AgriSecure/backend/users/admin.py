from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, OTPCode, TrustedDevice


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'nin', 'role', 'is_active', 'must_change_password', 'date_joined')
    list_filter = ('role', 'is_active', 'must_change_password', 'is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name', 'nin', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_login')
    list_per_page = 25
    date_hierarchy = 'created_at'

    fieldsets = (
        (None, {'fields': ('id', 'email', 'password')}),
        (_('Informations personnelles'), {'fields': ('first_name', 'last_name', 'nin', 'phone')}),
        (_('Rôle & Statut'), {'fields': ('role', 'is_active', 'must_change_password')}),
        (_('Permissions Django'), {
            'classes': ('collapse',),
            'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Dates'), {'fields': ('created_at', 'updated_at', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nin', 'first_name', 'last_name', 'phone', 'role', 'password1', 'password2'),
        }),
    )

    @admin.action(description='Activer les comptes sélectionnés')
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} compte(s) activé(s).')

    @admin.action(description='Désactiver les comptes sélectionnés')
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} compte(s) désactivé(s).')

    @admin.action(description='Forcer le changement de mot de passe')
    def force_password_change(self, request, queryset):
        updated = queryset.update(must_change_password=True)
        self.message_user(request, f'{updated} compte(s) marqué(s) pour changement de mot de passe.')

    actions = ['activate_users', 'deactivate_users', 'force_password_change']


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'is_used', 'expired_display', 'expires_at', 'created_at')
    list_filter = ('is_used',)
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'code')
    readonly_fields = ('id', 'code', 'session_token', 'created_at', 'expired_display')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(boolean=True, description='Expiré')
    def expired_display(self, obj):
        return obj.is_expired


@admin.register(TrustedDevice)
class TrustedDeviceAdmin(admin.ModelAdmin):
    list_display = ('user', 'user_agent_short', 'valid_display', 'created_at', 'expires_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'user_agent')
    readonly_fields = ('id', 'token', 'created_at', 'valid_display')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25

    def has_add_permission(self, request):
        return False

    @admin.display(description='Appareil')
    def user_agent_short(self, obj):
        return (obj.user_agent[:60] + '…') if len(obj.user_agent) > 60 else (obj.user_agent or '—')

    @admin.display(boolean=True, description='Valide')
    def valid_display(self, obj):
        return obj.is_valid
