from django.db import models
from django.contrib.auth.models import User

class PlaylistRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    song_ids = models.JSONField()  # Store list of 5 Spotify song IDs
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Playlist request by {self.user.username}"

