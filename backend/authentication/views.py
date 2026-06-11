import random
import bcrypt
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.db.models import Q
from django.template.loader import render_to_string
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer, OTPVerifySerializer, UserSerializer
from .models import User, ActivationToken


def _error_response(error_code, message, http_status):
    return Response(
        {'error_code': error_code, 'message': message},
        status=http_status,
    )


def _find_user(identifier):
    return User.objects.filter(
        Q(email=identifier) | Q(phone=identifier) | Q(whatsapp_number=identifier)
    ).first()


def _registration_error_response(errors):
    for field in ['username', 'email', 'phone', 'whatsapp_number']:
        if field not in errors:
            continue

        field_error = errors[field]
        if isinstance(field_error, list):
            field_error = field_error[0] if field_error else None

        if isinstance(field_error, dict) and 'error_code' in field_error:
            return Response(field_error, status=status.HTTP_409_CONFLICT)

    first_field = next(iter(errors), None)
    first_error = errors[first_field] if first_field else errors
    if isinstance(first_error, list):
        first_error = first_error[0] if first_error else 'DonnÃ©es invalides.'

    return Response(
        {
            'error_code': 'ERR_REG_INVALID',
            'message': str(first_error),
            'errors': errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


def _send_activation(user, token):
    if user.auth_method == 'whatsapp':
        # Simulation — envoi OTP WhatsApp (à remplacer par API réelle)
        print(f"[OTP WhatsApp] OTP pour {user.whatsapp_number} : {token.otp_code}")
        return

    if user.email:
        activation_link = f"{settings.ACTIVATION_URL}/activate/?token={token.token}"
        subject = 'Activez votre compte Panoptes-x'

        text_content = (
            f'Bonjour {user.username},\n\n'
            f'Merci de vous être inscrit sur Panoptes-x.\n\n'
            f'Veuillez activer votre compte en cliquant sur le lien ci-dessous :\n'
            f'{activation_link}\n\n'
            f'Ce lien est valable 2 heures.\n\n'
            f'Équipe Panoptes-x'
        )

        html_content = (
            '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>'
            '<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif">'
            '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 20px">'
            '<tr><td align="center">'
            '<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08)">'
            '<tr><td style="padding:40px 40px 0">'
            '<h1 style="margin:0 0 8px;font-size:24px;color:#1a3a5c;font-weight:700">Panoptes-x</h1>'
            '<p style="margin:0 0 24px;font-size:14px;color:#667085">Comptabilit&eacute; automatis&eacute;e pour agents Mobile Money</p>'
            '<hr style="border:none;border-top:1px solid #eaecf0;margin:0 0 24px">'
            '<p style="margin:0 0 16px;font-size:16px;color:#344054;line-height:1.6">'
            'Bonjour <strong>' + user.username + '</strong>,</p>'
            '<p style="margin:0 0 16px;font-size:16px;color:#344054;line-height:1.6">'
            'Merci de vous &ecirc;tre inscrit sur Panoptes-x. Veuillez activer votre compte en cliquant sur le bouton ci-dessous :</p>'
            '<table cellpadding="0" cellspacing="0" style="margin:32px 0">'
            '<tr><td align="center" style="background:#1a3a5c;border-radius:8px;padding:14px 32px">'
            '<a href="' + activation_link + '" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none">Activer mon compte</a>'
            '</td></tr></table>'
            '<p style="margin:0 0 24px;font-size:14px;color:#98a2b3">Ce lien est valable 2 heures. Si vous n\'avez pas cr&eacute;&eacute; de compte, ignorez cet email.</p>'
            '<hr style="border:none;border-top:1px solid #eaecf0;margin:0 0 24px">'
            '<p style="margin:0 0 4px;font-size:14px;color:#667085">&Eacute;quipe Panoptes-x</p>'
            '</td></tr></table>'
            '</td></tr></table>'
            '</body></html>'
        )

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
                charset='utf-8',
            )
            msg.attach_alternative(html_content, 'text/html')
            msg.send(fail_silently=False)
            print(f"[EMAIL] Activation envoyée à {user.email}")
        except Exception as e:
            print(f"[EMAIL] ÉCHEC pour {user.email}: {e}")


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return _registration_error_response(serializer.errors)

    password = request.data.get('password', '')
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)

    user = serializer.save()
    user.password = hashed.decode('utf-8')
    user.save(update_fields=['password'])

    if user.auth_method == 'whatsapp':
        otp = f"{random.randint(0, 999999):06d}"
        token = ActivationToken.objects.create(
            user=user, method='whatsapp', otp_code=otp
        )
    else:
        token = ActivationToken.objects.create(user=user, method=user.auth_method)

    _send_activation(user, token)

    if user.auth_method == 'whatsapp':
        msg = 'Un code OTP à 6 chiffres vous a été envoyé par WhatsApp.'
    elif user.auth_method == 'email':
        msg = 'Vérifiez votre email pour activer votre compte.'
    else:
        msg = 'Un lien d\'activation vous a été envoyé.'

    return Response(
        {'message': msg, 'user': UserSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def activate(request):
    token_str = request.query_params.get('token')
    if not token_str:
        return _error_response('ERR_MISSING_TOKEN', 'Token manquant.', status.HTTP_400_BAD_REQUEST)

    try:
        token = ActivationToken.objects.get(token=token_str)
    except ActivationToken.DoesNotExist:
        return _error_response('ERR_INVALID_TOKEN', 'Token invalide.', status.HTTP_404_NOT_FOUND)

    if token.is_expired():
        return _error_response('ERR_LINK_EXPIRED', 'Ce lien a expiré (valable 2 heures).', status.HTTP_410_GONE)

    if token.is_used:
        return _error_response('ERR_LINK_ALREADY_USED', 'Ce lien a déjà été utilisé.', status.HTTP_403_FORBIDDEN)

    user = token.user
    user.is_active = True
    user.email_verified = True
    user.save(update_fields=['is_active', 'email_verified'])
    token.is_used = True
    token.save(update_fields=['is_used'])

    return Response(
        {'message': 'SUCCESS_ACCOUNT_ACTIVATED', 'detail': 'Compte activé avec succès.'},
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = OTPVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return _error_response('ERR_INVALID_OTP', 'Code OTP invalide.', status.HTTP_400_BAD_REQUEST)

    whatsapp_number = serializer.validated_data['whatsapp_number']
    otp_code = serializer.validated_data['otp_code']

    user = User.objects.filter(whatsapp_number=whatsapp_number).first()
    if not user:
        return _error_response('ERR_USER_NOT_FOUND', 'Utilisateur introuvable.', status.HTTP_404_NOT_FOUND)

    if user.is_active:
        return _error_response('ERR_ALREADY_ACTIVE', 'Compte déjà activé.', status.HTTP_400_BAD_REQUEST)

    token = ActivationToken.objects.filter(
        user=user, method='whatsapp', otp_code=otp_code, is_used=False
    ).first()

    if not token:
        return _error_response('ERR_INVALID_OTP', 'Code OTP incorrect.', status.HTTP_400_BAD_REQUEST)

    if token.is_expired():
        return _error_response('ERR_OTP_EXPIRED', 'Ce code a expiré (valable 2 heures).', status.HTTP_410_GONE)

    user.is_active = True
    user.save(update_fields=['is_active'])
    token.is_used = True
    token.save(update_fields=['is_used'])

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'SUCCESS_ACCOUNT_ACTIVATED',
        'detail': 'Compte activé avec succès.',
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return _error_response('ERR_AUTH_BAD_CRED', 'Identifiants invalides.', status.HTTP_401_UNAUTHORIZED)

    identifier = serializer.validated_data['identifier']
    password = serializer.validated_data['password']

    user = _find_user(identifier)
    if not user:
        return _error_response('ERR_AUTH_BAD_CRED', 'Identifiant ou mot de passe incorrect.', status.HTTP_401_UNAUTHORIZED)

    if not user.password:
        return _error_response('ERR_AUTH_BAD_CRED', 'Identifiant ou mot de passe incorrect.', status.HTTP_401_UNAUTHORIZED)

    stored = user.password.encode('utf-8')
    if not bcrypt.checkpw(password.encode('utf-8'), stored):
        return _error_response('ERR_AUTH_BAD_CRED', 'Identifiant ou mot de passe incorrect.', status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return _error_response('ERR_AUTH_INACTIVE', 'Compte non activé. Vérifiez vos messages.', status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

