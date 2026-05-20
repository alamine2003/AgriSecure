import csv
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.core.files.base import ContentFile
from .models import Report

def generate_pdf_report(detections, title):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, f"Rapport de Surveillance: {title}")
    
    y = 700
    for det in detections:
        line = f"{det.detected_at.strftime('%Y-%m-%d %H:%M')} - {det.label} ({det.danger_level})"
        p.drawString(100, y, line)
        y -= 20
        if y < 50:
            p.showPage()
            y = 750
            
    p.save()
    buffer.seek(0)
    return ContentFile(buffer.read(), name=f"{title}.pdf")

def generate_csv_report(detections, title):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Date', 'Label', 'Confiance', 'Danger', 'Camera'])
    
    for det in detections:
        writer.writerow([
            det.detected_at.strftime('%Y-%m-%d %H:%M:%S'),
            det.label,
            det.confidence,
            det.danger_level,
            det.camera.name
        ])
        
    return ContentFile(output.getvalue().encode('utf-8'), name=f"{title}.csv")
