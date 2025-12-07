from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
from .models import (
    ComplianceRule, ComplianceCalendar, TaxCalculator, 
    GSTReturn, ITRFiling, ComplianceScore
)
from .serializers import (
    ComplianceRuleSerializer, ComplianceCalendarSerializer,
    TaxCalculatorSerializer, GSTReturnSerializer, ITRFilingSerializer,
    ComplianceScoreSerializer, TaxCalculationSerializer, GSTCalculationSerializer
)
from apps.users.models import AuditLog

class ComplianceCalendarView(generics.ListAPIView):
    serializer_class = ComplianceCalendarSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ComplianceCalendar.objects.filter(user=self.request.user)
        
        # Filter by completion status
        is_completed = self.request.query_params.get('completed')
        if is_completed is not None:
            queryset = queryset.filter(is_completed=is_completed.lower() == 'true')
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(due_date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(due_date__lte=date_to)
            except ValueError:
                pass
        
        return queryset

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_compliance_completed(request, item_id):
    """Mark a compliance item as completed"""
    try:
        item = ComplianceCalendar.objects.get(id=item_id, user=request.user)
        item.is_completed = True
        item.completed_at = timezone.now()
        item.save()
        
        # Log the completion
        AuditLog.objects.create(
            user=request.user,
            action='UPDATE',
            resource='compliance_calendar',
            resource_id=str(item.id),
            details={'title': item.title, 'completed': True}
        )
        
        return Response({'message': 'Compliance item marked as completed'})
    
    except ComplianceCalendar.DoesNotExist:
        return Response({'error': 'Compliance item not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

class GSTReturnListCreateView(generics.ListCreateAPIView):
    serializer_class = GSTReturnSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return GSTReturn.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ITRFilingListCreateView(generics.ListCreateAPIView):
    serializer_class = ITRFilingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ITRFiling.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def compliance_score(request):
    """Get user's compliance score"""
    score, created = ComplianceScore.objects.get_or_create(
        user=request.user,
        defaults={'overall_score': 100}
    )
    
    if created or (timezone.now() - score.last_calculated).days > 1:
        # Recalculate score
        score.calculate_score()
    
    serializer = ComplianceScoreSerializer(score)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def calculate_tax(request):
    """Calculate income tax"""
    serializer = TaxCalculationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    income = data['income_amount']
    deductions_80c = data['deductions_80c']
    deductions_80d = data['deductions_80d']
    other_deductions = data['other_deductions']
    
    # Calculate taxable income
    total_deductions = deductions_80c + deductions_80d + other_deductions
    taxable_income = max(income - total_deductions, 0)
    
    # Tax calculation for FY 2024-25 (New Tax Regime)
    tax_slabs = [
        (300000, 0),    # 0% up to 3L
        (300000, 0.05), # 5% from 3L to 6L
        (300000, 0.10), # 10% from 6L to 9L
        (300000, 0.15), # 15% from 9L to 12L
        (300000, 0.20), # 20% from 12L to 15L
        (float('inf'), 0.30) # 30% above 15L
    ]
    
    calculated_tax = 0
    remaining_income = float(taxable_income)
    
    for slab_limit, tax_rate in tax_slabs:
        if remaining_income <= 0:
            break
        
        taxable_in_slab = min(remaining_income, slab_limit)
        calculated_tax += taxable_in_slab * tax_rate
        remaining_income -= taxable_in_slab
    
    # Add cess (4% on income tax)
    cess = calculated_tax * 0.04
    total_tax = calculated_tax + cess
    
    result = {
        'gross_income': float(income),
        'total_deductions': float(total_deductions),
        'taxable_income': float(taxable_income),
        'income_tax': float(calculated_tax),
        'health_cess': float(cess),
        'total_tax_liability': float(total_tax),
        'effective_tax_rate': (float(total_tax) / float(income) * 100) if income > 0 else 0,
        'tax_saved_by_deductions': float((total_deductions * 0.30) if income > 1500000 else (total_deductions * 0.20))
    }
    
    return Response(result)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def calculate_gst(request):
    """Calculate GST amounts"""
    serializer = GSTCalculationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    taxable_amount = data['taxable_amount']
    gst_rate = data['gst_rate'] / 100  # Convert percentage to decimal
    transaction_type = data['transaction_type']
    
    if transaction_type == 'intrastate':
        # CGST + SGST
        cgst = taxable_amount * (gst_rate / 2)
        sgst = taxable_amount * (gst_rate / 2)
        igst = 0
    else:
        # IGST
        cgst = 0
        sgst = 0
        igst = taxable_amount * gst_rate
    
    total_gst = cgst + sgst + igst
    total_amount = taxable_amount + total_gst
    
    result = {
        'taxable_amount': float(taxable_amount),
        'gst_rate': float(data['gst_rate']),
        'cgst_amount': float(cgst),
        'sgst_amount': float(sgst),
        'igst_amount': float(igst),
        'total_gst': float(total_gst),
        'total_amount': float(total_amount),
        'transaction_type': transaction_type
    }
    
    return Response(result)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def compliance_dashboard(request):
    """Get compliance dashboard data"""
    user = request.user
    today = date.today()
    
    # Upcoming compliance items
    upcoming_items = ComplianceCalendar.objects.filter(
        user=user,
        due_date__gte=today,
        is_completed=False
    ).order_by('due_date')[:5]
    
    # Overdue items
    overdue_items = ComplianceCalendar.objects.filter(
        user=user,
        due_date__lt=today,
        is_completed=False
    ).count()
    
    # Recent GST returns
    recent_gst = GSTReturn.objects.filter(user=user).order_by('-created_at')[:3]
    
    # Recent ITR filings
    recent_itr = ITRFiling.objects.filter(user=user).order_by('-created_at')[:3]
    
    # Compliance score
    score, _ = ComplianceScore.objects.get_or_create(
        user=user,
        defaults={'overall_score': 100}
    )
    
    dashboard_data = {
        'compliance_score': ComplianceScoreSerializer(score).data,
        'upcoming_items': ComplianceCalendarSerializer(upcoming_items, many=True).data,
        'overdue_count': overdue_items,
        'recent_gst_returns': GSTReturnSerializer(recent_gst, many=True).data,
        'recent_itr_filings': ITRFilingSerializer(recent_itr, many=True).data,
        'summary': {
            'total_pending': upcoming_items.count() + overdue_items,
            'completed_this_month': ComplianceCalendar.objects.filter(
                user=user,
                completed_at__month=today.month,
                completed_at__year=today.year
            ).count()
        }
    }
    
    return Response(dashboard_data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_gstr3b_data(request):
    """Generate GSTR-3B data from transactions"""
    period = request.data.get('period')  # MM-YYYY format
    
    if not period:
        return Response({'error': 'Period is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        month, year = period.split('-')
        month = int(month)
        year = int(year)
    except (ValueError, IndexError):
        return Response({'error': 'Invalid period format. Use MM-YYYY'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Get user's transactions for the period
    from apps.transactions.models import Transaction
    transactions = Transaction.objects.filter(
        user=request.user,
        date__year=year,
        date__month=month,
        status='approved'
    )
    
    # Calculate GST summary
    outward_supplies = transactions.filter(type='income').aggregate(
        taxable_value=models.Sum('amount'),
        cgst=models.Sum('cgst_amount'),
        sgst=models.Sum('sgst_amount'),
        igst=models.Sum('igst_amount')
    )
    
    inward_supplies = transactions.filter(type='expense').aggregate(
        taxable_value=models.Sum('amount'),
        cgst=models.Sum('cgst_amount'),
        sgst=models.Sum('sgst_amount'),
        igst=models.Sum('igst_amount')
    )
    
    # Calculate net GST liability
    output_tax = (
        (outward_supplies['cgst'] or 0) + 
        (outward_supplies['sgst'] or 0) + 
        (outward_supplies['igst'] or 0)
    )
    
    input_tax = (
        (inward_supplies['cgst'] or 0) + 
        (inward_supplies['sgst'] or 0) + 
        (inward_supplies['igst'] or 0)
    )
    
    net_liability = max(output_tax - input_tax, 0)
    
    gstr3b_data = {
        'period': period,
        'outward_supplies': {
            'taxable_value': float(outward_supplies['taxable_value'] or 0),
            'cgst': float(outward_supplies['cgst'] or 0),
            'sgst': float(outward_supplies['sgst'] or 0),
            'igst': float(outward_supplies['igst'] or 0)
        },
        'inward_supplies': {
            'taxable_value': float(inward_supplies['taxable_value'] or 0),
            'cgst': float(inward_supplies['cgst'] or 0),
            'sgst': float(inward_supplies['sgst'] or 0),
            'igst': float(inward_supplies['igst'] or 0)
        },
        'tax_liability': {
            'output_tax': float(output_tax),
            'input_tax_credit': float(input_tax),
            'net_tax_payable': float(net_liability)
        },
        'transaction_count': transactions.count()
    }
    
    return Response(gstr3b_data)