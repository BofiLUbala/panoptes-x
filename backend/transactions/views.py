from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import Transaction, FailedParse
from .serializers import (
    TransactionSerializer,
    TransactionSyncSerializer,
    FailedParseSerializer,
    FailedParseSyncSerializer,
)


class TransactionSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TransactionSyncSerializer(data=request.data)
        if serializer.is_valid():
            transactions_data = serializer.validated_data['transactions']
            transactions = []
            for t_data in transactions_data:
                t_data['user'] = request.user.id
                t_data['transaction_date'] = t_data.get('transaction_date', timezone.now())
                serializer_t = TransactionSerializer(data=t_data)
                if serializer_t.is_valid():
                    serializer_t.save(user=request.user)
                    transactions.append(serializer_t.data)
            return Response({'synced': len(transactions)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)[:100]
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class FailedParseSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FailedParseSyncSerializer(data=request.data)
        if serializer.is_valid():
            failed_parses = []
            for fp_data in serializer.validated_data['failed_parses']:
                serializer_fp = FailedParseSerializer(data=fp_data)
                if serializer_fp.is_valid():
                    serializer_fp.save(user=request.user)
                    failed_parses.append(serializer_fp.data)
            return Response({'synced': len(failed_parses)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        transactions_today = Transaction.objects.filter(
            user=user,
            transaction_date__date=today,
        )

        total_transactions = transactions_today.count()
        total_commission = transactions_today.aggregate(
            total=Sum('commission')
        )['total'] or 0

        data_transactions = transactions_today.filter(type=Transaction.TransactionType.BUNDLE)
        total_volume = data_transactions.aggregate(
            total=Sum('volume')
        )['total'] or 0

        transactions_by_type = (
            transactions_today
            .values('type')
            .annotate(count=Count('id'))
        )
        by_type_dict = {item['type']: item['count'] for item in transactions_by_type}

        return Response({
            'total_transactions': total_transactions,
            'total_commission': total_commission,
            'total_volume_sold': total_volume,
            'transactions_by_type': by_type_dict,
        })
