from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import StationSettings, StationInformation, SystemPreferences, NotificationSettings, UserProfile
from ..serializers import (
    StationSettingsSerializer, StationInformationSerializer,
    SystemPreferencesSerializer, NotificationSettingsSerializer
)
from django.contrib.auth.models import User

class StationSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = StationSettingsSerializer
    
    def get_queryset(self):
        return StationSettings.objects.filter(user=self.request.user)

class SettingsViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        system_prefs = SystemPreferences.objects.get_or_create(user=user)[0]
        station_settings = StationSettings.objects.get_or_create(user=user)[0]
        notification_settings = NotificationSettings.objects.get_or_create(user=user)[0]
        
        return Response({
            'system': SystemPreferencesSerializer(system_prefs).data,
            'station': StationSettingsSerializer(station_settings).data,
            'notifications': NotificationSettingsSerializer(notification_settings).data
        })
    
    @action(detail=False, methods=['patch'])
    def update_theme(self, request):
        theme = request.data.get('theme')
        if theme not in ['light', 'dark']:
            return Response({'error': 'Invalid theme'}, status=400)
            
        prefs = SystemPreferences.objects.get_or_create(user=request.user)[0]
        prefs.theme = theme
        prefs.save()
        return Response(SystemPreferencesSerializer(prefs).data)
    
    @action(detail=False, methods=['get', 'patch'])
    def notifications(self, request):
        user = request.user
        settings_instance, created = NotificationSettings.objects.get_or_create(user=user)
        if request.method == 'GET':
            serializer = NotificationSettingsSerializer(settings_instance)
            return Response(serializer.data)
        serializer = NotificationSettingsSerializer(settings_instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        user = request.user
        data = request.data
        
        # Get or create user profile
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        # Update username if provided
        if 'username' in data and data['username']:
            user.username = data['username']
        
        # Update email if provided
        if 'email' in data and data['email']:
            user.email = data['email']
        
        # Update profile fields if provided
        profile_data = data.get('profile', {})
        if profile_data:
            if 'first_name' in profile_data:
                profile.first_name = profile_data['first_name']
            if 'last_name' in profile_data:
                profile.last_name = profile_data['last_name']
        
        # Handle profile picture upload
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
        
        # Handle profile picture removal
        if data.get('remove_profile_picture', False):
            profile.profile_picture = None
        
        # Save changes
        try:
            user.save()
            profile.save()
            
            # Return updated user data
            return Response({
                'username': user.username,
                'email': user.email,
                'id': user.id,
                'first_name': profile.first_name,
                'last_name': profile.last_name,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StationInformationViewSet(viewsets.ModelViewSet):
    serializer_class = StationInformationSerializer
    
    def list(self, request):
        # Ensure a StationInformation exists for this user
        instance, created = StationInformation.objects.get_or_create(
            user=request.user,
            defaults={
                'station_name': 'Cleaar Oasis Purified Water Drinking',
                'address': 'street 2 mandaluyong city',
                'contact_number': '09192555227'
            }
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def get_queryset(self):
        if self.request.user.is_superuser:
            return StationInformation.objects.all()
        return StationInformation.objects.filter(user=self.request.user)
