import io
import json
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db.models import Count, Avg, Q
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

from surveillance.models import Detection, Alert, Camera
from users.models import CustomUser


class PDFReportGenerator:
    """Générateur de rapports PDF pour la plateforme de surveillance"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            textColor=colors.darkblue
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12
        )
        self.normal_style = ParagraphStyle(
            'CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6
        )

    def generate_detection_report(self, user, start_date, end_date):
        """Générer un rapport de détections pour une période donnée"""
        # Filtrer les détections
        detections = Detection.objects.filter(
            agent=user,
            detected_at__range=[start_date, end_date]
        ).select_related('camera').order_by('-detected_at')
        
        # Créer le buffer PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Titre
        story.append(Paragraph("Rapport de Détections", self.title_style))
        story.append(Spacer(1, 12))
        
        # Informations générales
        story.append(Paragraph("Informations Générales", self.heading_style))
        
        info_data = [
            ['Période', f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}"],
            ['Agent', user.get_full_name() or user.email],
            ['Email', user.email],
            ['Total des détections', str(detections.count())]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        # Statistiques par type de détection
        story.append(Paragraph("Statistiques par Type", self.heading_style))
        
        type_stats = detections.values('label').annotate(
            count=Count('id'),
            avg_confidence=Avg('confidence')
        ).order_by('-count')
        
        if type_stats.exists():
            stats_data = [['Type', 'Nombre', 'Confiance Moyenne']]
            for stat in type_stats:
                stats_data.append([
                    stat['label'],
                    str(stat['count']),
                    f"{stat['avg_confidence']:.2f}%"
                ])
            
            stats_table = Table(stats_data, colWidths=[2*inch, 1*inch, 1.5*inch])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(stats_table)
            story.append(Spacer(1, 20))
        
        # Détail des détections
        story.append(Paragraph("Détail des Détections", self.heading_style))
        
        if detections.exists():
            detail_data = [['Date', 'Caméra', 'Type', 'Confiance', 'Niveau', 'Alerte']]
            
            for detection in detections[:50]:  # Limiter à 50 détections
                detail_data.append([
                    detection.detected_at.strftime('%d/%m/%Y %H:%M'),
                    detection.camera.name,
                    detection.label,
                    f"{detection.confidence:.1f}%",
                    detection.danger_level,
                    'Oui' if detection.is_alert else 'Non'
                ])
            
            detail_table = Table(detail_data, colWidths=[1.2*inch, 1.2*inch, 1*inch, 0.8*inch, 0.8*inch, 0.8*inch])
            detail_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(detail_table)
            
            if detections.count() > 50:
                story.append(Spacer(1, 12))
                story.append(Paragraph(
                    f"Note: Seules les 50 premières détections sont affichées sur {detections.count()} au total.",
                    self.normal_style
                ))
        else:
            story.append(Paragraph("Aucune détection trouvée pour cette période.", self.normal_style))
        
        # Construire le PDF
        doc.build(story)
        
        # Préparer la réponse
        buffer.seek(0)
        filename = f"rapport_detections_{user.email}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def generate_alert_report(self, user, start_date, end_date):
        """Générer un rapport d'alertes pour une période donnée"""
        # Filtrer les alertes
        alerts = Alert.objects.filter(
            detection__agent=user,
            created_at__range=[start_date, end_date]
        ).select_related('detection', 'detection__camera').order_by('-created_at')
        
        # Créer le buffer PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Titre
        story.append(Paragraph("Rapport d'Alertes", self.title_style))
        story.append(Spacer(1, 12))
        
        # Informations générales
        story.append(Paragraph("Informations Générales", self.heading_style))
        
        info_data = [
            ['Période', f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}"],
            ['Agent', user.get_full_name() or user.email],
            ['Email', user.email],
            ['Total des alertes', str(alerts.count())]
        ]
        
        info_table = Table(info_data, colWidths=[2*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        # Détail des alertes
        story.append(Paragraph("Détail des Alertes", self.heading_style))
        
        if alerts.exists():
            alert_data = [['Date', 'Caméra', 'Type', 'Message', 'Statut']]
            
            for alert in alerts:
                alert_data.append([
                    alert.created_at.strftime('%d/%m/%Y %H:%M'),
                    alert.detection.camera.name,
                    alert.detection.label,
                    alert.message[:50] + '...' if len(alert.message) > 50 else alert.message,
                    'Active' if not alert.resolved_at else 'Résolue'
                ])
            
            alert_table = Table(alert_data, colWidths=[1.2*inch, 1.2*inch, 1*inch, 2*inch, 1*inch])
            alert_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(alert_table)
        else:
            story.append(Paragraph("Aucune alerte trouvée pour cette période.", self.normal_style))
        
        # Construire le PDF
        doc.build(story)
        
        # Préparer la réponse
        buffer.seek(0)
        filename = f"rapport_alertes_{user.email}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def generate_summary_report(self, user, start_date, end_date):
        """Générer un rapport récapitulatif complet"""
        # Récupérer les données
        detections = Detection.objects.filter(
            agent=user,
            detected_at__range=[start_date, end_date]
        ).select_related('camera')
        
        alerts = Alert.objects.filter(
            detection__agent=user,
            created_at__range=[start_date, end_date]
        ).select_related('detection', 'detection__camera')
        
        # Créer le buffer PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Titre
        story.append(Paragraph("Rapport Récapitulatif de Surveillance", self.title_style))
        story.append(Spacer(1, 12))
        
        # Résumé
        story.append(Paragraph("Résumé Général", self.heading_style))
        
        summary_data = [
            ['Période', f"{start_date.strftime('%d/%m/%Y')} - {end_date.strftime('%d/%m/%Y')}"],
            ['Agent', user.get_full_name() or user.email],
            ['Email', user.email],
            ['Total caméras', str(Camera.objects.filter(agent=user).count())],
            ['Total détections', str(detections.count())],
            ['Total alertes', str(alerts.count())],
            ['Taux d\'alertes', f"{(alerts.count() / detections.count() * 100):.1f}%" if detections.count() > 0 else "0%"]
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 3*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Statistiques par caméra
        story.append(Paragraph("Statistiques par Caméra", self.heading_style))
        
        camera_stats = detections.values('camera__name').annotate(
            count=Count('id'),
            alerts_count=Count('alert')
        ).order_by('-count')
        
        if camera_stats.exists():
            camera_data = [['Caméra', 'Détections', 'Alertes']]
            
            for stat in camera_stats:
                camera_data.append([
                    stat['camera__name'],
                    str(stat['count']),
                    str(stat['alerts_count'])
                ])
            
            camera_table = Table(camera_data, colWidths=[2*inch, 1*inch, 1*inch])
            camera_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(camera_table)
        
        # Construire le PDF
        doc.build(story)
        
        # Préparer la réponse
        buffer.seek(0)
        filename = f"rapport_summary_{user.email}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
