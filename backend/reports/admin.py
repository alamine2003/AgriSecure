from django.contrib import admin
from django.utils.html import format_html
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'file_format', 'generated_by', 'download_link', 'created_at')
    list_filter = ('file_format',)
    search_fields = ('title', 'generated_by__email', 'generated_by__first_name', 'generated_by__last_name')
    readonly_fields = ('id', 'created_at', 'download_link')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page = 25
    list_select_related = ('generated_by',)

    fieldsets = (
        (None, {'fields': ('id', 'title', 'file_format', 'generated_by')}),
        ('Fichier', {'fields': ('file_path', 'download_link')}),
        ('Dates', {'fields': ('created_at',)}),
    )

    def has_add_permission(self, request):
        return False

    @admin.display(description='Télécharger')
    def download_link(self, obj):
        if obj.file_path:
            return format_html('<a href="{}" target="_blank">⬇ Télécharger</a>', obj.file_path.url)
        return '—'
