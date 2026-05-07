import os
from django.db import models
from surveillance.models import Detection

class Report(models.Model):
    FORMAT_CHOICES = (
        ('PDF', 'PDF'),
        ('CSV', 'CSV'),
    )
    
    title = models.CharField(max_length=255)
    file_format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    file_path = models.FileField(upload_to='reports/')
    created_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.file_format})"
