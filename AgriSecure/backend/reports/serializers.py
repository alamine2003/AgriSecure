from rest_framework import serializers
from .models import Report

class ReportSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "file_format",
            "file_path",
            "file_url",
            "created_at",
            "generated_by",
        ]
        read_only_fields = ['generated_by', 'file_path']

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file_path:
            return None
        url = obj.file_path.url
        if request is None:
            return url
        return request.build_absolute_uri(url)
