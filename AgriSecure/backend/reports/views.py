from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from django.utils.dateparse import parse_datetime, parse_date
from surveillance.models import Detection
from .models import Report
from .serializers import ReportSerializer
from .generators import generate_pdf_report, generate_csv_report
from users.permissions import IsAgentAgricole, MustChangePasswordPermission

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated, MustChangePasswordPermission, IsAgentAgricole]

    def get_queryset(self):
        return Report.objects.filter(generated_by=self.request.user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        file_format = (request.data.get('report_type') or request.data.get('format') or 'PDF').upper()
        title = request.data.get('title') or 'Rapport Surveillance'
        start_date_raw = request.data.get('start_date')
        end_date_raw = request.data.get('end_date')
        
        # Filtres simples (on pourrait utiliser un FilterSet)
        detections = Detection.objects.filter(agent=request.user)

        if start_date_raw:
            dt = parse_datetime(start_date_raw) or parse_date(start_date_raw)
            if dt is None:
                raise ValidationError({"start_date": "Format invalide (ISO attendu)."})
            detections = detections.filter(detected_at__gte=dt)

        if end_date_raw:
            dt = parse_datetime(end_date_raw) or parse_date(end_date_raw)
            if dt is None:
                raise ValidationError({"end_date": "Format invalide (ISO attendu)."})
            detections = detections.filter(detected_at__lte=dt)
            
        if file_format == 'PDF':
            content = generate_pdf_report(detections, title)
        elif file_format == 'CSV':
            content = generate_csv_report(detections, title)
        else:
            raise ValidationError({"report_type": "Format invalide. Utiliser 'PDF' ou 'CSV'."})
            
        report = Report.objects.create(
            title=title,
            file_format=file_format,
            generated_by=request.user
        )
        report.file_path.save(content.name, content)
        
        return Response(ReportSerializer(report, context={"request": request}).data, status=status.HTTP_201_CREATED)
