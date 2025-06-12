from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.devices import DeviceViewSet, DeviceReadingViewSet
from .views.orders import OrderViewSet, recent_orders, update_order_status
from .views.settings import StationSettingsViewSet, SettingsViewSet, StationInformationViewSet
from .views.customers import CustomerViewSet
from .views.deliveries import DeliveryViewSet, TankRefillViewSet
from .views.auth import login, get_user
from .views.health import health_check
from .views.dashboard import dashboard_stats, DashboardSummaryView, DashboardOverviewView
from .report_views import SalesReportView, InventoryReportView, DeliveryReportView, RefillHistoryView, CustomerOrdersView

router = DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'device-readings', DeviceReadingViewSet, basename='device-reading')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'station-settings', StationSettingsViewSet, basename='station-settings')
router.register(r'settings', SettingsViewSet, basename='settings')
router.register(r'station-info', StationInformationViewSet, basename='station-info')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'deliveries', DeliveryViewSet, basename='delivery')
router.register(r'tank-refills', TankRefillViewSet, basename='tank-refill')
urlpatterns = [
    path('api/health/', health_check, name='health_check'),
    path('api/', include(router.urls)),
    path('api/login/', login, name='login'),
    path('api/user/', get_user, name='get_user'),
    path('api/dashboard/recent-orders/', recent_orders, name='recent_orders'),
    path('api/orders/<int:order_id>/status/', update_order_status, name='update_order_status'),
    path('api/dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('api/dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard_overview'),
    path('api/reports/sales/', SalesReportView.as_view(), name='sales_report'),
    path('api/reports/inventory/', InventoryReportView.as_view(), name='inventory_report'),
    path('api/reports/delivery/', DeliveryReportView.as_view(), name='delivery_report'),
    path('api/reports/refill-history/', RefillHistoryView.as_view(), name='refill_history'),
    path('api/reports/customer-orders/', CustomerOrdersView.as_view(), name='customer_orders'),
]