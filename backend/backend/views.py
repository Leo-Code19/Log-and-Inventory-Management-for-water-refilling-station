from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash, login
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserSettings
from .forms import AdminRegistrationForm
from .serializers import (
    UserProfileSerializer,
    UserSettingsSerializer,
    UserSettingsUpdateSerializer,
    ChangePasswordSerializer
)

def index(request):
    return render(request, 'index.html')

def register(request):
    if request.method == 'POST':
        form = AdminRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Set user as staff so they can access admin
            user.is_staff = True
            user.save()
            messages.success(request, 'Account created successfully. You can now log in.')
            return redirect('admin:login')
    else:
        form = AdminRegistrationForm()
    
    return render(request, 'admin/register.html', {'form': form})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_settings(request):
    try:
        # Get the authenticated user
        user = request.user
        print(f"Fetching data for user: {user.username}")  # Debug log

        # Get user data
        user_data = {
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
        print(f"User data to be sent: {user_data}")  # Debug log
        
        return Response(user_data)
    except Exception as e:
        print(f"Error in user_settings: {str(e)}")  # Debug log
        return Response(
            {'error': 'Failed to fetch user data'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    serializer = UserProfileSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        update_session_auth_hash(request, user)
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    try:
        user = request.user
        # Include profile picture URL
        profile_picture = None
        try:
            if user.profile.profile_picture:
                profile_picture = request.build_absolute_uri(user.profile.profile_picture.url)
        except Exception:
            profile_picture = None

        print(f"Getting current user data for: {user.username}")  # Debug log
        
        user_data = {
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_staff': user.is_staff,
            'profile_picture': profile_picture
        }
        print(f"Sending user data: {user_data}")  # Debug log
        return Response(user_data)
    except Exception as e:
        print(f"Error in get_current_user: {str(e)}")  # Debug log
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 