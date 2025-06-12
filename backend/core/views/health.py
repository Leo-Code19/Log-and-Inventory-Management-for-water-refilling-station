from django.db import connections
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from redis import Redis
from django.conf import settings
import socket

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint that verifies:
    1. Database connection
    2. Redis connection
    3. Application status
    """
    health_status = {
        'status': 'healthy',
        'database': 'healthy',
        'redis': 'healthy',
        'details': {}
    }

    # Check database connection
    try:
        db_conn = connections['default']
        db_conn.cursor()
    except OperationalError:
        health_status['status'] = 'unhealthy'
        health_status['database'] = 'unhealthy'
        health_status['details']['database'] = 'Could not connect to database'

    # Check Redis connection
    try:
        redis_client = Redis.from_url(settings.CACHES['default']['LOCATION'])
        redis_client.ping()
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['redis'] = 'unhealthy'
        health_status['details']['redis'] = str(e)

    # Add system info
    health_status['details']['hostname'] = socket.gethostname()
    
    return Response(health_status)
