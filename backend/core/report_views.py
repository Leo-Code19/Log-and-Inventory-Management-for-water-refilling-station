from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from .reports import ReportGenerator

class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Parse query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        customer_id = request.query_params.get('customer_id')
        product_type = request.query_params.get('product_type')
        
        # Convert string dates to datetime objects if provided
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Generate the report
        report_data = ReportGenerator.get_sales_report(
            start_date=start_date,
            end_date=end_date,
            customer_id=customer_id,
            product_type=product_type
        )
        
        return Response(report_data)

class InventoryReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Parse query parameters
        product_type = request.query_params.get('product_type')
        
        # Generate the report
        report_data = ReportGenerator.get_inventory_report(
            product_type=product_type
        )
        
        return Response(report_data)

class DeliveryReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Parse query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Convert string dates to datetime objects if provided
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Generate the report
        report_data = ReportGenerator.get_delivery_report(
            start_date=start_date,
            end_date=end_date
        )
        
        return Response(report_data)

class RefillHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Parse query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        customer_id = request.query_params.get('customer_id')
        
        # Convert string dates to datetime objects if provided
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Generate the report
        report_data = ReportGenerator.get_refill_history(
            start_date=start_date,
            end_date=end_date,
            customer_id=customer_id
        )
        
        return Response(report_data)

class CustomerOrdersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Parse query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        customer_id = request.query_params.get('customer_id')
        
        # Convert string dates to datetime objects if provided
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                return Response(
                    {"error": "Invalid end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Generate the report
        report_data = ReportGenerator.get_customer_orders(
            customer_id=customer_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return Response(report_data)

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Generate the summary
        summary_data = ReportGenerator.get_dashboard_summary()
        
        return Response(summary_data)
