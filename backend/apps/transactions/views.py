from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Sum, Count
from django.utils.dateparse import parse_date
from .models import Transaction, TransactionCategory, BankAccount
from .serializers import (
    TransactionSerializer, TransactionCreateSerializer, 
    TransactionCategorySerializer, BankAccountSerializer,
    TransactionSummarySerializer
)
from apps.users.models import AuditLog
from apps.ai_services.tasks import analyze_transaction_task

import csv
from django.http import HttpResponse
from datetime import datetime, timedelta

class TransactionListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TransactionCreateSerializer
        return TransactionSerializer
    
    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)
        
        # Filtering
        transaction_type = self.request.query_params.get('type')
        status_filter = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')
        
        if transaction_type:
            queryset = queryset.filter(type=transaction_type)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        if date_from:
            date_from = parse_date(date_from)
            if date_from:
                queryset = queryset.filter(date__gte=date_from)
        
        if date_to:
            date_to = parse_date(date_to)
            if date_to:
                queryset = queryset.filter(date__lte=date_to)
        
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(vendor_name__icontains=search) |
                Q(invoice_number__icontains=search)
            )
        
        return queryset.select_related('reviewed_by').prefetch_related('documents')
    
    def perform_create(self, serializer):
        transaction = serializer.save()
        
        # Log transaction creation
        AuditLog.objects.create(
            user=self.request.user,
            action='CREATE',
            resource='transaction',
            resource_id=str(transaction.id),
            details={
                'description': transaction.description,
                'amount': float(transaction.amount),
                'type': transaction.type
            }
        )
        
        # Trigger AI analysis
        analyze_transaction_task.delay(str(transaction.id))

class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def transaction_summary(request):
    """Get transaction summary and analytics"""
    user_transactions = Transaction.objects.filter(user=request.user)
    
    # Date filtering for summary
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    if date_from:
        date_from = parse_date(date_from)
        if date_from:
            user_transactions = user_transactions.filter(date__gte=date_from)
    
    if date_to:
        date_to = parse_date(date_to)
        if date_to:
            user_transactions = user_transactions.filter(date__lte=date_to)
    
    # Calculate summary
    income_sum = user_transactions.filter(type='income').aggregate(
        total=Sum('amount'))['total'] or 0
    
    expense_sum = user_transactions.filter(type='expense').aggregate(
        total=Sum('amount'))['total'] or 0
    
    gst_collected = user_transactions.filter(type='income').aggregate(
        total=Sum('cgst_amount') + Sum('sgst_amount') + Sum('igst_amount')
    )['total'] or 0
    
    gst_paid = user_transactions.filter(type='expense').aggregate(
        total=Sum('cgst_amount') + Sum('sgst_amount') + Sum('igst_amount')
    )['total'] or 0
    
    tds_total = user_transactions.aggregate(
        total=Sum('tds_amount'))['total'] or 0
    
    summary_data = {
        'total_income': income_sum,
        'total_expenses': expense_sum,
        'net_profit': income_sum - expense_sum,
        'total_gst_collected': gst_collected,
        'total_gst_paid': gst_paid,
        'total_tds': tds_total,
        'transaction_count': user_transactions.count(),
        'pending_reviews': user_transactions.filter(status='pending').count(),
    }
    
    serializer = TransactionSummarySerializer(summary_data)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_transactions(request):
    """Export transactions to CSV"""
    queryset = Transaction.objects.filter(user=request.user).order_by('-date')
    
    # Apply same filters as list view
    transaction_type = request.query_params.get('type')
    status_filter = request.query_params.get('status')
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    
    if transaction_type:
        queryset = queryset.filter(type=transaction_type)
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    if date_from:
        date_from = parse_date(date_from)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
    
    if date_to:
        date_to = parse_date(date_to)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
    
    # Create CSV response
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
    
    writer = csv.writer(response)
    writer.writerow([
        'Date', 'Description', 'Amount', 'Type', 'Category', 'Status',
        'Invoice Number', 'Vendor Name', 'GST Number', 'CGST', 'SGST', 
        'IGST', 'TDS', 'Total Tax', 'Net Amount'
    ])
    
    for transaction in queryset:
        writer.writerow([
            transaction.date,
            transaction.description,
            transaction.amount,
            transaction.type,
            transaction.category,
            transaction.status,
            transaction.invoice_number,
            transaction.vendor_name,
            transaction.gst_number,
            transaction.cgst_amount,
            transaction.sgst_amount,
            transaction.igst_amount,
            transaction.tds_amount,
            transaction.total_tax_amount,
            transaction.net_amount,
        ])
    
    return response

class TransactionCategoryListView(generics.ListAPIView):
    serializer_class = TransactionCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = TransactionCategory.objects.filter(is_active=True)

class BankAccountListCreateView(generics.ListCreateAPIView):
    serializer_class = BankAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return BankAccount.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def review_transaction(request, transaction_id):
    """CA users can review and approve/reject transactions"""
    if request.user.role != 'CA':
        return Response({'error': 'Only CAs can review transactions'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        # CA should only review transactions of their clients
        from apps.users.models import ClientRelationship
        client_relationships = ClientRelationship.objects.filter(
            ca=request.user, is_active=True
        ).values_list('sme', flat=True)
        
        transaction = Transaction.objects.get(
            id=transaction_id, 
            user__in=client_relationships
        )
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    review_notes = request.data.get('review_notes', '')
    
    if new_status not in ['approved', 'rejected', 'flagged']:
        return Response({'error': 'Invalid status'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    transaction.status = new_status
    transaction.reviewed_by = request.user
    transaction.reviewed_at = datetime.now()
    transaction.review_notes = review_notes
    transaction.save()
    
    # Log the review
    AuditLog.objects.create(
        user=request.user,
        action='UPDATE',
        resource='transaction_review',
        resource_id=str(transaction.id),
        details={
            'status': new_status,
            'review_notes': review_notes,
            'transaction_owner': transaction.user.username
        }
    )
    
    return Response({'message': 'Transaction reviewed successfully'})