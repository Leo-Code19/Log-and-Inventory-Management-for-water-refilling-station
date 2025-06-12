from django.contrib import admin
from django.db import OperationalError
from .models import (
    Device, Order, StationSettings, DeviceReading, 
    UserProfile, NotificationSettings, SystemPreferences,
    StationInformation, Customer, Delivery
)

@admin.register(StationInformation)
class StationInformationAdmin(admin.ModelAdmin):
    list_display = ('user', 'station_name', 'address', 'contact_number', 'updated_at')
    search_fields = ('user__username', 'station_name', 'address')
    readonly_fields = ('created_at', 'updated_at')
    
    def has_add_permission(self, request):
        try:
            # Only allow adding if no instance exists
            if self.model.objects.exists():
                return False
            return super().has_add_permission(request)
        except OperationalError:
            # If table doesn't exist yet, allow adding
            return True
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of the station information
        return False

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('device_id', 'device_type', 'status', 'location', 'last_reading')
    list_filter = ('device_type', 'status', 'location')
    search_fields = ('device_id', 'location')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-last_reading',)

@admin.register(DeviceReading)
class DeviceReadingAdmin(admin.ModelAdmin):
    list_display = ('device', 'water_level', 'flow_rate', 'timestamp')
    list_filter = ('device', 'timestamp')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)

from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'created_at')
    search_fields = ('name', 'email', 'phone')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('delivery_date', 'driver_name', 'vehicle', 'status', 'created_at')
    list_filter = ('status', 'delivery_date')
    search_fields = ('driver_name', 'vehicle', 'route')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-delivery_date',)
    ordering = ('-created_at',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'container_size', 'quantity', 'price_per_unit', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'container_size', 'created_at')
    search_fields = ('id',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

# Register remaining models to admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'first_name', 'last_name', 'email', 'created_at')
    search_fields = ('user__username', 'first_name', 'last_name', 'email')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(StationSettings)
class StationSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'station_name', 'address', 'contact_number', 'updated_at')
    search_fields = ('user__username', 'station_name', 'address')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'low_inventory_alerts', 'refill_schedule_reminders', 'critical_error_alerts', 'updated_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(SystemPreferences)
class SystemPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'language', 'updated_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at', 'updated_at')
