from django.utils.deprecation import MiddlewareMixin


class WhiteNoiseMiddleware(MiddlewareMixin):
    def __init__(self, get_response=None):
        super().__init__(get_response)

    def __call__(self, request):
        response = self.get_response(request)
        return response
