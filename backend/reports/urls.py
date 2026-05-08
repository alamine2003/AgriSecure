from django.urls import path, include
from core.router import SafeFormatSuffixRouter
from .views import ReportViewSet
from .views_pdf import PDFReportGeneratorViewSet

router = SafeFormatSuffixRouter()
router.register(r'', ReportViewSet, basename='reports')
router.register(r'pdf', PDFReportGeneratorViewSet, basename='pdf-reports')

urlpatterns = [
    path('', include(router.urls)),
]
