import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        response.data = {
            'error_code': getattr(exc, 'error_code', 'ERR_UNKNOWN'),
            'message': response.data.get('detail', str(exc)),
            'errors': response.data,
        }
    return response
