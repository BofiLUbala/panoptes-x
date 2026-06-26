import random
import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import RegisterSerializer, LoginSerializer, OTPVerifySerializer, UserSerializer
from .models import User, ActivationToken

logger = logging.getLogger(__name__)


def _error_response(error_code, message, http_status):
    return Response(
        {'error_code': error_code, 'message': message},
        status=http_status,
    )


def _find_user(identifier):
    return User.objects.filter(
        Q(username=identifier) | Q(email=identifier) | Q(phone=identifier) | Q(whatsapp_number=identifier)
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
        first_error = first_error[0] if first_error else 'Donnees invalides.'

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
        print(f"[OTP WhatsApp] OTP pour {user.whatsapp_number} : {token.otp_code}")
        return

    if user.email:
        activation_link = f"{settings.ACTIVATION_URL}/activate/?token={token.token}"
        subject = 'Activez votre compte Panoptes-x'

        text_content = (
            f'Bonjour {user.username},\n\n'
            f'Merci de vous etre inscrit sur Panoptes-x.\n\n'
            f'Veuillez activer votre compte en cliquant sur le lien ci-dessous :\n'
            f'{activation_link}\n\n'
            f'Ce lien est valable 2 heures.\n\n'
            f'Equipe Panoptes-x'
        )

        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.encoding = 'utf-8'
            result = msg.send(fail_silently=False)
            logger.info('Activation email sent to %s (result=%s)', user.email, result)
        except Exception as e:
            logger.error('Failed to send activation email to %s: %s', user.email, e)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return _registration_error_response(serializer.errors)

    user = serializer.save()

    if user.auth_method == 'whatsapp':
        otp = f"{random.randint(0, 999999):06d}"
        token = ActivationToken.objects.create(
            user=user, method='whatsapp', otp_code=otp
        )
    else:
        token = ActivationToken.objects.create(user=user, method=user.auth_method)

    _send_activation(user, token)

    if user.auth_method == 'whatsapp':
        msg = 'Un code OTP a 6 chiffres vous a ete envoye par WhatsApp.'
    elif user.auth_method == 'email':
        msg = f"Verifiez votre boite e-mail a l'adresse {user.email} pour activer votre compte."
    else:
        msg = "Un lien d'activation vous a ete envoye."

    from audit.utils import log_audit
    log_audit(user, 'create', 'user', user.id, 'User registration', request=request)

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
        return _error_response('ERR_LINK_EXPIRED', 'Ce lien a expire (valable 2 heures).', status.HTTP_410_GONE)

    if token.is_used:
        return _error_response('ERR_LINK_ALREADY_USED', 'Ce lien a deja ete utilise.', status.HTTP_403_FORBIDDEN)

    user = token.user
    user.is_active = True
    user.email_verified = True
    user.save(update_fields=['is_active', 'email_verified'])
    token.is_used = True
    token.save(update_fields=['is_used'])

    from audit.utils import log_audit
    log_audit(user, 'update', 'user', user.id, 'Account activated', request=request)

    return Response(
        {'message': 'SUCCESS_ACCOUNT_ACTIVATED', 'detail': 'Compte active avec succes.'},
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
        return _error_response('ERR_ALREADY_ACTIVE', 'Compte deja active.', status.HTTP_400_BAD_REQUEST)

    token = ActivationToken.objects.filter(
        user=user, method='whatsapp', otp_code=otp_code, is_used=False
    ).first()

    if not token:
        return _error_response('ERR_INVALID_OTP', 'Code OTP incorrect.', status.HTTP_400_BAD_REQUEST)

    if token.is_expired():
        return _error_response('ERR_OTP_EXPIRED', 'Ce code a expire (valable 2 heures).', status.HTTP_410_GONE)

    user.is_active = True
    user.save(update_fields=['is_active'])
    token.is_used = True
    token.save(update_fields=['is_used'])

    refresh = RefreshToken.for_user(user)

    from audit.utils import log_audit
    log_audit(user, 'update', 'user', user.id, 'Account activated via OTP', request=request)

    return Response({
        'message': 'SUCCESS_ACCOUNT_ACTIVATED',
        'detail': 'Compte active avec succes.',
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
    if not user or not user.password:
        return _error_response('ERR_AUTH_BAD_CRED', 'Identifiant ou mot de passe incorrect.', status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return _error_response('ERR_AUTH_BAD_CRED', 'Identifiant ou mot de passe incorrect.', status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return _error_response('ERR_AUTH_INACTIVE', 'Compte non active. Verifiez vos messages.', status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)

    from audit.utils import log_audit
    log_audit(user, 'login', 'session', None, 'User login', request=request)

    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        from audit.utils import log_audit
        log_audit(request.user, 'logout', 'session', None, 'User logout', request=request)
    except Exception as e:
        logger.warning('Logout token blacklist error: %s', e)

    return Response({'message': 'Deconnexion reussie.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
