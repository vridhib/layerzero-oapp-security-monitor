from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register(r'bridge-contracts', views.BridgeContractViewSet)
router.register(r'dvn-configs', views.DVNConfigViewSet)
router.register(r'monitored-oapps', views.MonitoredOAppViewSet, basename='monitored-oapps')
router.register(r'alert-channels', views.UserAlertChannelViewSet, basename='alert-channels')
router.register(r'security-reports', views.ReportViewSet, basename='security-reports')

urlpatterns = [
    path('public/add-oapp/', views.public_add_oapp, name='public-add-oapp'),
    path('', include(router.urls))
]