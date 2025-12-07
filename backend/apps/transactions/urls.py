from django.urls import path
from . import views

urlpatterns = [
    path('', views.TransactionListCreateView.as_view(), name='transaction_list_create'),
    path('<uuid:pk>/', views.TransactionDetailView.as_view(), name='transaction_detail'),
    path('summary/', views.transaction_summary, name='transaction_summary'),
    path('export/', views.export_transactions, name='export_transactions'),
    path('categories/', views.TransactionCategoryListView.as_view(), name='transaction_categories'),
    path('bank-accounts/', views.BankAccountListCreateView.as_view(), name='bank_accounts'),
    path('<uuid:transaction_id>/review/', views.review_transaction, name='review_transaction'),
]