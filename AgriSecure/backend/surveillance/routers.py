from rest_framework.routers import DefaultRouter
from django.urls import re_path

class NoFormatSuffixRouter(DefaultRouter):
    """Custom router that doesn't use format suffix patterns"""
    
    def get_urls(self):
        """
        Override get_urls to avoid format_suffix_patterns which causes converter conflicts
        """
        # Get the base URLs without calling super() to avoid format_suffix_patterns
        ret = []
        for prefix, viewset, basename in self.registry:
            lookup = self.get_lookup_regex(viewset)
            routes = self.get_routes(viewset)
            
            for route in routes:
                mapping = self.get_method_map(viewset, route.mapping)
                if not mapping:
                    continue
                    
                # Build the URL pattern using Django path syntax
                url_path = route.url.format(
                    prefix=prefix,
                    lookup=lookup,
                    trailing_slash=self.trailing_slash
                )
                
                # Create the view
                view = viewset.as_view(mapping, **route.kwargs)
                name = ''.join([basename, '-', route.name])
                
                # Use re_path for compatibility
                ret.append(re_path(url_path, view, name=name))
        
        return ret
