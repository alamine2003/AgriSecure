import os

def get_danger_score(label):
    """
    Niveaux de dangerosité par classe :
    - ÉLEVÉ   : person (humain)
    - MOYEN   : cow (bœuf), goat (chèvre), horse
    - FAIBLE  : bird (oiseau), cat, dog
    """
    high = os.getenv('DANGER_HIGH_CLASSES', 'person').split(',')
    medium = os.getenv('DANGER_MEDIUM_CLASSES', 'cow,goat,horse,sheep').split(',')
    low = os.getenv('DANGER_LOW_CLASSES', 'bird,cat,dog').split(',')

    if label in high:
        return {'level': 'HIGH', 'color': '#E24B4A'}
    elif label in medium:
        return {'level': 'MEDIUM', 'color': '#EF9F27'}
    else:
        return {'level': 'LOW', 'color': '#639922'}
