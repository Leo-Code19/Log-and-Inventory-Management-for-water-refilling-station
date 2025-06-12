from rest_framework import serializers
from ..models import Order

class OrderSerializer(serializers.ModelSerializer):
    # Include customer name for RecentOrders component
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'order_type', 'container_size',
                  'quantity', 'price_per_unit', 'total_amount', 'status',
                  'status_changed_at', 'completed_at', 'cancelled_at',
                  'created_at', 'updated_at']
        read_only_fields = ('status_changed_at', 'completed_at', 'cancelled_at')
