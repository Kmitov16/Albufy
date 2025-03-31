from rest_framework import serializers
from .models import PlaylistRequest

class PlaylistRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaylistRequest
        fields = ["id", "user", "song_ids", "description", "created_at"]
        read_only_fields = ["id", "user", "created_at"]
