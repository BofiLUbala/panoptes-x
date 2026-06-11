import re
import random
from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.Serializer):
    auth_method = serializers.ChoiceField(choices=['email', 'phone', 'whatsapp'])
    service_profile = serializers.ChoiceField(choices=['business', 'family', 'partner'], default='business')
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    whatsapp_number = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    pin = serializers.CharField(max_length=4, required=False, allow_blank=True)

    def validate(self, attrs):
        method = attrs['auth_method']

        username = attrs.get('username', '').strip()
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError(
                {
                    'username': {
                        'error_code': 'ERR_REG_DUP_USERNAME',
                        'message': 'Ce nom d\'utilisateur est déjà utilisé.',
                    }
                }
            )

        if method == 'email':
            if not attrs.get('email'):
                raise serializers.ValidationError({'email': "L'email est requis."})
            email = attrs['email'].strip().lower()
            if User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError(
                    {'email': {'error_code': 'ERR_REG_DUP_EMAIL', 'message': 'Cet email est déjà utilisé.'}}
                )
            attrs['email'] = email
            attrs['phone'] = None
            attrs['whatsapp_number'] = None

        elif method == 'phone':
            if not attrs.get('phone'):
                raise serializers.ValidationError({'phone': 'Le téléphone est requis.'})
            if User.objects.filter(phone=attrs['phone']).exists():
                raise serializers.ValidationError(
                    {'phone': {'error_code': 'ERR_REG_DUP_PHONE', 'message': 'Ce numéro est déjà utilisé.'}}
                )
            attrs['email'] = ''
            attrs['whatsapp_number'] = None

        elif method == 'whatsapp':
            if not attrs.get('whatsapp_number'):
                raise serializers.ValidationError({'whatsapp_number': 'Le numéro WhatsApp est requis.'})
            if User.objects.filter(whatsapp_number=attrs['whatsapp_number']).exists():
                raise serializers.ValidationError(
                    {'whatsapp_number': {'error_code': 'ERR_REG_DUP_WHATSAPP', 'message': 'Ce numéro WhatsApp est déjà utilisé.'}}
                )
            attrs['phone'] = attrs['whatsapp_number']
            attrs['email'] = ''

        password = attrs.get('password', '')
        errors = []
        if len(password) < 8 or len(password) > 16:
            errors.append('Le mot de passe doit contenir entre 8 et 16 caractères.')
        if not re.search(r'[A-Z]', password):
            errors.append('Doit contenir au moins une majuscule.')
        if not re.search(r'[a-z]', password):
            errors.append('Doit contenir au moins une minuscule.')
        if not re.search(r'[0-9]', password):
            errors.append('Doit contenir au moins un chiffre.')
        if not re.search(r'[$@!%*?&]', password):
            errors.append('Doit contenir au moins un caractère spécial ($@!%*?&).')
        if errors:
            raise serializers.ValidationError({'password': errors})

        if password != attrs.get('confirm_password', ''):
            raise serializers.ValidationError({'confirm_password': 'Les mots de passe ne correspondent pas.'})

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        pin = validated_data.pop('pin', None)

        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            phone=validated_data.get('phone'),
            whatsapp_number=validated_data.get('whatsapp_number'),
            auth_method=validated_data['auth_method'],
            service_profile=validated_data.get('service_profile', User.ServiceProfile.BUSINESS),
            pin=pin if pin else None,
            is_active=False,
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField()


class OTPVerifySerializer(serializers.Serializer):
    whatsapp_number = serializers.CharField()
    otp_code = serializers.CharField(max_length=6, min_length=6)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'phone', 'email', 'whatsapp_number', 'username',
            'auth_method', 'service_profile', 'subscription_plan', 'subscription_expiry',
            'email_verified', 'created_at',
        ]
        read_only_fields = ['id', 'email_verified', 'created_at']

