import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agenttrack.settings')

app = Celery('agenttrack')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
