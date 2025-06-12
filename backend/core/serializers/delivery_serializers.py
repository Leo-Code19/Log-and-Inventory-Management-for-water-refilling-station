from rest_framework import serializers
from ..models import Delivery, TankRefill

class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = '__all__'

class TankRefillSerializer(serializers.ModelSerializer):
    class Meta:
        model = TankRefill
        fields = '__all__'
