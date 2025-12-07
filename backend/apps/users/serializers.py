from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, AuditLog, ClientRelationship

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 'first_name', 
                 'last_name', 'role', 'business_name', 'gst_number', 'phone']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                 'business_name', 'gst_number', 'phone', 'address', 'profile_picture',
                 'is_verified', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user_name', 'action', 'resource', 'resource_id', 
                 'details', 'timestamp']

class ClientRelationshipSerializer(serializers.ModelSerializer):
    ca_name = serializers.CharField(source='ca.get_full_name', read_only=True)
    sme_name = serializers.CharField(source='sme.get_full_name', read_only=True)
    sme_business = serializers.CharField(source='sme.business_name', read_only=True)
    
    class Meta:
        model = ClientRelationship
        fields = ['id', 'ca_name', 'sme_name', 'sme_business', 'is_active', 
                 'access_level', 'created_at']