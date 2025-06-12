from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError

# Create your models here.

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Device(models.Model):
    DEVICE_TYPES = [
        ('WATER_LEVEL', 'Water Level Sensor'),
        ('FLOW_METER', 'Flow Meter'),
        ('QUALITY_SENSOR', 'Water Quality Sensor'),
    ]
    
    STATUS_CHOICES = [
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('ERROR', 'Error'),
    ]

    PROTOCOL_CHOICES = [
        ('MQTT', 'MQTT'),
        ('HTTP', 'HTTP'),
        ('MODBUS', 'Modbus'),
    ]

    device_id = models.CharField(max_length=50, unique=True)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    location = models.CharField(max_length=100)
    communication_protocol = models.CharField(max_length=20, choices=PROTOCOL_CHOICES, default='MQTT')
    polling_frequency = models.IntegerField(default=60, help_text='Polling frequency in seconds')
    min_threshold = models.FloatField(null=True, blank=True)
    max_threshold = models.FloatField(null=True, blank=True)
    water_level = models.FloatField(null=True, blank=True)
    flow_rate = models.FloatField(null=True, blank=True)
    last_reading = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.device_id} - {self.device_type}"

class Order(models.Model):
    STATUS_CHOICES = [        
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    ORDER_TYPES = [
        ('WALK_IN', 'Walk-in'),
        ('DELIVERY', 'Delivery'),
        ('SCHEDULED', 'Scheduled'),
    ]

    CONTAINER_SIZES = [
        ('GALLON', 'Gallon'),
        ('ROUND', 'Round'),
        ('SLIM', 'Slim'),
    ]  # Already matches

    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='orders')
    order_type = models.CharField(max_length=20, choices=ORDER_TYPES, default='WALK_IN')  # Already matches
    container_size = models.CharField(
        max_length=20,
        choices=CONTAINER_SIZES,
        null=False,  # Change to false since it's required in frontend
        blank=False  # Change to false since it's required in frontend
    )
    quantity = models.IntegerField()
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    status_changed_at = models.DateTimeField(default=timezone.now, help_text='When the status was last changed')
    completed_at = models.DateTimeField(null=True, blank=True, help_text='When the order was completed')
    cancelled_at = models.DateTimeField(null=True, blank=True, help_text='When the order was cancelled')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Check if this is an existing order with a status change
        if self.pk:
            old_order = Order.objects.get(pk=self.pk)
            if old_order.status != self.status:
                self.status_changed_at = timezone.now()
                # Set completed_at if status changed to COMPLETED
                if self.status == 'COMPLETED' and old_order.status != 'COMPLETED':
                    self.completed_at = timezone.now()
                # Set cancelled_at if status changed to CANCELLED
                elif self.status == 'CANCELLED' and old_order.status != 'CANCELLED':
                    self.cancelled_at = timezone.now()
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"Order #{self.id} - {self.customer.name}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class StationSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='station_settings')
    station_name = models.CharField(max_length=200)
    address = models.TextField()
    contact_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.station_name} settings"

class NotificationSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    low_inventory_alerts = models.BooleanField(default=True)
    refill_schedule_reminders = models.BooleanField(default=True)
    critical_error_alerts = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s notification settings"

class SystemPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='system_preferences')
    theme = models.CharField(max_length=10, choices=[('light', 'Light'), ('dark', 'Dark')], default='light')
    language = models.CharField(max_length=2, choices=[('en', 'English'), ('es', 'Spanish'), ('fr', 'French')], default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s system preferences"

class DeviceReading(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    water_level = models.FloatField(null=True, blank=True)
    flow_rate = models.FloatField(null=True, blank=True)
    ph_level = models.FloatField(null=True, blank=True)
    turbidity = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reading from {self.device.device_id} at {self.timestamp}"

class StationInformation(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='station_information')
    station_name = models.CharField(max_length=200, default="Cleaar Oasis Purified Water Drinking")
    address = models.TextField(default="street 2 mandaluyong city")
    contact_number = models.CharField(max_length=20, default="09192555227")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_admin = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Station Information"
        verbose_name_plural = "Station Information"
        db_table = 'core_stationinformation'

    def __str__(self):
        return f"{self.user.username}'s {self.station_name}"

    def save(self, *args, **kwargs):
        # Only allow saving if this is an admin instance or no admin instance exists
        if not self.pk and self.is_admin and StationInformation.objects.filter(is_admin=True).exists():
            raise ValidationError('There can be only one admin Station Information instance')
        return super().save(*args, **kwargs)

# Signal to create/update related models when a User is created/updated
@receiver(post_save, sender=User)
def create_user_related_models(sender, instance, created, **kwargs):
    if created:
        # Create profile first
        UserProfile.objects.create(user=instance)
        # Then create other settings
        StationSettings.objects.create(
            user=instance,
            station_name="Cleaar Oasis Purified Water Drinking",
            address="street 2 mandaluyong city",
            contact_number="09192555227"
        )
        NotificationSettings.objects.create(user=instance)
        # Also create StationInformation for the user to seed default values
        StationInformation.objects.create(
            user=instance,
            station_name="Cleaar Oasis Purified Water Drinking",
            address="street 2 mandaluyong city",
            contact_number="09192555227"
        )
        SystemPreferences.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_related_models(sender, instance, created, **kwargs):
    # Only try to save related models if this is not a new user creation
    if not created:
        try:
            if hasattr(instance, 'profile'):
                instance.profile.save()
            if hasattr(instance, 'notification_settings'):
                instance.notification_settings.save()
            if hasattr(instance, 'system_preferences'):
                instance.system_preferences.save()
        except Exception as e:
            print(f"Error saving related models: {e}")

# Signal to create initial station information
@receiver(post_save, sender=User)
def create_initial_station_info(sender, instance, created, **kwargs):
    if created and instance.is_superuser and not StationInformation.objects.filter(is_admin=True).exists():
        try:
            StationInformation.objects.create(user=instance, is_admin=True)
        except Exception as e:
            print(f"Error creating initial station info: {e}")


class Customer(BaseModel):
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)  # Optional email field
    phone = models.CharField(max_length=20)
    address = models.TextField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                condition=models.Q(email__isnull=False),
                name='unique_email_if_provided'
            )
        ]
    def __str__(self):
        return self.name


class TankRefill(BaseModel):
    tank = models.ForeignKey(Device, on_delete=models.CASCADE, limit_choices_to={'device_type': 'WATER_LEVEL'})
    refill_date = models.DateTimeField(auto_now_add=True)
    initial_level = models.FloatField(help_text='Water level before refill')
    final_level = models.FloatField(help_text='Water level after refill')
    amount_added = models.FloatField(help_text='Amount of water added in liters')
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Tank Refill Log'
        verbose_name_plural = 'Tank Refill Logs'
        ordering = ['-refill_date']
    
    def __str__(self):
        return f"Tank {self.tank.device_id} refill on {self.refill_date}"

class Delivery(BaseModel):
    delivery_date = models.DateField()
    driver_name = models.CharField(max_length=100)
    vehicle = models.CharField(max_length=100)
    route = models.CharField(max_length=200, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('SCHEDULED', 'Scheduled'),
            ('IN_PROGRESS', 'In Progress'),
            ('COMPLETED', 'Completed'),
            ('CANCELLED', 'Cancelled')
        ],
        default='SCHEDULED'
    )
    
    class Meta:
        verbose_name = 'Delivery Schedule'
        verbose_name_plural = 'Delivery Schedules'
        ordering = ['-delivery_date']
    
    def __str__(self):
        return f"Delivery on {self.delivery_date} by {self.driver_name}"
