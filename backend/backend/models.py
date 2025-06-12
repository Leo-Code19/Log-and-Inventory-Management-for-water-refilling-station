from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Device(models.Model):
    DEVICE_TYPES = [
        ('WATER_LEVEL', 'Water Level Sensor'),
        ('FLOW_METER', 'Flow Meter'),
        ('QUALITY', 'Quality Sensor'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('MAINTENANCE', 'Maintenance'),
    ]

    name = models.CharField(max_length=100)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    water_level = models.FloatField(null=True, blank=True)
    flow_rate = models.FloatField(null=True, blank=True)
    last_reading = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_device_type_display()})"

class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    TYPE_CHOICES = [
        ('5_GALLON', '5 Gallon'),
        ('10_GALLON', '10 Gallon'),
        ('20_GALLON', '20 Gallon'),
    ]

    customer_name = models.CharField(max_length=100)
    quantity = models.IntegerField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name}"

class StationSettings(models.Model):
    station_name = models.CharField(max_length=100)
    address = models.TextField()
    contact_number = models.CharField(max_length=20)
    email = models.EmailField()
    operating_hours_start = models.TimeField()
    operating_hours_end = models.TimeField()
    pricing_five_gallon = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_ten_gallon = models.DecimalField(max_digits=10, decimal_places=2)
    pricing_twenty_gallon = models.DecimalField(max_digits=10, decimal_places=2)
    notifications_low_water_level = models.BooleanField(default=True)
    notifications_order_updates = models.BooleanField(default=True)
    notifications_device_alerts = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Station Settings"

    def __str__(self):
        return self.station_name

class DeviceReading(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='readings')
    water_level = models.FloatField(null=True, blank=True)
    flow_rate = models.FloatField(null=True, blank=True)
    quality_metrics = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.device.name} Reading at {self.timestamp}"

class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    notification_settings = models.JSONField(default=dict)
    system_preferences = models.JSONField(default=dict)

    def __str__(self):
        return f"Settings for {self.user.username}"

    @property
    def default_notification_settings(self):
        return {
            'low_inventory_alerts': True,
            'refill_schedule_reminders': True,
            'critical_error_alerts': True
        }

    @property
    def default_system_preferences(self):
        return {
            'theme': 'light',
            'language': 'en'
        }

    def save(self, *args, **kwargs):
        if not self.notification_settings:
            self.notification_settings = self.default_notification_settings
        if not self.system_preferences:
            self.system_preferences = self.default_system_preferences
        super().save(*args, **kwargs) 