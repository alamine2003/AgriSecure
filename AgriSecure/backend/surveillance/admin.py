from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    Camera, Detection, Alert,
    InstallationAppointment, AgentRegistrationRequest, AuditLog,
)
from .models_technician import Technician
from .models_perimeter import FieldPerimeter
from .models_subscription import Subscription, Payment

# ────────────────────────────────────────────────────────────────
# Site header
# ────────────────────────────────────────────────────────────────
admin.site.site_header = 'AgriWatch — Administration'
admin.site.site_title = 'AgriWatch Admin'
admin.site.index_title = 'Tableau de bord'


# ────────────────────────────────────────────────────────────────
# Caméras
# ────────────────────────────────────────────────────────────────
@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'agent', 'is_active', 'camera_index', 'installed_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'location', 'agent__email', 'agent__first_name', 'agent__last_name')
    autocomplete_fields = ('agent',)
    readonly_fields = ('id',)
    ordering = ('-installed_at',)
    list_per_page = 25

    fieldsets = (
        (None, {'fields': ('id', 'name', 'location', 'agent', 'camera_index', 'is_active')}),
        ('Coordonnées GPS', {'fields': ('latitude', 'longitude')}),
        ('Installation', {'fields': ('installed_at',)}),
    )


# ────────────────────────────────────────────────────────────────
# Détections
# ────────────────────────────────────────────────────────────────
@admin.register(Detection)
class DetectionAdmin(admin.ModelAdmin):
    list_display = ('detected_at', 'label', 'danger_badge', 'confidence_display', 'camera', 'agent', 'is_alert')
    list_filter = ('danger_level', 'is_alert', 'label')
    search_fields = ('label', 'camera__name', 'agent__email', 'agent__first_name')
    readonly_fields = ('id', 'detected_at', 'bbox', 'frame_capture')
    ordering = ('-detected_at',)
    date_hierarchy = 'detected_at'
    list_per_page = 30
    list_select_related = ('camera', 'agent')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(description='Danger')
    def danger_badge(self, obj):
        colors = {'HIGH': '#dc2626', 'MEDIUM': '#d97706', 'LOW': '#16a34a'}
        color = colors.get(obj.danger_level, '#6b7280')
        return format_html('<span style="color:{}; font-weight:bold;">{}</span>', color, obj.get_danger_level_display())

    @admin.display(description='Confiance')
    def confidence_display(self, obj):
        return f'{obj.confidence:.1f}%'


# ────────────────────────────────────────────────────────────────
# Alertes
# ────────────────────────────────────────────────────────────────
@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'detection_label', 'danger_level', 'agent', 'is_read', 'resolved_at')
    list_filter = ('is_read', 'detection__danger_level')
    search_fields = ('message', 'detection__camera__name', 'detection__agent__email')
    readonly_fields = ('id', 'created_at', 'detection')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25
    list_select_related = ('detection__camera', 'detection__agent')

    @admin.display(description='Détection')
    def detection_label(self, obj):
        return obj.detection.label

    @admin.display(description='Niveau')
    def danger_level(self, obj):
        return obj.detection.get_danger_level_display()

    @admin.display(description='Agent')
    def agent(self, obj):
        return obj.detection.agent

    @admin.action(description='Marquer comme résolues')
    def mark_resolved(self, request, queryset):
        updated = queryset.filter(resolved_at__isnull=True).update(resolved_at=timezone.now(), is_read=True)
        self.message_user(request, f'{updated} alerte(s) résolue(s).')

    actions = ['mark_resolved']


# ────────────────────────────────────────────────────────────────
# Rendez-vous d'installation
# ────────────────────────────────────────────────────────────────
@admin.register(InstallationAppointment)
class InstallationAppointmentAdmin(admin.ModelAdmin):
    list_display = ('agent', 'region', 'locality', 'status_badge', 'technician', 'scheduled_at', 'created_at')
    list_filter = ('status', 'region')
    search_fields = ('agent__email', 'agent__first_name', 'agent__last_name', 'locality', 'address')
    autocomplete_fields = ('agent', 'technician')
    readonly_fields = ('id', 'created_at', 'updated_at', 'completed_at')
    ordering = ('status', '-created_at')
    date_hierarchy = 'created_at'
    list_per_page = 25
    list_select_related = ('agent', 'technician__user')

    fieldsets = (
        (None, {'fields': ('id', 'agent', 'technician', 'status')}),
        ('Localisation', {'fields': ('region', 'locality', 'address', 'latitude', 'longitude')}),
        ('Planification', {'fields': ('requested_date', 'scheduled_at', 'notes')}),
        ('Installation', {'fields': ('equipment_installed', 'installation_notes', 'completed_at')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )

    @admin.display(description='Statut')
    def status_badge(self, obj):
        colors = {
            'PENDING': '#d97706',
            'SCHEDULED': '#2563eb',
            'DONE': '#16a34a',
            'CANCELLED': '#dc2626',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html('<span style="color:{}; font-weight:bold;">{}</span>', color, obj.get_status_display())


# ────────────────────────────────────────────────────────────────
# Demandes d'inscription
# ────────────────────────────────────────────────────────────────
@admin.register(AgentRegistrationRequest)
class AgentRegistrationRequestAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'nin', 'region', 'status_badge', 'is_archived', 'created_at')
    list_filter = ('status', 'region', 'is_archived')
    search_fields = ('email', 'nin', 'first_name', 'last_name', 'locality')
    readonly_fields = ('id', 'created_at', 'processed_at', 'created_user')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25

    fieldsets = (
        (None, {'fields': ('id', 'status', 'rejection_reason', 'is_archived')}),
        ('Identité', {'fields': ('first_name', 'last_name', 'email', 'nin', 'phone')}),
        ('Localisation', {'fields': ('region', 'locality', 'address', 'farm_size')}),
        ('Traitement', {'fields': ('created_user', 'created_at', 'processed_at')}),
    )

    @admin.display(description='Statut')
    def status_badge(self, obj):
        colors = {'PENDING': '#d97706', 'APPROVED': '#16a34a', 'REJECTED': '#dc2626'}
        color = colors.get(obj.status, '#6b7280')
        return format_html('<span style="color:{}; font-weight:bold;">{}</span>', color, obj.get_status_display())

    @admin.action(description='Archiver les demandes sélectionnées')
    def archive_requests(self, request, queryset):
        updated = queryset.exclude(status='PENDING').update(is_archived=True)
        self.message_user(request, f'{updated} demande(s) archivée(s).')

    actions = ['archive_requests']


# ────────────────────────────────────────────────────────────────
# Logs d'audit (lecture seule)
# ────────────────────────────────────────────────────────────────
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user', 'action_display', 'target_type', 'target_name', 'ip_address')
    list_filter = ('action', 'target_type')
    search_fields = ('user__email', 'target_name', 'ip_address')
    readonly_fields = ('id', 'user', 'action', 'target_type', 'target_id', 'target_name', 'details', 'ip_address', 'user_agent', 'created_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 30
    list_select_related = ('user',)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description='Action')
    def action_display(self, obj):
        return obj.get_action_display()


# ────────────────────────────────────────────────────────────────
# Techniciens
# ────────────────────────────────────────────────────────────────
@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ('user', 'employee_id', 'speciality', 'phone', 'region', 'is_available')
    list_filter = ('speciality', 'is_available', 'region')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'employee_id', 'phone')
    autocomplete_fields = ('user',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('user__last_name',)
    list_per_page = 25

    fieldsets = (
        (None, {'fields': ('id', 'user', 'employee_id', 'speciality')}),
        ('Contact & Disponibilité', {'fields': ('phone', 'region', 'is_available')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )


# ────────────────────────────────────────────────────────────────
# Périmètres de champs
# ────────────────────────────────────────────────────────────────
@admin.register(FieldPerimeter)
class FieldPerimeterAdmin(admin.ModelAdmin):
    list_display = ('name', 'agent', 'area_hectares', 'is_active', 'is_premium_visible', 'created_at')
    list_filter = ('is_active', 'is_premium_visible')
    search_fields = ('name', 'description', 'agent__email', 'agent__first_name', 'agent__last_name')
    autocomplete_fields = ('agent',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25

    fieldsets = (
        (None, {'fields': ('id', 'agent', 'name', 'description')}),
        ('Géographie', {'fields': ('coordinates', 'center_lat', 'center_lng', 'area_hectares')}),
        ('Statut', {'fields': ('is_active', 'is_premium_visible')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )


# ────────────────────────────────────────────────────────────────
# Abonnements
# ────────────────────────────────────────────────────────────────
class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ('id', 'created_at', 'updated_at', 'payment_date')
    fields = ('amount', 'payment_method', 'status', 'transaction_id', 'payment_date', 'created_at')
    ordering = ('-created_at',)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('agent', 'plan', 'status', 'monthly_price', 'start_date', 'end_date')
    list_filter = ('plan', 'status')
    search_fields = ('agent__email', 'agent__first_name', 'agent__last_name')
    autocomplete_fields = ('agent',)
    readonly_fields = ('id', 'start_date', 'created_at', 'updated_at')
    ordering = ('-start_date',)
    date_hierarchy = 'start_date'
    list_per_page = 25
    inlines = [PaymentInline]

    fieldsets = (
        (None, {'fields': ('id', 'agent', 'plan', 'status', 'monthly_price')}),
        ('Dates', {'fields': ('start_date', 'end_date', 'cancelled_at', 'created_at', 'updated_at')}),
        ('Fonctionnalités incluses', {
            'fields': (
                'includes_camera', 'includes_perimeter_mapping',
                'includes_advanced_analytics', 'includes_email_alerts', 'includes_phone_alerts',
            ),
        }),
    )

    @admin.action(description='Suspendre les abonnements sélectionnés')
    def suspend_subscriptions(self, request, queryset):
        updated = queryset.filter(status='ACTIVE').update(status='SUSPENDED')
        self.message_user(request, f'{updated} abonnement(s) suspendu(s).')

    actions = ['suspend_subscriptions']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('agent_email', 'amount', 'payment_method', 'status', 'payment_date', 'created_at')
    list_filter = ('status', 'payment_method')
    search_fields = ('subscription__agent__email', 'transaction_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25
    list_select_related = ('subscription__agent',)

    @admin.display(description='Agent')
    def agent_email(self, obj):
        return obj.subscription.agent.email
