from pathlib import Path
from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import path, include, re_path
from django.views.static import serve


def serve_react_spa(request, path=""):
    """Serves the built React frontend or static assets."""
    dist_dir = settings.FRONTEND_DIST_DIR
    target_file = dist_dir / path if path else None

    # Serve asset/image/sound files directly if they exist in dist
    if target_file and target_file.is_file():
        return FileResponse(open(target_file, 'rb'))

    # Serve React SPA index.html for client-side routing
    index_path = dist_dir / 'index.html'
    if index_path.exists():
        return FileResponse(open(index_path, 'rb'), content_type='text/html')

    return HttpResponse(
        '<h2>PulseDraw Backend API is running!</h2><p>Vite frontend build was not found. If running locally, visit <a href="http://localhost:5173">http://localhost:5173</a>.</p>',
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
    re_path(r'^(?P<path>.*)$', serve_react_spa),
]
