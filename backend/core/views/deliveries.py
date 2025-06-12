from rest_framework import viewsets
from ..models import Delivery, TankRefill
from ..serializers import DeliverySerializer, TankRefillSerializer

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer

class TankRefillViewSet(viewsets.ModelViewSet):
    queryset = TankRefill.objects.all()
    serializer_class = TankRefillSerializer
