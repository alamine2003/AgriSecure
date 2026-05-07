from django.urls import path, include
from core.router import SafeFormatSuffixRouter
from .views import ReportViewSet
from .views_pdf import ReportViewSet as PDFReportViewSet

router = SafeFormatSuffixRouter()
router.register(r'', ReportViewSet, basename='reports')
router.register(r'pdf', PDFReportViewSet, basename='pdf-reports')

urlpatterns = [
    path('', include(router.urls)),
]
