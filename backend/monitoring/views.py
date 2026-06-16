import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import Device, WatchRelation, ForwardedSms
from .permissions import HasDeviceSecret
from .serializers import (
    DeviceRegisterSerializer,
    DeviceSerializer,
    AuthorizeWatcherSerializer,
    ConfirmWatcherSerializer,
    RevokeWatcherSerializer,
    ForwardSmsSerializer,
    WatchRelationSerializer,
    ForwardedSmsSerializer,
)
from .utils import (
    normalize_phone,
    get_device_secret_from_request,
    cleanup_old_sms,
    send_fcm_notification,
)

logger = logging.getLogger(__name__)


def _get_watcher_device(request):
    """Resolve the calling device from X-Device-Secret header first,
    then fall back to any device owned by the authenticated user."""
    secret = get_device_secret_from_request(request)
    if secret:
        device = Device.objects.filter(device_secret=secret).first()
        if device:
            return device
    # Fall back to user-owned device only when request.user is authenticated
    if hasattr(request, 'user') and request.user and request.user.is_authenticated:
        return Device.objects.filter(user=request.user).first()
    return None


class RegisterDeviceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = normalize_phone(serializer.validated_data['phone_number'])
        fcm_token = serializer.validated_data.get('fcm_token') or None

        device, created = Device.objects.get_or_create(
            phone_number=phone,
            defaults={'user': request.user, 'fcm_token': fcm_token},
        )
        if not created:
            device.user = request.user
            if fcm_token:
                device.fcm_token = fcm_token
            device.save(update_fields=['user', 'fcm_token', 'updated_at'])

        return Response(
            DeviceSerializer(device).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class AuthorizeWatcherView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AuthorizeWatcherSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        watcher = _get_watcher_device(request)
        if not watcher:
            return Response(
                {'error_code': 'NO_DEVICE', 'message': 'Enregistrez d\'abord cet appareil.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_phone = normalize_phone(serializer.validated_data['target_phone'])
        if target_phone == watcher.phone_number:
            return Response(
                {'error_code': 'SELF_WATCH', 'message': 'Impossible de surveiller votre propre numéro.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = Device.objects.filter(phone_number=target_phone).first()
        if not target:
            return Response(
                {
                    'error_code': 'TARGET_NOT_FOUND',
                    'message': 'L\'appareil cible n\'est pas encore enregistré sur PANOPTES-X.',
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        relation, created = WatchRelation.objects.get_or_create(
            watcher=watcher,
            target=target,
            defaults={'status': 'pending'},
        )
        if not created and relation.status == 'active':
            return Response(
                {'error_code': 'ALREADY_ACTIVE', 'message': 'Surveillance déjà active.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not created and relation.status == 'pending':
            return Response(
                WatchRelationSerializer(relation).data,
                status=status.HTTP_200_OK,
            )

        if relation.status in ('rejected', 'revoked'):
            relation.status = 'pending'
            relation.confirmed_at = None
            relation.revoked_at = None
            relation.save(update_fields=['status', 'confirmed_at', 'revoked_at'])

        send_fcm_notification(
            target.fcm_token,
            'Demande de surveillance',
            f'{watcher.phone_number} souhaite surveiller vos SMS.',
            {
                'type': 'watch_request',
                'request_id': str(relation.id),
                'watcher_phone': watcher.phone_number,
            },
        )

        return Response(WatchRelationSerializer(relation).data, status=status.HTTP_201_CREATED)


class ConfirmWatcherView(APIView):
    permission_classes = [HasDeviceSecret]

    def post(self, request):
        serializer = ConfirmWatcherSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        target = request.device
        request_id = serializer.validated_data['request_id']
        action = serializer.validated_data['action']

        try:
            relation = WatchRelation.objects.get(id=request_id, target=target)
        except WatchRelation.DoesNotExist:
            return Response(
                {'error_code': 'NOT_FOUND', 'message': 'Demande introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if relation.status != 'pending':
            return Response(
                {'error_code': 'INVALID_STATE', 'message': f'Demande déjà traitée ({relation.status}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == 'accept':
            relation.status = 'active'
            relation.confirmed_at = timezone.now()
            relation.save(update_fields=['status', 'confirmed_at'])
            send_fcm_notification(
                relation.watcher.fcm_token,
                'Surveillance activée',
                f'{target.phone_number} a accepté la surveillance.',
                {'type': 'watch_active', 'request_id': str(relation.id)},
            )
        else:
            relation.status = 'rejected'
            relation.save(update_fields=['status'])
            send_fcm_notification(
                relation.watcher.fcm_token,
                'Surveillance refusée',
                f'{target.phone_number} a refusé la surveillance.',
                {'type': 'watch_rejected', 'request_id': str(relation.id)},
            )

        return Response(WatchRelationSerializer(relation).data)


class RevokeWatcherView(APIView):
    permission_classes = [HasDeviceSecret]

    def post(self, request):
        serializer = RevokeWatcherSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        device = request.device
        request_id = serializer.validated_data.get('request_id')
        target_phone = serializer.validated_data.get('target_phone')

        if request_id:
            from django.db.models import Q
            relation = WatchRelation.objects.filter(
                Q(watcher=device) | Q(target=device),
                id=request_id,
                status='active',
            ).first()
        elif target_phone:
            phone = normalize_phone(target_phone)
            relation = WatchRelation.objects.filter(
                target=Device.objects.filter(phone_number=phone).first(),
                watcher=device,
                status='active',
            ).first() or WatchRelation.objects.filter(
                watcher=Device.objects.filter(phone_number=phone).first(),
                target=device,
                status='active',
            ).first()
        else:
            return Response(
                {'error_code': 'MISSING_PARAM', 'message': 'request_id ou target_phone requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not relation:
            return Response(
                {'error_code': 'NOT_FOUND', 'message': 'Relation introuvable.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        relation.status = 'revoked'
        relation.revoked_at = timezone.now()
        relation.save(update_fields=['status', 'revoked_at'])

        other = relation.watcher if relation.target_id == device.id else relation.target
        send_fcm_notification(
            other.fcm_token,
            'Surveillance révoquée',
            f'La surveillance entre {relation.watcher.phone_number} et {relation.target.phone_number} a été révoquée.',
            {'type': 'watch_revoked', 'request_id': str(relation.id)},
        )

        return Response(WatchRelationSerializer(relation).data)



class WatchRelationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        device = _get_watcher_device(request)
        if not device:
            secret = get_device_secret_from_request(request)
            if secret:
                device = Device.objects.filter(device_secret=secret).first()
        if not device:
            return Response(
                {'error_code': 'NO_DEVICE', 'message': 'Appareil non enregistré.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.db.models import Q
        relations = WatchRelation.objects.filter(
            Q(watcher=device) | Q(target=device),
        ).select_related('watcher', 'target')

        role = request.query_params.get('role')
        if role == 'watcher':
            relations = relations.filter(watcher=device)
        elif role == 'target':
            relations = relations.filter(target=device)

        return Response(WatchRelationSerializer(relations, many=True).data)


class ForwardSmsView(APIView):
    permission_classes = [HasDeviceSecret]

    def post(self, request):
        serializer = ForwardSmsSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning('forward-sms validation error: %s', serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        target = request.device
        logger.info('forward-sms: target=%s sender=%s', target.phone_number, serializer.validated_data.get('sender'))

        has_active = WatchRelation.objects.filter(
            target=target,
            status='active',
        ).exists()
        if not has_active:
            logger.warning('forward-sms: no active watcher for target=%s', target.phone_number)
            return Response(
                {'error_code': 'NO_ACTIVE_WATCH', 'message': 'Aucune surveillance active.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        received_at = serializer.validated_data.get('timestamp') or timezone.now()
        sms = ForwardedSms.objects.create(
            target_device=target,
            sender=serializer.validated_data['sender'],
            message=serializer.validated_data['message'],
            received_at=received_at,
        )
        logger.info('forward-sms: stored sms id=%s', sms.id)

        cleanup_old_sms()

        watchers = WatchRelation.objects.filter(
            target=target,
            status='active',
        ).select_related('watcher')
        for rel in watchers:
            send_fcm_notification(
                rel.watcher.fcm_token,
                f'SMS de {sms.sender}',
                sms.message[:120],
                {
                    'type': 'new_sms',
                    'target_phone': target.phone_number,
                    'sms_id': str(sms.id),
                },
            )

        return Response(ForwardedSmsSerializer(sms).data, status=status.HTTP_201_CREATED)


class GetSmsView(APIView):
    # Accept both JWT (IsAuthenticated) and device-secret (HasDeviceSecret).
    # AllowAny is used here and device resolution is done manually so that
    # Device A can retrieve SMS using either its JWT bearer token or its
    # X-Device-Secret header (useful for background polling).
    permission_classes = []

    def get(self, request):
        # Try to resolve watcher from device-secret header first, then JWT
        watcher = None
        secret = get_device_secret_from_request(request)
        if secret:
            watcher = Device.objects.filter(device_secret=secret).first()
        if not watcher and hasattr(request, 'user') and request.user and request.user.is_authenticated:
            watcher = Device.objects.filter(user=request.user).first()

        if not watcher:
            return Response(
                {'error_code': 'NO_DEVICE', 'message': 'Appareil non enregistré ou authentification requise.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        target_phone = request.query_params.get('target_phone')
        if not target_phone:
            return Response(
                {'error_code': 'MISSING_PARAM', 'message': 'target_phone requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_phone = normalize_phone(target_phone)
        target = Device.objects.filter(phone_number=target_phone).first()
        if not target:
            return Response({'results': [], 'count': 0})

        if not WatchRelation.objects.filter(
            watcher=watcher,
            target=target,
            status='active',
        ).exists():
            logger.warning('get-sms: watcher=%s not authorized for target=%s', watcher.phone_number, target_phone)
            return Response(
                {'error_code': 'NOT_AUTHORIZED', 'message': 'Surveillance non active pour ce numéro.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 50)), 100)
        offset = (max(page, 1) - 1) * page_size

        qs = ForwardedSms.objects.filter(target_device=target).order_by('-received_at')
        total = qs.count()
        items = qs[offset:offset + page_size]
        serializer = ForwardedSmsSerializer(items, many=True)
        logger.info('get-sms: watcher=%s target=%s count=%s', watcher.phone_number, target_phone, total)
        return Response({'results': serializer.data, 'count': total, 'page': page, 'page_size': page_size})
