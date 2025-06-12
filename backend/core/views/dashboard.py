from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Order, Device, Customer, Delivery, TankRefill
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
def dashboard_stats(request):
    time_range = request.query_params.get('timeRange', 'day')
    now = timezone.now()
    if time_range == 'day':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == 'week':
        start_date = now - timedelta(days=7)
    elif time_range == 'month':
        start_date = now - timedelta(days=30)
    elif time_range == 'year':
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=365*100)
    orders = Order.objects.filter(created_at__range=(start_date, now))
    completed_orders = orders.filter(status='COMPLETED').count()
    cancelled_orders = orders.filter(status='CANCELLED').count()
    pending_orders = orders.filter(status='PENDING').count()
    processing_orders = orders.filter(status='PROCESSING').count()
    total_orders = orders.count()
    total_revenue = orders.filter(status='COMPLETED').aggregate(total=Sum('total_amount'))['total'] or 0
    return Response({
        'completed_orders': completed_orders,
        'cancelled_orders': cancelled_orders,
        'pending_orders': pending_orders,
        'processing_orders': processing_orders,
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
    })

class DashboardSummaryView(APIView):
    def get(self, request):
        # Get date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        # Get order statistics
        orders = Order.objects.filter(created_at__range=(start_date, end_date))
        order_stats = {
            'total': orders.count(),
            'completed': orders.filter(status='COMPLETED').count(),
            'pending': orders.filter(status='PENDING').count(),
            'cancelled': orders.filter(status='CANCELLED').count(),
        }
        
        # Get tank refill statistics
        refills = TankRefill.objects.filter(created_at__range=(start_date, end_date))
        refill_stats = {
            'total': refills.count(),
            'average_amount': refills.aggregate(avg=Avg('amount_added'))['avg'],
        }
        
        # Get delivery statistics
        deliveries = Delivery.objects.filter(delivery_date__range=(start_date, end_date))
        delivery_stats = {
            'total': deliveries.count(),
            'completed': deliveries.filter(status='COMPLETED').count(),
            'in_progress': deliveries.filter(status='IN_PROGRESS').count(),
        }
        
        return Response({
            'order_stats': order_stats,
            'refill_stats': refill_stats,
            'delivery_stats': delivery_stats,
        })

class DashboardOverviewView(APIView):
    def get(self, request):
        # Aggregate metrics for different time frames
        now = timezone.now()
        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        weekly_start = now - timedelta(days=7)
        monthly_start = now - timedelta(days=30)
        yearly_start = now - timedelta(days=365)

        # Completed orders stats
        completed_daily = Order.objects.filter(status='COMPLETED', completed_at__range=(start_today, now))
        daily_count = completed_daily.count()
        daily_sales_amount = completed_daily.aggregate(total=Sum('total_amount'))['total'] or 0

        completed_weekly = Order.objects.filter(status='COMPLETED', completed_at__range=(weekly_start, now))
        weekly_count = completed_weekly.count()
        weekly_sales_amount = completed_weekly.aggregate(total=Sum('total_amount'))['total'] or 0

        completed_monthly = Order.objects.filter(status='COMPLETED', completed_at__range=(monthly_start, now))
        monthly_count = completed_monthly.count()
        monthly_sales_amount = completed_monthly.aggregate(total=Sum('total_amount'))['total'] or 0

        completed_yearly = Order.objects.filter(status='COMPLETED', completed_at__range=(yearly_start, now))
        yearly_count = completed_yearly.count()
        yearly_sales_amount = completed_yearly.aggregate(total=Sum('total_amount'))['total'] or 0

        # Pending orders stats
        total_pending = Order.objects.filter(status='PENDING').count()
        daily_pending = Order.objects.filter(status='PENDING', created_at__range=(start_today, now)).count()

        # Device status
        status_counts = Device.objects.values('status').annotate(count=Count('id'))
        status_dict = {item['status']: item['count'] for item in status_counts}
        total_devices = sum(status_dict.values())
        devices_stats = {
            'online': status_dict.get('ONLINE', 0),
            'offline': status_dict.get('OFFLINE', 0),
            'maintenance': status_dict.get('MAINTENANCE', 0),
            'error': status_dict.get('ERROR', 0),
            'total': total_devices
        }

        # Refill stats
        daily_refills = TankRefill.objects.filter(refill_date__range=(start_today, now))
        daily_refills_count = daily_refills.count()
        daily_refills_amount = daily_refills.aggregate(total=Sum('amount_added'))['total'] or 0

        weekly_refills = TankRefill.objects.filter(refill_date__range=(weekly_start, now))
        weekly_refills_count = weekly_refills.count()
        weekly_refills_amount = weekly_refills.aggregate(total=Sum('amount_added'))['total'] or 0

        monthly_refills = TankRefill.objects.filter(refill_date__range=(monthly_start, now))
        monthly_refills_count = monthly_refills.count()
        monthly_refills_amount = monthly_refills.aggregate(total=Sum('amount_added'))['total'] or 0

        yearly_refills = TankRefill.objects.filter(refill_date__range=(yearly_start, now))
        yearly_refills_count = yearly_refills.count()
        yearly_refills_amount = yearly_refills.aggregate(total=Sum('amount_added'))['total'] or 0

        return Response({
            'orders': {
                'daily': daily_count,
                'weekly': weekly_count,
                'monthly': monthly_count,
                'yearly': yearly_count
            },
            'sales': {
                'daily': float(daily_sales_amount),
                'weekly': float(weekly_sales_amount),
                'monthly': float(monthly_sales_amount),
                'yearly': float(yearly_sales_amount)
            },
            'pending': {
                'total': total_pending,
                'daily': daily_pending
            },
            'devices': devices_stats,
            'refills': {
                'daily': {'count': daily_refills_count, 'total_amount': daily_refills_amount},
                'weekly': {'count': weekly_refills_count, 'total_amount': weekly_refills_amount},
                'monthly': {'count': monthly_refills_count, 'total_amount': monthly_refills_amount},
                'yearly': {'count': yearly_refills_count, 'total_amount': yearly_refills_amount}
            }
        })
