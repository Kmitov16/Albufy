from rest_framework import serializers
from .models import PlaylistRequest

class PlaylistRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaylistRequest
        fields = '__all__'
