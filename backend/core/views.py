from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, TruncYear
# Add at the top of the file with other imports
import logging

# Add after imports
logger = logging.getLogger(__name__)
from .models import (Device, Order, StationSettings, DeviceReading, UserProfile, NotificationSettings, SystemPreferences, StationInformation, Delivery, Customer, TankRefill)
from .serializers import (
    DeviceSerializer,
    OrderSerializer,
    StationSettingsSerializer,
    DeviceReadingSerializer,
    DashboardStatsSerializer,
    RecentOrdersSerializer,
    UserSettingsSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer,
    NotificationSettingsSerializer,
    SystemPreferencesSerializer,
    StationInformationSerializer,
    DeliverySerializer,
    TankRefillSerializer
)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'  # Explicitly set the lookup field to 'id'

    def get_object(self):
        # Get the lookup URL kwarg
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        # Get the filter kwargs from the URL
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        # Get the object
        obj = get_object_or_404(self.get_queryset(), **filter_kwargs)
        # Check object permissions
        self.check_object_permissions(self.request, obj)
        return obj

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]


class TankRefillViewSet(viewsets.ModelViewSet):
    queryset = TankRefill.objects.all()
    serializer_class = TankRefillSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(performed_by=self.request.user)

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Order by delivery date with most recent first
        return Delivery.objects.all().order_by('-delivery_date')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class StationSettingsViewSet(viewsets.ModelViewSet):
    queryset = StationSettings.objects.all()
    serializer_class = StationSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StationSettings.objects.all()[:1]

class DeviceReadingViewSet(viewsets.ModelViewSet):
    queryset = DeviceReading.objects.all()
    serializer_class = DeviceReadingSerializer
    permission_classes = [IsAuthenticated]

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Device.objects.all().order_by('-created_at')
        
    @action(detail=True, methods=['post'])
    def update_firmware(self, request, pk=None):
        try:
            device = self.get_object()
            # Simulate firmware update process
            device.status = 'MAINTENANCE'
            device.save()
            
            # In a real-world scenario, you would trigger an actual firmware update process here
            # For demo purposes, we'll just update the status and return success
            
            return Response({
                'message': f'Firmware update initiated for device {device.device_id}',
                'status': 'success'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error updating firmware: {str(e)}")
            return Response({
                'message': f'Failed to update firmware: {str(e)}',
                'status': 'error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def unlink_device(self, request, pk=None):
        try:
            device = self.get_object()
            # Simulate unlinking process
            device.status = 'OFFLINE'
            device.save()
            
            # In a real system, you might remove associations with other systems or users
            
            return Response({
                'message': f'Device {device.device_id} has been unlinked',
                'status': 'success'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error unlinking device: {str(e)}")
            return Response({
                'message': f'Failed to unlink device: {str(e)}',
                'status': 'error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def factory_reset(self, request, pk=None):
        try:
            device = self.get_object()
            
            # Reset device to factory settings
            device.water_level = None
            device.flow_rate = None
            device.min_threshold = None
            device.max_threshold = None
            device.status = 'ONLINE'
            device.save()
            
            # Delete all readings associated with this device
            DeviceReading.objects.filter(device=device).delete()
            
            return Response({
                'message': f'Factory reset completed for device {device.device_id}',
                'status': 'success'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error performing factory reset: {str(e)}")
            return Response({
                'message': f'Failed to perform factory reset: {str(e)}',
                'status': 'error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    time_range = request.query_params.get('timeRange', 'week')
    
    # Get time periods for different ranges
    today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)
    start_of_year = today.replace(month=1, day=1)
    
    # Set the main time range for the dashboard
    if time_range == 'day':
        start_date = today
    elif time_range == 'week':
        start_date = start_of_week
    elif time_range == 'month':
        start_date = start_of_month
    elif time_range == 'year':
        start_date = start_of_year
    else:  # all time
        start_date = None
    
    # Base query for orders
    orders_query = Order.objects.all()
    if start_date:
        orders_query = orders_query.filter(created_at__gte=start_date)
    
    # Get counts by status for the selected time range
    pending_count = orders_query.filter(status='PENDING').count()
    processing_count = orders_query.filter(status='PROCESSING').count()
    completed_count = orders_query.filter(status='COMPLETED').count()
    cancelled_count = orders_query.filter(status='CANCELLED').count()
    total_orders = orders_query.count()
    
    # Get total revenue from completed orders
    completed_orders_query = orders_query.filter(status='COMPLETED')
    total_revenue = completed_orders_query.aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Get time-based revenue statistics for completed orders
    today_revenue = Order.objects.filter(status='COMPLETED', completed_at__gte=today).aggregate(total=Sum('total_amount'))['total'] or 0
    this_week_revenue = Order.objects.filter(status='COMPLETED', completed_at__gte=start_of_week).aggregate(total=Sum('total_amount'))['total'] or 0
    this_month_revenue = Order.objects.filter(status='COMPLETED', completed_at__gte=start_of_month).aggregate(total=Sum('total_amount'))['total'] or 0
    this_year_revenue = Order.objects.filter(status='COMPLETED', completed_at__gte=start_of_year).aggregate(total=Sum('total_amount'))['total'] or 0
    all_time_revenue = Order.objects.filter(status='COMPLETED').aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Get time-based order counts
    today_orders = Order.objects.filter(created_at__gte=today).count()
    this_week_orders = Order.objects.filter(created_at__gte=start_of_week).count()
    this_month_orders = Order.objects.filter(created_at__gte=start_of_month).count()
    this_year_orders = Order.objects.filter(created_at__gte=start_of_year).count()
    all_time_orders = Order.objects.count()
    
    # Get device stats
    active_devices = Device.objects.filter(status='ACTIVE').count()
    
    # Get average water level from active water level sensors
    water_level_sensors = Device.objects.filter(
        device_type='WATER_LEVEL',
        status='ACTIVE'
    )
    water_level = water_level_sensors.aggregate(
        avg_level=Avg('water_level')
    )['avg_level'] or 0

    data = {
        # Order counts by status
        'pending_orders': pending_count,
        'processing_orders': processing_count,
        'completed_orders': completed_count,
        'cancelled_orders': cancelled_count,
        'total_orders': total_orders,
        
        # Revenue statistics
        'total_revenue': total_revenue,
        'today_revenue': today_revenue,
        'this_week_revenue': this_week_revenue,
        'this_month_revenue': this_month_revenue,
        'this_year_revenue': this_year_revenue,
        'all_time_revenue': all_time_revenue,
        
        # Order counts by time period
        'today_orders': today_orders,
        'this_week_orders': this_week_orders,
        'this_month_orders': this_month_orders,
        'this_year_orders': this_year_orders,
        'all_time_orders': all_time_orders,
        
        # Device stats
        'active_devices': active_devices,
        'water_level': water_level,
        
        # Time range info
        'time_range': time_range,
    }
    
    serializer = DashboardStatsSerializer(data)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_orders(request):
    time_range = request.query_params.get('timeRange', 'week')
    
    if time_range == 'week':
        start_date = timezone.now() - timedelta(days=7)
    elif time_range == 'month':
        start_date = timezone.now() - timedelta(days=30)
    else:  # year
        start_date = timezone.now() - timedelta(days=365)

    orders = Order.objects.filter(
        created_at__gte=start_date
    ).order_by('-created_at')[:10]

    serializer = RecentOrdersSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_report(request):
    time_range = request.query_params.get('timeRange', 'week')
    
    if time_range == 'week':
        start_date = timezone.now() - timedelta(days=7)
    elif time_range == 'month':
        start_date = timezone.now() - timedelta(days=30)
    else:  # year
        start_date = timezone.now() - timedelta(days=365)

    sales_data = Order.objects.filter(
        created_at__gte=start_date,
        status='COMPLETED'
    ).values('created_at__date').annotate(
        amount=Sum('total_amount')
    ).order_by('created_at__date')

    return Response(sales_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_report(request):
    time_range = request.query_params.get('timeRange', 'week')
    
    if time_range == 'week':
        start_date = timezone.now() - timedelta(days=7)
    elif time_range == 'month':
        start_date = timezone.now() - timedelta(days=30)
    else:  # year
        start_date = timezone.now() - timedelta(days=365)

    inventory_data = DeviceReading.objects.filter(
        timestamp__gte=start_date,
        device__device_type='WATER_LEVEL'
    ).values('timestamp__date').annotate(
        level=Avg('water_level')
    ).order_by('timestamp__date')

    return Response(inventory_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_stats(request):
    time_range = request.query_params.get('timeRange', 'week')
    
    if time_range == 'week':
        start_date = timezone.now() - timedelta(days=7)
    elif time_range == 'month':
        start_date = timezone.now() - timedelta(days=30)
    else:  # year
        start_date = timezone.now() - timedelta(days=365)

    stats = Order.objects.filter(
        created_at__gte=start_date
    ).aggregate(
        total=Count('id'),
        completed=Count('id', filter=Q(status='COMPLETED')),
        pending=Count('id', filter=Q(status='PENDING')),
        cancelled=Count('id', filter=Q(status='CANCELLED'))
    )

    return Response(stats)

@api_view(['GET'])
@permission_classes([AllowAny])
def index(request):
    return Response({
        'message': 'Welcome to Clear Oasis API',
        'version': '1.0.0'
    })

class SettingsViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSettingsSerializer
    http_method_names = ['get', 'put', 'patch', 'post', 'delete']

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)

    def get_object(self):
        try:
            user = self.request.user
            logger.info(f"Getting settings for user: {user.username}")
            
            # Get user data directly from Django admin user database
            user = User.objects.select_related(
                'profile',
                'notification_settings',
                'system_preferences'
            ).get(id=user.id)
            
            # Create related models if they don't exist
            if not hasattr(user, 'profile'):
                logger.info("Creating UserProfile")
                UserProfile.objects.create(user=user)
            
            if not hasattr(user, 'notification_settings'):
                logger.info("Creating NotificationSettings")
                NotificationSettings.objects.create(user=user)
            
            if not hasattr(user, 'system_preferences'):
                logger.info("Creating SystemPreferences")
                SystemPreferences.objects.create(user=user)
            
            # Refresh user from database to get related models
            user.refresh_from_db()
            return user
        except Exception as e:
            logger.error(f"Error in get_object: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}

            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating settings: {str(e)}")
            return Response(
                {'error': f'An error occurred while updating settings: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_object(self):
        try:
            user = self.request.user
            logger.info(f"Getting settings for user: {user.username}")
            
            # Get user data directly from Django admin user database
            user = User.objects.select_related(
                'profile',
                'notification_settings',
                'system_preferences'
            ).get(id=user.id)
            
            # Create related models if they don't exist
            if not hasattr(user, 'profile'):
                logger.info("Creating UserProfile")
                UserProfile.objects.create(user=user)
            
            if not hasattr(user, 'notification_settings'):
                logger.info("Creating NotificationSettings")
                NotificationSettings.objects.create(user=user)
            
            if not hasattr(user, 'system_preferences'):
                logger.info("Creating SystemPreferences")
                SystemPreferences.objects.create(user=user)
            
            # Refresh user from database to get related models
            user.refresh_from_db()
            return user
        except Exception as e:
            logger.error(f"Error in get_object: {str(e)}")
            raise

    @action(detail=False, methods=['get', 'put'])
    def profile(self, request):
        try:
            user = request.user
            if not hasattr(user, 'profile'):
                UserProfile.objects.create(user=user)
            
            if request.method == 'GET':
                serializer = UserProfileSerializer(user.profile)
                return Response(serializer.data)
            
            serializer = UserProfileSerializer(user.profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in profile action: {str(e)}")
            return Response(
                {'error': f'An error occurred while processing profile: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def station(self, request):
        try:
            logger.info("Getting station settings")
            user = request.user
            if not hasattr(user, 'station_settings'):
                logger.info("Creating StationSettings")
                StationSettings.objects.create(
                    user=user,
                    station_name="Cleaar Oasis Purified Water Drinking",
                    address="street 2 mandaluyong city",
                    contact_number="09192555227"
                )
            
            serializer = StationSettingsSerializer(user.station_settings)
            logger.info("Station settings retrieved successfully")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in station action: {str(e)}")
            return Response(
                {'error': f'An error occurred while processing station settings: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get', 'put'])
    def notifications(self, request):
        try:
            user = request.user
            if not hasattr(user, 'notification_settings'):
                NotificationSettings.objects.create(user=user)
                user.refresh_from_db()
            
            if request.method == 'PUT':
                logger.info(f"Updating notification settings: {request.data}")
                serializer = NotificationSettingsSerializer(user.notification_settings, data=request.data)
                if serializer.is_valid():
                    serializer.save()
                    logger.info(f"Updated notification settings: {serializer.data}")
                    return Response(serializer.data)
                else:
                    logger.error(f"Invalid notification settings data: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:  # GET
                logger.info("Getting notification settings")
                serializer = NotificationSettingsSerializer(user.notification_settings)
                return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in notifications action: {str(e)}")
            return Response(
                {'error': f'An error occurred while processing notification settings: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get', 'put'])
    def preferences(self, request):
        try:
            logger.info("Processing system preferences")
            user = request.user
            if not hasattr(user, 'system_preferences'):
                logger.info("Creating SystemPreferences")
                SystemPreferences.objects.create(user=user)
                
            if request.method == 'GET':
                serializer = SystemPreferencesSerializer(user.system_preferences)
                logger.info("System preferences retrieved successfully")
                return Response(serializer.data)
            
            serializer = SystemPreferencesSerializer(user.system_preferences, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info("System preferences updated successfully")
                return Response(serializer.data)
            logger.error(f"System preferences validation error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in preferences action: {str(e)}")
            return Response(
                {'error': f'An error occurred while processing system preferences: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['delete'])
    def remove_profile_picture(self, request):
        try:
            logger.info("Removing profile picture")
            user = request.user
            if user.profile.profile_picture:
                # Delete the old file
                user.profile.profile_picture.delete(save=False)
                user.profile.profile_picture = None
                user.profile.save()
                return Response({'message': 'Profile picture removed successfully'}, status=status.HTTP_200_OK)
            return Response({'message': 'No profile picture to remove'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in remove_profile_picture action: {str(e)}")
            return Response(
                {'error': f'An error occurred while removing profile picture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['put'])
    def update_profile_picture(self, request):
        try:
            logger.info("Updating profile picture")
            user = request.user
            if not request.FILES.get('profile_picture'):
                return Response({'error': 'No profile picture provided'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Delete old profile picture if it exists
            if user.profile.profile_picture:
                user.profile.profile_picture.delete(save=False)
                
            # Update with new profile picture
            user.profile.profile_picture = request.FILES['profile_picture']
            user.profile.save()
            
            # Return the profile data including the new profile picture URL
            serializer = UserProfileSerializer(user.profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in update_profile_picture action: {str(e)}")
            return Response(
                {'error': f'An error occurred while updating profile picture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        try:
            user = request.user
            serializer = ChangePasswordSerializer(data=request.data)
            
            if serializer.is_valid():
                # Check old password
                if not user.check_password(serializer.validated_data['old_password']):
                    return Response(
                        {"old_password": ["Wrong password."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate new password
                try:
                    validate_password(serializer.validated_data['new_password'], user)
                except ValidationError as e:
                    return Response(
                        {"new_password": list(e.messages)},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Set new password
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                
                logger.info(f"Password changed successfully for user: {user.username}")
                return Response(
                    {"message": "Password updated successfully"},
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in change_password action: {str(e)}")
            return Response(
                {'error': f'An error occurred while changing password: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StationInformationViewSet(viewsets.ReadOnlyModelViewSet):  # Change to ReadOnlyModelViewSet
    serializer_class = StationInformationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StationInformation.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        try:
            instance = self.get_queryset().first()
            if not instance:
                instance = StationInformation.objects.create(user=request.user)
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving station information: {str(e)}")
            return Response(
                {"error": "Failed to retrieve station information"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'username': user.username,
                'email': user.email
            }
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    return Response({
        'username': user.username,
        'email': user.email
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_orders(request):
    orders = Order.objects.all().order_by('-created_at')[:10]
    serializer = RecentOrdersSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_report(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    orders = Order.objects.filter(
        created_at__range=[start_date, end_date]
    ).order_by('-created_at')
    
    total_sales = orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
    
    return Response({
        'total_sales': total_sales,
        'orders_count': orders.count()
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_report(request):
    devices = Device.objects.all()
    active_devices = devices.filter(status='ACTIVE').count()
    inactive_devices = devices.filter(status='INACTIVE').count()
    
    return Response({
        'total_devices': devices.count(),
        'active_devices': active_devices,
        'inactive_devices': inactive_devices
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_stats(request):
    total_orders = Order.objects.count()
    completed_orders = Order.objects.filter(status='COMPLETED').count()
    pending_orders = Order.objects.filter(status='PENDING').count()
    
    return Response({
        'total_orders': total_orders,
        'completed_orders': completed_orders,
        'pending_orders': pending_orders
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_refill_stats(request):
    try:
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = today.replace(day=1)
        start_of_year = today.replace(month=1, day=1)

        # Get daily refills
        daily_refills = TankRefill.objects.filter(
            refill_date__date=today
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount_added')
        )

        # Get weekly refills
        weekly_refills = TankRefill.objects.filter(
            refill_date__date__gte=start_of_week
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount_added')
        )

        # Get monthly refills
        monthly_refills = TankRefill.objects.filter(
            refill_date__date__gte=start_of_month
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount_added')
        )

        # Get yearly refills
        yearly_refills = TankRefill.objects.filter(
            refill_date__date__gte=start_of_year
        ).aggregate(
            count=Count('id'),
            total_amount=Sum('amount_added')
        )

        # Get trend data (last 7 days)
        trend_data = TankRefill.objects.filter(
            refill_date__date__gte=today - timedelta(days=7)
        ).annotate(
            date=TruncDate('refill_date')
        ).values('date').annotate(
            count=Count('id'),
            total_amount=Sum('amount_added')
        ).order_by('date')

        return Response({
            'daily': {
                'count': daily_refills['count'] or 0,
                'total_amount': float(daily_refills['total_amount'] or 0)
            },
            'weekly': {
                'count': weekly_refills['count'] or 0,
                'total_amount': float(weekly_refills['total_amount'] or 0)
            },
            'monthly': {
                'count': monthly_refills['count'] or 0,
                'total_amount': float(monthly_refills['total_amount'] or 0)
            },
            'yearly': {
                'count': yearly_refills['count'] or 0,
                'total_amount': float(yearly_refills['total_amount'] or 0)
            },
            'trend': [{
                'date': item['date'].strftime('%Y-%m-%d'),
                'count': item['count'],
                'total_amount': float(item['total_amount'] or 0)
            } for item in trend_data]
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    """
    Update the status of an order
    """
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    if not new_status or new_status not in dict(Order.STATUS_CHOICES).keys():
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update the order status
    order.status = new_status
    order.save()
    
    # Return the updated order
    serializer = OrderSerializer(order)
    return Response(serializer.data)

def index(request):
    return render(request, 'index.html')
