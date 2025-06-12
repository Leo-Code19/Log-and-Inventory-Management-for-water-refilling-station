from rest_framework import serializers
from .models import Device, Order, StationSettings, DeviceReading
from django.contrib.auth.models import User
from .models import UserSettings

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'

class StationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationSettings
        fields = '__all__'

class DeviceReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceReading
        fields = '__all__'

class DashboardStatsSerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    active_devices = serializers.IntegerField()
    water_level = serializers.FloatField()

class RecentOrdersSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.DateTimeField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class BaseSerializer(serializers.Serializer):
    pass

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['notification_settings', 'system_preferences']

class UserSettingsUpdateSerializer(serializers.Serializer):
    notification_settings = serializers.JSONField(required=False)
    system_preferences = serializers.JSONField(required=False)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        return data