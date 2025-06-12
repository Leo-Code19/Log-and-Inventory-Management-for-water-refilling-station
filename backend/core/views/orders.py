from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from ..models import Order
from ..serializers import OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

@api_view(['GET'])
def recent_orders(request):
    orders = Order.objects.all().order_by('-created_at')[:10]
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def update_order_status(request, order_id):
    try:
        order = Order.objects.get(pk=order_id)
        order.status = request.data.get('status')
        order.save()
        return Response({'status': 'success'})
    except Order.DoesNotExist:
        return Response({'status': 'error', 'message': 'Order not found'}, status=404)
