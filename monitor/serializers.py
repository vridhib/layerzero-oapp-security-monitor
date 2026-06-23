from rest_framework import serializers
from .models import BridgeContract, DVNConfig, MonitoredOApp, UserAlertChannel, Report


class BridgeContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = BridgeContract
        fields = '__all__'
        read_only_fields = ['created_at', 'source']


class DVNConfigSerializer(serializers.ModelSerializer):
    contract_address = serializers.CharField(source='contract.address', read_only=True)
    contract_name = serializers.CharField(source='contract.name', read_only=True)
    contract_chain = serializers.CharField(source='contract.chain', read_only=True)
    
    class Meta:
        model = DVNConfig
        fields = '__all__'
        depth = 0


class MonitoredOappSerializer(serializers.ModelSerializer):
    contract_address = serializers.CharField(source='contract.address', read_only=True)
    contract_chain = serializers.CharField(source='contract.chain', read_only=True)
    contract_name = serializers.CharField(source='contract.name', read_only=True)
    latest_is_healthy = serializers.BooleanField(read_only=True)
    latest_risk_score = serializers.IntegerField(read_only=True)
    latest_grade = serializers.CharField(read_only=True)
    latest_remote_eid = serializers.IntegerField(read_only=True)

    class Meta:
        model = MonitoredOApp
        fields = ['id', 'contract_address', 'contract_chain', 'contract_name', 'added_at', 'latest_is_healthy', 'latest_risk_score', 'latest_grade', 'latest_remote_eid']
        read_only_fields = ['id', 'added_at']

    def create(self, validated_data):
        # Ensure the BridgeContract record exists (or create if not)
        request = self.context['request']
        address = request.data.get('address')
        chain = request.data.get('chain')
        name = request.data.get('name', '')
        if not address or not chain:
            raise serializers.ValidationError("address and chain are required")
        contract, _ = BridgeContract.objects.get_or_create(
            address=address.lower(),
            defaults={
                'chain': chain, 
                'name': name,
                'source': 'user'
            }
        )
        return MonitoredOApp.objects.create(user=request.user, contract=contract)
    

class UserAlertChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAlertChannel
        fields = ['id', 'channel_type', 'identifier', 'is_verified', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'generated_at', 'summary', 'data', 'html_content', 'pdf_file', 'pdf_url']
        read_only_fields = fields

    def get_pdf_url(self, obj):
        request = self.context.get('request')
        if obj.pdf_file and hasattr(obj.pdf_file, 'url'):
            return request.build_absolute_uri(obj.pdf_file.url) if request else obj.pdf_file.url
        return None

