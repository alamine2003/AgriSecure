"""
Custom router to avoid Django REST framework format suffix converter conflicts
"""
from rest_framework.routers import DefaultRouter


class SafeFormatSuffixRouter(DefaultRouter):
    """
    Custom router that avoids format suffix patterns completely to prevent converter conflicts
    """
    
    def get_urls(self):
        """
        Override get_urls to avoid format_suffix_patterns which causes converter conflicts
        """
        # Call parent's parent to bypass format_suffix_patterns
        return super(DefaultRouter, self).get_urls()
