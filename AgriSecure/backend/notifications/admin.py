from django.contrib import admin
from django.utils import timezone
from .models import Notification, NotificationTemplate, NotificationChannel


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'priority', 'is_read', 'is_sent', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'is_sent')
    search_fields = ('title', 'message', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('id', 'created_at', 'read_at', 'sent_at')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 30
    list_select_related = ('user',)

    fieldsets = (
        (None, {'fields': ('id', 'user', 'title', 'message')}),
        ('Catégorie', {'fields': ('notification_type', 'priority')}),
        ('Référence', {'fields': ('content_type', 'object_id', 'metadata')}),
        ('État', {'fields': ('is_read', 'read_at', 'is_sent', 'sent_at', 'created_at')}),
    )

    @admin.action(description='Marquer comme lues')
    def mark_as_read(self, request, queryset):
        now = timezone.now()
        updated = queryset.filter(is_read=False).update(is_read=True, read_at=now)
        self.message_user(request, f'{updated} notification(s) marquée(s) comme lues.')

    actions = ['mark_as_read']


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'channel', 'subject', 'is_active', 'updated_at')
    list_filter = ('channel', 'is_active')
    search_fields = ('name', 'subject', 'content')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('name',)
    list_per_page = 25

    fieldsets = (
        (None, {'fields': ('id', 'name', 'channel', 'is_active')}),
        ('Contenu', {'fields': ('subject', 'content', 'variables')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(NotificationChannel)
class NotificationChannelAdmin(admin.ModelAdmin):
    list_display = ('user', 'channel_type', 'is_enabled')
    list_filter = ('channel_type', 'is_enabled')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    autocomplete_fields = ('user',)
    readonly_fields = ('id',)
    ordering = ('user__email', 'channel_type')
    list_per_page = 25
