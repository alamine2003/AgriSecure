"""
Module de filtrage des détections.
Responsabilité unique : Sélection des détections à sauvegarder
"""
from typing import List, Dict, Any


def filter_critical_detections(detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Filtre les détections pour ne garder que les niveaux critiques.

    Args:
        detections: Liste complète des détections

    Returns:
        Liste des détections HIGH et MEDIUM uniquement
    """
    return [
        d for d in detections
        if d.get('danger_level') in ['HIGH', 'MEDIUM']
    ]


def should_capture_frame(detection: Dict[str, Any]) -> bool:
    """
    Détermine si une détection nécessite la capture de frame.

    Args:
        detection: Dictionnaire de détection

    Returns:
        True si capture nécessaire (niveau HIGH), False sinon
    """
    return detection.get('danger_level') == 'HIGH'
