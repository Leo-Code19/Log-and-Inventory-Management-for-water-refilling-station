from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (Device, Order, StationSettings, DeviceReading, UserProfile, NotificationSettings, SystemPreferences, StationInformation, Customer, Delivery, TankRefill)

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'device_id', 'device_type', 'status', 'location', 
                 'communication_protocol', 'polling_frequency',
                 'min_threshold', 'max_threshold', 'water_level',
                 'flow_rate', 'last_reading', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'last_reading']

    def validate_device_id(self, value):
        if not value:
            raise serializers.ValidationError("Device ID is required")
        return value

    def validate(self, data):
        if self.instance is None:  # Create operation
            if not data.get('device_type'):
                raise serializers.ValidationError({"device_type": "Device type is required"})
            if not data.get('location'):
                raise serializers.ValidationError({"location": "Location is required"})
        return data

class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'order_type', 'container_size',
                 'quantity', 'price_per_unit', 'total_amount', 'status', 'status_changed_at',
                 'completed_at', 'cancelled_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'status_changed_at', 'completed_at', 'cancelled_at']

    def validate(self, data):
        # Calculate total amount
        quantity = data.get('quantity', 0)
        price_per_unit = data.get('price_per_unit', 0)
        data['total_amount'] = quantity * price_per_unit
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['first_name', 'last_name', 'email', 'profile_picture']

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None

class StationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationSettings
        fields = ['station_name', 'address', 'contact_number']

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = ['low_inventory_alerts', 'refill_schedule_reminders', 'critical_error_alerts']

class SystemPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemPreferences
        fields = ['theme', 'language']

class UserSettingsSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()
    notification_settings = NotificationSettingsSerializer()
    system_preferences = SystemPreferencesSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile', 'notification_settings', 'system_preferences']
        read_only_fields = ['id']

    def update(self, instance, validated_data):
        # Update username if provided
        if 'username' in validated_data:
            instance.username = validated_data['username']

        # Update UserProfile
        profile_data = validated_data.pop('profile', {})
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

            # Update User model fields
            instance.first_name = profile_data.get('first_name', instance.first_name)
            instance.last_name = profile_data.get('last_name', instance.last_name)
            instance.email = profile_data.get('email', instance.email)
            instance.save()

        # Update NotificationSettings
        notification_data = validated_data.pop('notification_settings', {})
        if notification_data:
            notification = instance.notification_settings
            for attr, value in notification_data.items():
                setattr(notification, attr, value)
            notification.save()

        # Update SystemPreferences
        preferences_data = validated_data.pop('system_preferences', {})
        if preferences_data:
            preferences = instance.system_preferences
            for attr, value in preferences_data.items():
                setattr(preferences, attr, value)
            preferences.save()

        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("The new passwords don't match.")
        return data

class DeviceReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceReading
        fields = '__all__'

class DashboardStatsSerializer(serializers.Serializer):
    # Order counts by status
    pending_orders = serializers.IntegerField()
    processing_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    cancelled_orders = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    
    # Revenue statistics
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    today_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_week_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_month_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_year_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    all_time_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    # Order counts by time period
    today_orders = serializers.IntegerField()
    this_week_orders = serializers.IntegerField()
    this_month_orders = serializers.IntegerField()
    this_year_orders = serializers.IntegerField()
    all_time_orders = serializers.IntegerField()
    
    # Device stats
    active_devices = serializers.IntegerField()
    water_level = serializers.FloatField()
    
    # Time range info
    time_range = serializers.CharField()

class RecentOrdersSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.DateTimeField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

class BaseSerializer(serializers.Serializer):
    pass

class StationInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationInformation
        fields = ['station_name', 'address', 'contact_number']
        read_only = True  # Make all fields read-only

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class TankRefillSerializer(serializers.ModelSerializer):
    tank_name = serializers.CharField(source='tank.device_id', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)
    
    class Meta:
        model = TankRefill
        fields = ['id', 'tank', 'tank_name', 'refill_date', 'initial_level', 'final_level', 
                 'amount_added', 'performed_by', 'performed_by_name', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'refill_date']

class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = ['id', 'delivery_date', 'driver_name', 'vehicle', 'route', 'notes', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def validate(self, data):
        # Validate required fields
        if not data.get('delivery_date'):
            raise serializers.ValidationError({"delivery_date": "Delivery date is required"})
        if not data.get('driver_name'):
            raise serializers.ValidationError({"driver_name": "Driver name is required"})
        if not data.get('vehicle'):
            raise serializers.ValidationError({"vehicle": "Vehicle is required"})
        return data