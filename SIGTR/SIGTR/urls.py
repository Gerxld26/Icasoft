from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

urlpatterns = [
    path('', include('users.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('tickets/', include('tickets.urls')),  
    re_path(r'^dashboard/media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)