from rest_framework.decorators import api_view, permission_classes, authentication_classes
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'username': user.username,
                'email': user.email,
                'id': user.id
            }
        })
    return Response({'error': 'Invalid credentials'}, status=400)

@api_view(['GET'])
def get_user(request):
    user = request.user
    # Get the user profile to include first_name and last_name
    profile = None
    try:
        profile = user.profile
    except Exception as e:
        print(f"Error getting user profile: {e}")
    
    return Response({
        'username': user.username,
        'email': user.email,
        'id': user.id,
        'first_name': profile.first_name if profile else '',
        'last_name': profile.last_name if profile else ''
    })
