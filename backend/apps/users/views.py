from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import AuditLog, ClientRelationship
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    AuditLogSerializer, ClientRelationshipSerializer
)

User = get_user_model()

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        # Log registration
        AuditLog.objects.create(
            user=user,
            action='CREATE',
            resource='user',
            resource_id=str(user.id),
            details={'registration': True}
        )
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        # Log login
        AuditLog.objects.create(
            user=user,
            action='LOGIN',
            resource='user',
            resource_id=str(user.id),
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user)

class ClientListView(generics.ListAPIView):
    serializer_class = ClientRelationshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'CA':
            return ClientRelationship.objects.filter(ca=user, is_active=True)
        else:
            return ClientRelationship.objects.filter(sme=user, is_active=True)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def connect_with_ca(request):
    """SME users can connect with CAs"""
    if request.user.role != 'SME':
        return Response({'error': 'Only SME users can connect with CAs'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    ca_id = request.data.get('ca_id')
    try:
        ca = User.objects.get(id=ca_id, role='CA')
        relationship, created = ClientRelationship.objects.get_or_create(
            ca=ca, sme=request.user,
            defaults={'is_active': True}
        )
        
        if created:
            # Log the connection
            AuditLog.objects.create(
                user=request.user,
                action='CREATE',
                resource='client_relationship',
                resource_id=str(relationship.id),
                details={'ca_id': ca_id, 'ca_name': ca.get_full_name()}
            )
            
            return Response({'message': 'Successfully connected with CA'})
        else:
            return Response({'error': 'Already connected with this CA'})
    
    except User.DoesNotExist:
        return Response({'error': 'CA not found'}, status=status.HTTP_404_NOT_FOUND)