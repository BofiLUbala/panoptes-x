import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification, PushDevice
from .serializers import NotificationSerializer, PushDeviceSerializer, RegisterPushDeviceSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    unread_first = request.query_params.get('unread_first', 'true').lower() == 'true'
    limit = min(int(request.query_params.get('limit', 50)), 200)

    qs = Notification.objects.filter(user=request.user)
    if unread_first:
        from django.db.models import Case, BooleanField, Value, When
        qs = qs.annotate(
            is_unread=Case(
                When(is_read=False, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            )
        ).order_by('-is_unread', '-created_at')
    else:
        qs = qs.order_by('-created_at')

    notifications = qs[:limit]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    notification = Notification.objects.filter(id=notification_id, user=request.user).first()
    if not notification:
        return Response({'error_code': 'NOT_FOUND', 'message': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
    notification.mark_read()
    return Response({'message': 'Notification marked as read.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'message': 'All notifications marked as read.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_push_device(request):
    serializer = RegisterPushDeviceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    device, created = PushDevice.objects.update_or_create(
        fcm_token=serializer.validated_data['fcm_token'],
        defaults={
            'user': request.user,
            'platform': serializer.validated_data.get('platform', 'android'),
            'is_active': True,
        },
    )
    logger.info('Push device registered: %s (created=%s)', device.fcm_token[:20], created)
    return Response(PushDeviceSerializer(device).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unregister_push_device(request):
    fcm_token = request.data.get('fcm_token')
    if not fcm_token:
        return Response({'error_code': 'MISSING_PARAM', 'message': 'fcm_token required.'}, status=status.HTTP_400_BAD_REQUEST)
    deleted, _ = PushDevice.objects.filter(fcm_token=fcm_token, user=request.user).delete()
    return Response({'message': f'{deleted} device(s) unregistered.'})
