# Generated by Django 5.1.7 on 2025-03-31 20:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('requests_app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='playlistrequest',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='playlistrequest',
            name='song_ids',
            field=models.JSONField(blank=True),
        ),
    ]
