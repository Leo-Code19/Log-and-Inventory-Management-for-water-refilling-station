from rest_framework import serializers
from ..models import StationSettings, SystemPreferences, StationInformation
from .notification_serializers import NotificationSettingsSerializer

class StationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationSettings
        fields = ('id', 'station_name', 'address', 'contact_number')

class SystemPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemPreferences
        fields = ('id', 'theme', 'language')

class StationInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationInformation
        fields = ('id', 'station_name', 'address', 'contact_number', 'is_admin')
        read_only_fields = ('is_admin',)
