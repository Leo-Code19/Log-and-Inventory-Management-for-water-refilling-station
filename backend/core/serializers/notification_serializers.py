from rest_framework import serializers
from ..models import NotificationSettings

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = ('id', 'low_inventory_alerts', 'refill_schedule_reminders', 'critical_error_alerts')
