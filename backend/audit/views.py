import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from .models import AuditLog
from .serializers import AuditLogSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_audit_logs(request):
    limit = min(int(request.query_params.get('limit', 100)), 500)

    if request.user.is_staff:
        logs = AuditLog.objects.all()[:limit]
    else:
        logs = AuditLog.objects.filter(user=request.user)[:limit]

    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_log_detail(request, log_id):
    log = AuditLog.objects.filter(id=log_id).first()
    if not log:
        return Response({'error_code': 'NOT_FOUND', 'message': 'Audit log not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not request.user.is_staff and log.user != request.user:
        return Response({'error_code': 'FORBIDDEN', 'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
    return Response(AuditLogSerializer(log).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_audit_logs(request):
    action = request.query_params.get('action')
    resource_type = request.query_params.get('resource_type')
    user_id = request.query_params.get('user_id')
    limit = min(int(request.query_params.get('limit', 200)), 1000)

    qs = AuditLog.objects.all()
    if action:
        qs = qs.filter(action=action)
    if resource_type:
        qs = qs.filter(resource_type=resource_type)
    if user_id:
        qs = qs.filter(user_id=user_id)

    logs = qs[:limit]
    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data)
