"""
Utilitaires pour la géolocalisation au Sénégal
Contient toutes les communes avec leurs coordonnées GPS
"""

import math
from typing import List, Dict, Optional, Tuple

# Base de données des communes du Sénégal avec coordonnées GPS
SENEGAL_COMMUNES = [
    # Région Dakar
    {"name": "Plateau", "region": "Dakar", "department": "Dakar", "lat": 14.6937, "lng": -17.4441},
    {"name": "Médina", "region": "Dakar", "department": "Dakar", "lat": 14.6912, "lng": -17.4523},
    {"name": "Ouakam", "region": "Dakar", "department": "Dakar", "lat": 14.7182, "lng": -17.4873},
    {"name": "Ngor", "region": "Dakar", "department": "Dakar", "lat": 14.7531, "lng": -17.5149},
    {"name": "Yoff", "region": "Dakar", "department": "Dakar", "lat": 14.7397, "lng": -17.4838},
    {"name": "Hann Bel-Air", "region": "Dakar", "department": "Dakar", "lat": 14.7344, "lng": -17.4356},
    {"name": "Sicap Liberté", "region": "Dakar", "department": "Dakar", "lat": 14.7178, "lng": -17.4506},
    {"name": "Parcelles Assainies", "region": "Dakar", "department": "Dakar", "lat": 14.7606, "lng": -17.4314},
    {"name": "Grand Yoff", "region": "Dakar", "department": "Dakar", "lat": 14.7619, "lng": -17.4497},
    {"name": "Patte d'Oie", "region": "Dakar", "department": "Dakar", "lat": 14.7381, "lng": -17.4653},

    # Région Thiès
    {"name": "Thiès Nord", "region": "Thiès", "department": "Thiès", "lat": 14.7919, "lng": -16.9244},
    {"name": "Thiès Sud", "region": "Thiès", "department": "Thiès", "lat": 14.7853, "lng": -16.9276},
    {"name": "Thiès Est", "region": "Thiès", "department": "Thiès", "lat": 14.7939, "lng": -16.9156},
    {"name": "Thiès Ouest", "region": "Thiès", "department": "Thiès", "lat": 14.7864, "lng": -16.9344},
    {"name": "Pout", "region": "Thiès", "department": "Thiès", "lat": 14.7706, "lng": -17.0597},
    {"name": "Kayar", "region": "Thiès", "department": "Thiès", "lat": 14.9186, "lng": -17.1167},
    {"name": "Mbour", "region": "Thiès", "department": "Mbour", "lat": 14.4167, "lng": -16.9639},
    {"name": "Joal-Fadiouth", "region": "Thiès", "department": "Mbour", "lat": 14.1667, "lng": -16.8333},

    # Région Diourbel
    {"name": "Diourbel", "region": "Diourbel", "department": "Diourbel", "lat": 14.6572, "lng": -16.2289},
    {"name": "Bambey", "region": "Diourbel", "department": "Bambey", "lat": 14.7011, "lng": -16.4556},
    {"name": "Mbacké", "region": "Diourbel", "department": "Mbacké", "lat": 14.7958, "lng": -15.9100},
    {"name": "Touba", "region": "Diourbel", "department": "Mbacké", "lat": 14.8500, "lng": -15.8833},

    # Région Saint-Louis
    {"name": "Saint-Louis", "region": "Saint-Louis", "department": "Saint-Louis", "lat": 16.0300, "lng": -16.4892},
    {"name": "Dagana", "region": "Saint-Louis", "department": "Dagana", "lat": 16.5167, "lng": -15.5000},
    {"name": "Podor", "region": "Saint-Louis", "department": "Podor", "lat": 16.6544, "lng": -14.9656},

    # Région Louga
    {"name": "Louga", "region": "Louga", "department": "Louga", "lat": 15.6167, "lng": -16.2333},
    {"name": "Kébémer", "region": "Louga", "department": "Kébémer", "lat": 15.3711, "lng": -16.4514},
    {"name": "Linguère", "region": "Louga", "department": "Linguère", "lat": 15.3878, "lng": -15.1236},

    # Région Fatick
    {"name": "Fatick", "region": "Fatick", "department": "Fatick", "lat": 14.3378, "lng": -16.4108},
    {"name": "Foundiougne", "region": "Fatick", "department": "Foundiougne", "lat": 14.1333, "lng": -16.4667},
    {"name": "Gossas", "region": "Fatick", "department": "Gossas", "lat": 14.4950, "lng": -16.0650},

    # Région Kaolack
    {"name": "Kaolack", "region": "Kaolack", "department": "Kaolack", "lat": 14.1500, "lng": -16.0667},
    {"name": "Guinguinéo", "region": "Kaolack", "department": "Guinguinéo", "lat": 14.2667, "lng": -15.9500},
    {"name": "Nioro du Rip", "region": "Kaolack", "department": "Nioro du Rip", "lat": 13.7500, "lng": -15.8000},

    # ... Plus de communes peuvent être ajoutées
]


def get_all_communes() -> List[Dict]:
    """
    Retourne la liste de toutes les communes avec leurs coordonnées GPS

    Returns:
        List[Dict]: Liste des communes
    """
    return SENEGAL_COMMUNES


def search_commune(query: str, limit: int = 20) -> List[Dict]:
    """
    Recherche des communes par nom, région ou département

    Args:
        query (str): Terme de recherche
        limit (int): Nombre maximum de résultats

    Returns:
        List[Dict]: Communes correspondantes
    """
    query_lower = query.lower().strip()
    results = []

    for commune in SENEGAL_COMMUNES:
        if (query_lower in commune['name'].lower() or
            query_lower in commune['region'].lower() or
            query_lower in commune['department'].lower()):
            results.append(commune)

    return results[:limit]


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calcule la distance entre deux points GPS en utilisant la formule de Haversine

    Args:
        lat1 (float): Latitude du point 1
        lng1 (float): Longitude du point 1
        lat2 (float): Latitude du point 2
        lng2 (float): Longitude du point 2

    Returns:
        float: Distance en kilomètres
    """
    R = 6371  # Rayon de la Terre en km

    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)

    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return distance


def find_nearest_commune(lat: float, lng: float, max_distance: float = 50) -> Optional[Dict]:
    """
    Trouve la commune la plus proche d'un point GPS

    Args:
        lat (float): Latitude
        lng (float): Longitude
        max_distance (float): Distance maximale en km (défaut: 50)

    Returns:
        Optional[Dict]: Commune la plus proche ou None
    """
    nearest = None
    min_distance = float('inf')

    for commune in SENEGAL_COMMUNES:
        distance = calculate_distance(lat, lng, commune['lat'], commune['lng'])

        if distance < min_distance and distance <= max_distance:
            min_distance = distance
            nearest = {
                **commune,
                'distance': round(distance, 2)
            }

    return nearest


def calculate_polygon_area(coordinates: List[Dict[str, float]]) -> float:
    """
    Calcule la surface d'un polygone en hectares
    Utilise l'algorithme de Shoelace

    Args:
        coordinates (List[Dict]): Liste de points [{lat, lng}, ...]

    Returns:
        float: Surface en hectares
    """
    if len(coordinates) < 3:
        return 0.0

    # Algorithme de Shoelace
    area = 0.0
    n = len(coordinates)

    for i in range(n):
        j = (i + 1) % n
        area += coordinates[i]['lng'] * coordinates[j]['lat']
        area -= coordinates[j]['lng'] * coordinates[i]['lat']

    area = abs(area) / 2

    # Conversion en hectares
    # 1 degré ≈ 111.32 km
    # Ajustement pour latitude moyenne du Sénégal (~14°)
    lat_factor = math.cos(math.radians(14))
    area_km2 = area * 111.32 * 111.32 * lat_factor
    area_hectares = area_km2 * 100

    return round(area_hectares, 2)


def calculate_polygon_center(coordinates: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Calcule le centre d'un polygone

    Args:
        coordinates (List[Dict]): Liste de points [{lat, lng}, ...]

    Returns:
        Dict: Centre {lat, lng}
    """
    if not coordinates:
        return {'lat': 0, 'lng': 0}

    sum_lat = sum(point['lat'] for point in coordinates)
    sum_lng = sum(point['lng'] for point in coordinates)

    return {
        'lat': round(sum_lat / len(coordinates), 7),
        'lng': round(sum_lng / len(coordinates), 7)
    }


def validate_senegal_coordinates(lat: float, lng: float) -> bool:
    """
    Vérifie si les coordonnées sont dans les limites du Sénégal

    Args:
        lat (float): Latitude
        lng (float): Longitude

    Returns:
        bool: True si dans le Sénégal
    """
    # Limites approximatives du Sénégal
    # Latitude: 12.3° N à 16.7° N
    # Longitude: -17.5° W à -11.4° W

    return (12.3 <= lat <= 16.7 and -17.5 <= lng <= -11.4)


def format_coordinates(lat: float, lng: float, precision: int = 7) -> Tuple[str, str]:
    """
    Formate les coordonnées GPS avec la précision spécifiée

    Args:
        lat (float): Latitude
        lng (float): Longitude
        precision (int): Nombre de décimales (défaut: 7)

    Returns:
        Tuple[str, str]: (latitude_str, longitude_str)
    """
    return (f"{lat:.{precision}f}", f"{lng:.{precision}f}")


# Exemple d'utilisation
if __name__ == "__main__":
    # Test recherche
    results = search_commune("Thiès")
    print(f"Résultats pour 'Thiès': {len(results)} commune(s)")
    for commune in results:
        print(f"  - {commune['name']}, {commune['region']} ({commune['lat']}, {commune['lng']})")

    # Test commune la plus proche
    nearest = find_nearest_commune(14.80, -16.93)
    if nearest:
        print(f"\nCommune la plus proche de (14.80, -16.93):")
        print(f"  {nearest['name']}, {nearest['region']} - {nearest['distance']} km")

    # Test calcul surface
    test_polygon = [
        {"lat": 14.79, "lng": -16.92},
        {"lat": 14.80, "lng": -16.92},
        {"lat": 14.80, "lng": -16.91},
        {"lat": 14.79, "lng": -16.91}
    ]
    area = calculate_polygon_area(test_polygon)
    print(f"\nSurface du polygone test: {area} hectares")

    # Test centre
    center = calculate_polygon_center(test_polygon)
    print(f"Centre du polygone: {center['lat']}, {center['lng']}")
