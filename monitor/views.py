from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django_ratelimit.decorators import ratelimit
from django.db.models import OuterRef, Subquery
from .models import BridgeContract, DVNConfig, MonitoredOApp, UserAlertChannel, Report
from .serializers import BridgeContractSerializer, DVNConfigSerializer, MonitoredOappSerializer, UserAlertChannelSerializer, ReportSerializer


class BridgeContractViewSet(viewsets.ModelViewSet):
    queryset = BridgeContract.objects.all()
    serializer_class = BridgeContractSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['chain', 'source']


class DVNConfigViewSet(viewsets.ModelViewSet):
    queryset = DVNConfig.objects.select_related('contract').all()
    serializer_class = DVNConfigSerializer
    http_method_names = ['get']
    filterset_fields = ['contract__chain', 'is_healthy', 'risk_score']
    search_fields = ['contract__address', 'contract__name']
    ordering_fields = ['detected_at', 'risk_score']


class MonitoredOAppViewSet(viewsets.ModelViewSet):
    serializer_class = MonitoredOappSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        latest_config = DVNConfig.objects.filter(
            contract=OuterRef('contract')
        ).order_by('-detected_at').values(
            'is_healthy', 
            'risk_score', 
            'grade',
            'remote_eid'
        )[:1]
        return MonitoredOApp.objects.filter(
            user=self.request.user
        ).select_related('contract').annotate(
            latest_is_healthy=Subquery(latest_config.values('is_healthy')),
            latest_risk_score=Subquery(latest_config.values('risk_score')),
            latest_grade=Subquery(latest_config.values('grade')),
            latest_remote_eid=Subquery(latest_config.values('remote_eid'))
        )
    
    def create(self, request, *args, **kwargs):
        # Custom create to handle BridgeContract creation
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    

class UserAlertChannelViewSet(viewsets.ModelViewSet):
    serializer_class = UserAlertChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAlertChannel.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReportViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = ReportSerializer
    queryset = Report.objects.all().order_by('-generated_at')


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='10/h', method='POST')
def public_add_oapp(request):
    if getattr(request, 'limited', False):
        return Response(
            {'error': 'Too many submissions from this IP. Try again later'}, 
            status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    serializer = BridgeContractSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(source='user')
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)