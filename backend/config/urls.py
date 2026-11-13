from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import path, include, re_path
from django.views.static import serve


def serve_react_spa(request):
    """Serves the built React frontend index.html at http://127.0.0.1:8000/."""
    index_path = settings.FRONTEND_DIST_DIR / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'), content_type='text/html')
    return HttpResponse(
        '<h2>PulseDraw API is running.</h2><p>Visit <a href="http://localhost:5173">http://localhost:5173</a> for the frontend.</p>',
        content_type='text/html',
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    re_path(
        r'^assets/(?P<path>.*)$',
        serve,
        {'document_root': settings.FRONTEND_DIST_DIR / 'assets'},
    ),
    re_path(r'^(?!api/|admin/|assets/).*$', serve_react_spa),
]
