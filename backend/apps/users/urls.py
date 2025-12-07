from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit_logs'),
    path('clients/', views.ClientListView.as_view(), name='clients'),
    path('connect-ca/', views.connect_with_ca, name='connect_ca'),
]