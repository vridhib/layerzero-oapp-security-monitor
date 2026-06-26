from rest_framework import serializers
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from .models import BridgeContract, DVNConfig, MonitoredOApp, UserAlertChannel, Report
from .utils.validation import validate_ethereum_address


class BridgeContractSerializer(serializers.ModelSerializer):
    # Remove default validators to use custom validation
    address = serializers.CharField(validators=[])

    class Meta:
        model = BridgeContract
        fields = ['id', 'address', 'chain', 'name', 'source', 'created_at']
        read_only_fields = ['id', 'created_at', 'source']

    def validate_address(self, value):
        # Validate format and normalize
        normalized = validate_ethereum_address(value)
        # Check for duplicates
        if BridgeContract.objects.filter(address=normalized).exists():
            raise serializers.ValidationError(
                'This OApp address is already in the database and will be scanned automatically.'
            )
        return normalized
        

class DVNConfigSerializer(serializers.ModelSerializer):
    contract_address = serializers.CharField(source='contract.address', read_only=True)
    contract_name = serializers.CharField(source='contract.name', read_only=True)
    contract_chain = serializers.CharField(source='contract.chain', read_only=True)
    
    class Meta:
        model = DVNConfig
        fields = '__all__'
        depth = 0


class MonitoredOappSerializer(serializers.ModelSerializer):
    # Define writeable fields for creation
    address = serializers.CharField(write_only=True, required=True)
    chain = serializers.CharField(write_only=True, required=True)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True, default="")

    # Read-only fields for the response
    contract_address = serializers.CharField(source='contract.address', read_only=True)
    contract_chain = serializers.CharField(source='contract.chain', read_only=True)
    contract_name = serializers.CharField(source='contract.name', read_only=True)
    latest_is_healthy = serializers.BooleanField(read_only=True)
    latest_risk_score = serializers.IntegerField(read_only=True)
    latest_grade = serializers.CharField(read_only=True)
    latest_remote_eid = serializers.IntegerField(read_only=True)

    class Meta:
        model = MonitoredOApp
        fields = [
            'id', 'address', 'chain', 'name',
            'contract_address', 'contract_chain', 'contract_name', 
            'added_at', 'latest_is_healthy', 'latest_risk_score', 'latest_grade', 'latest_remote_eid'
        ]
        read_only_fields = ['id', 'added_at']

    # Handle formatting/validation before create()
    def validate_address(self, value):
        try:
            return validate_ethereum_address(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))

    # Create the record 
    def create(self, validated_data):
        # Extract the fields
        address = validated_data.pop('address')
        chain = validated_data.pop('chain')
        name = validated_data.pop('name', '')
        
        # Get or create the contract
        contract, _ = BridgeContract.objects.get_or_create(
            address=address,
            defaults={'chain': chain, 'name': name, 'source': 'user'}
        )

        # Get user from context passed by view
        user = self.context['request'].user

        # Check for UniqueConstraint violation cleanly
        if MonitoredOApp.objects.filter(user=user, contract=contract).exists():
            raise serializers.ValidationError({
                "non_field_errors": ["This OApp is already in your monitored list."]
            })

        try:
            return MonitoredOApp.objects.create(user=user, contract=contract)
        except IntegrityError:
            raise serializers.ValidationError({
                "non_field_errors": ["This OApp is already in your monitored list."]
            })

    
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

