from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'^ws/transactions/$', consumers.TransactionConsumer.as_asgi()),
    re_path(r'^ws/sms-feed/$', consumers.SmsFeedConsumer.as_asgi()),
]
