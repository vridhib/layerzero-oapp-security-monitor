from django.db import models
from django.conf import settings


class BridgeContract(models.Model):
    SOURCE_CHOICES = {
        ('metadata', 'LayerZero Metadata'),
        ('user', 'User Submitted'),
        ('admin', 'Admin Added')
    }
    address = models.CharField(max_length=100, unique=True)
    chain = models.CharField(max_length=20)
    name = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='metadata')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name or self.address[:10]} on {self.chain} ({self.source})"
    
    
class DVNConfig(models.Model):
    contract = models.ForeignKey(BridgeContract, on_delete=models.CASCADE)
    remote_eid = models.IntegerField()
    required_dvn_count = models.IntegerField()
    optional_dvn_threshold = models.IntegerField(default=0)
    optional_dvn_count = models.IntegerField(default=0)
    required_dvns = models.JSONField(default=list)   # list of addresses
    optional_dvns = models.JSONField(default=list)   # list of addresses
    confirmations = models.IntegerField(default=0)
    is_exposed = models.BooleanField(default=True)
    is_centralized = models.BooleanField(default=True)
    has_low_confirmations = models.BooleanField(default=True)
    has_proxy_admin_risk = models.BooleanField(default=False)
    is_oracle_stale = models.BooleanField(default=False)
    is_owner_eoa = models.BooleanField(default=False)
    risk_notes = models.TextField(blank=True)
    risk_score = models.IntegerField(default=0)
    grade = models.CharField(max_length=1, blank=True)
    is_healthy = models.BooleanField(default=False)
    detected_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-detected_at']
        constraints = [
            models.UniqueConstraint(fields=['contract', 'remote_eid'], name='unique_contract_remote_eid')
        ]


class MonitoredOApp(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='monitored_oapps')
    contract = models.ForeignKey('BridgeContract', on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'contract'], name='unique_user_contract')
        ]


class UserAlertChannel(models.Model):
    CHANNEL_TYPES = {
        ('discord', 'Discord Webhook'),
        ('email', 'Email')
    }
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alert_channels')
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPES)
    identifier = models.CharField(max_length=200) # webhook URL, etc.
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Report(models.Model):
    generated_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)        # for JSON reports
    html_content = models.TextField(blank=True)           # for HTML
    pdf_file = models.FileField(upload_to='reports/pdfs/', blank=True, null=True) # for PDF
    summary = models.JSONField(default=dict)              # quick summary for listing

    def __str__(self):
        return f"Report {self.id} at {self.generated_at}"