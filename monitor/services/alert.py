import requests
import logging
from monitor.models import BridgeContract, MonitoredOApp, UserAlertChannel

class AlertService:
    """Send alerts to users who monitor a specific contract."""

    def send_alerts_for_contract(
        self,
        contract: BridgeContract,
        required_dvn_count: int,
        remote_eid: int,
        risk_score: int,
        grade: str
    ) -> None:
        """Send alerts to all users monitoring a contract.

        Args:
            contract: The scanned BridgeContract instance.
            required_dvn_count: Number of required DVNs (included in alert).
            remote_eid: Remote endpoint ID.
            risk_score: Computed risk score.
            grade: Risk grade (A-F).
        """
        monitored_entries = MonitoredOApp.objects.filter(contract=contract).select_related('user')
        for entry in monitored_entries:
            channels = UserAlertChannel.objects.filter(user=entry.user)
            for channel in channels:
                self._send_to_channel(channel, contract, required_dvn_count, remote_eid, risk_score, grade)


    def _send_to_channel(
        self,
        channel: UserAlertChannel,
        contract: BridgeContract,
        required_dvn_count: int,
        remote_eid: int,
        risk_score: int,
        grade: str
    ) -> None:
        """Dispatch alert to a specific channel type."""
        if channel.channel_type == 'discord':
            self._send_discord(channel.identifier, contract, required_dvn_count, remote_eid, risk_score, grade)
        # Add in future: email, telegram, slack


    def _send_discord(
        self,
        webhook_url: str,
        contract: BridgeContract,
        required_dvn_count: int,
        remote_eid: int,
        risk_score: int,
        grade: str
    ) -> None:
        """Send a Discord webhook alert."""
        try:
            requests.post(webhook_url, json={
                "content": (
                    f"**ALERT: Risky DVN Configuration**\n"
                    f"Contract: {contract.address}\n"
                    f"Chain: {contract.chain}\n"
                    f"Remote EID: {remote_eid}\n"
                    f"Required DVN count: {required_dvn_count}\n"
                    f"Risk Score: {risk_score} | Grade: {grade}\n"
                    f"Action: Investigate"
                )
            }, timeout=5)
        except requests.RequestException as e:
            logging.error(f"Failed to send Discord alert to {webhook_url}: {e}")