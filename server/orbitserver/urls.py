from django.contrib import admin
from django.urls import include, path

from rest_framework import routers

from todos import views

router = routers.DefaultRouter(trailing_slash=False)
router.register(r'todos', views.TodoViewSet)
# router.register(r'utodos/(?P<uuid>[0-9A-Fa-f-]+)/$', views.TodoUuidViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('admin/', admin.site.urls),
    path('api-auth/', include(
        'rest_framework.urls', namespace='rest_framework'))
]
