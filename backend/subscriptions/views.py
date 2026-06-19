import logging
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from monitoring.models import Device
from .models import Service, DeviceSubscription, Payment, PaymentItem
from .serializers import (
    ServiceSerializer,
    CreatePaymentSerializer,
    ConfirmPaymentSerializer,
    PaymentSerializer,
    DeviceSubscriptionSerializer,
)

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_list(request):
    services = Service.objects.filter(is_active=True)
    serializer = ServiceSerializer(services, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    serializer = CreatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    network = serializer.validated_data['network']
    items_data = serializer.validated_data['items']

    total = Decimal('0.00')
    payment_items = []

    for item_data in items_data:
        device = Device.objects.get(id=item_data['device_id'])
        service = Service.objects.get(id=item_data['service_id'])
        duration = item_data['duration_days']
        price = service.monthly_price * (Decimal(str(duration)) / Decimal('30'))
        price = price.quantize(Decimal('0.01'))
        total += price
        payment_items.append({
            'device': device,
            'service': service,
            'amount': price,
            'duration_days': duration,
        })

    payment = Payment.objects.create(
        user=request.user,
        amount=total,
        network=network,
    )

    for pi in payment_items:
        PaymentItem.objects.create(
            payment=payment,
            device=pi['device'],
            service=pi['service'],
            amount=pi['amount'],
            duration_days=pi['duration_days'],
        )

    logger.info('Payment created: %s amount=%s network=%s', payment.invoice_reference, total, network)

    return Response({
        'payment_id': payment.id,
        'reference': payment.invoice_reference,
        'amount': float(total),
        'network': network,
        'status': payment.status,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    serializer = ConfirmPaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    payment_id = serializer.validated_data['payment_id']
    transaction_ref = serializer.validated_data['transaction_reference']

    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
    except Payment.DoesNotExist:
        return Response(
            {'error_code': 'NOT_FOUND', 'message': 'Paiement introuvable.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if payment.status != Payment.Status.PENDING:
        return Response(
            {'error_code': 'INVALID_STATE', 'message': f'Ce paiement est déjà {payment.status}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    payment.status = Payment.Status.CONFIRMED
    payment.transaction_reference = transaction_ref
    payment.confirmed_at = timezone.now()
    payment.save(update_fields=['status', 'transaction_reference', 'confirmed_at'])

    items = PaymentItem.objects.filter(payment=payment)
    for item in items:
        existing = DeviceSubscription.objects.filter(
            device=item.device,
            service=item.service,
        ).first()

        if existing:
            if existing.status == DeviceSubscription.Status.ACTIVE and existing.expiry_date > timezone.now():
                new_expiry = existing.expiry_date + timezone.timedelta(days=item.duration_days)
            else:
                new_expiry = timezone.now() + timezone.timedelta(days=item.duration_days)
            existing.expiry_date = new_expiry
            existing.status = DeviceSubscription.Status.ACTIVE
            existing.save(update_fields=['expiry_date', 'status', 'updated_at'])
        else:
            DeviceSubscription.objects.create(
                device=item.device,
                service=item.service,
                start_date=timezone.now(),
                expiry_date=timezone.now() + timezone.timedelta(days=item.duration_days),
                status=DeviceSubscription.Status.ACTIVE,
            )

        logger.info('Subscription activated: device=%s service=%s expires=%s',
                     item.device.phone_number, item.service.code, new_expiry if existing else
                     timezone.now() + timezone.timedelta(days=item.duration_days))

    return Response({
        'message': 'Paiement confirmé et abonnements activés.',
        'payment_id': payment.id,
        'reference': payment.invoice_reference,
        'status': payment.status,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_subscriptions(request):
    device_ids = Device.objects.filter(user=request.user).values_list('id', flat=True)
    subscriptions = DeviceSubscription.objects.filter(
        device_id__in=device_ids,
    ).select_related('device', 'service').order_by('-created_at')

    serializer = DeviceSubscriptionSerializer(subscriptions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_payments(request):
    payments = Payment.objects.filter(user=request.user).prefetch_related('items__device', 'items__service')
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)
