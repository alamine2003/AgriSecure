from datetime import datetime, timedelta
from django.db import models
from django.http import JsonResponse, HttpResponse
from django.utils.dateparse import parse_date
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend

from .pdf_generator import PDFReportGenerator
from users.permissions import (
    IsAgentAgricole, IsMaintenancier,
    MustChangePasswordPermission
)


class PDFReportGeneratorViewSet(viewsets.ViewSet):
    """ViewSet pour la génération de rapports PDF"""
    
    def get_permissions(self):
        """Tous les utilisateurs authentifiés peuvent générer leurs rapports"""
        from rest_framework.permissions import IsAuthenticated
        return [IsAuthenticated(), MustChangePasswordPermission()]

    @action(detail=False, methods=['POST'])
    def generate_detection_report(self, request):
        """Générer un rapport de détections"""
        try:
            start_date_str = request.data.get('start_date')
            end_date_str = request.data.get('end_date')
            
            if not start_date_str or not end_date_str:
                return Response(
                    {'error': 'Les dates de début et de fin sont requises'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if not start_date or not end_date:
                return Response(
                    {'error': 'Format de date invalide. Utilisez YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if end_date < start_date:
                return Response(
                    {'error': 'La date de fin doit être postérieure à la date de début'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Limiter la période à 90 jours
            days_diff = (end_date - start_date).days
            if days_diff > 90:
                return Response(
                    {'error': 'La période ne peut pas dépasser 90 jours'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Générer le PDF
            generator = PDFReportGenerator()
            return generator.generate_detection_report(
                user=request.user,
                start_date=start_date,
                end_date=end_date
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du rapport: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['POST'])
    def generate_alert_report(self, request):
        """Générer un rapport d'alertes"""
        try:
            start_date_str = request.data.get('start_date')
            end_date_str = request.data.get('end_date')
            
            if not start_date_str or not end_date_str:
                return Response(
                    {'error': 'Les dates de début et de fin sont requises'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if not start_date or not end_date:
                return Response(
                    {'error': 'Format de date invalide. Utilisez YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if end_date < start_date:
                return Response(
                    {'error': 'La date de fin doit être postérieure à la date de début'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Limiter la période à 90 jours
            days_diff = (end_date - start_date).days
            if days_diff > 90:
                return Response(
                    {'error': 'La période ne peut pas dépasser 90 jours'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Générer le PDF
            generator = PDFReportGenerator()
            return generator.generate_alert_report(
                user=request.user,
                start_date=start_date,
                end_date=end_date
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du rapport: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['POST'])
    def generate_summary_report(self, request):
        """Générer un rapport récapitulatif"""
        try:
            start_date_str = request.data.get('start_date')
            end_date_str = request.data.get('end_date')
            
            if not start_date_str or not end_date_str:
                return Response(
                    {'error': 'Les dates de début et de fin sont requises'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            start_date = parse_date(start_date_str)
            end_date = parse_date(end_date_str)
            
            if not start_date or not end_date:
                return Response(
                    {'error': 'Format de date invalide. Utilisez YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if end_date < start_date:
                return Response(
                    {'error': 'La date de fin doit être postérieure à la date de début'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Limiter la période à 90 jours
            days_diff = (end_date - start_date).days
            if days_diff > 90:
                return Response(
                    {'error': 'La période ne peut pas dépasser 90 jours'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Générer le PDF
            generator = PDFReportGenerator()
            return generator.generate_summary_report(
                user=request.user,
                start_date=start_date,
                end_date=end_date
            )
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du rapport: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['GET'])
    def report_dates(self, request):
        """Récupérer les dates disponibles pour les rapports"""
        from surveillance.models import Detection
        
        # Récupérer la date de première et dernière détection
        dates = Detection.objects.filter(
            agent=request.user
        ).aggregate(
            first_date=models.Min('detected_at'),
            last_date=models.Max('detected_at')
        )
        
        # Dates par défaut (30 derniers jours)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        response_data = {
            'default_start_date': start_date.strftime('%Y-%m-%d'),
            'default_end_date': end_date.strftime('%Y-%m-%d'),
            'earliest_date': dates['first_date'].strftime('%Y-%m-%d') if dates['first_date'] else None,
            'latest_date': dates['last_date'].strftime('%Y-%m-%d') if dates['last_date'] else None,
            'max_period_days': 90
        }
        
        return Response(response_data)

    @action(detail=False, methods=['GET'])
    def report_stats(self, request):
        """Récupérer les statistiques pour les rapports"""
        from surveillance.models import Detection, Alert
        from django.db.models import Count
        
        # Période par défaut (30 derniers jours)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Statistiques de l'utilisateur
        detection_stats = Detection.objects.filter(
            agent=request.user,
            detected_at__range=[start_date, end_date]
        ).aggregate(
            total_detections=Count('id'),
            high_detections=Count('id', filter=models.Q(danger_level='HIGH')),
            medium_detections=Count('id', filter=models.Q(danger_level='MEDIUM')),
            low_detections=Count('id', filter=models.Q(danger_level='LOW'))
        )
        
        alert_stats = Alert.objects.filter(
            detection__agent=request.user,
            created_at__range=[start_date, end_date]
        ).aggregate(
            total_alerts=Count('id'),
            resolved_alerts=Count('id', filter=models.Q(resolved_at__isnull=False))
        )
        
        response_data = {
            'period': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d')
            },
            'detections': {
                'total': detection_stats['total_detections'],
                'high': detection_stats['high_detections'],
                'medium': detection_stats['medium_detections'],
                'low': detection_stats['low_detections']
            },
            'alerts': {
                'total': alert_stats['total_alerts'],
                'resolved': alert_stats['resolved_alerts'],
                'pending': alert_stats['total_alerts'] - alert_stats['resolved_alerts']
            }
        }
        
        return Response(response_data)
