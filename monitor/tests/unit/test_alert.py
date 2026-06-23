from unittest.mock import patch, Mock
import requests
from django.test import TestCase
from monitor.services.alert import AlertService
from monitor.models import BridgeContract, UserAlertChannel

class AlertServiceTest(TestCase):
    def setUp(self):
        self.service = AlertService()
        self.mock_contract = Mock(spec=BridgeContract)
        self.mock_contract.address = "0xabc"
        self.mock_contract.chain = "ethereum"


    @patch('monitor.services.alert.requests.post')
    @patch('monitor.services.alert.MonitoredOApp.objects.filter')
    def test_send_alerts_for_contract_calls_discord_for_each_channel(self, mock_filter, mock_post):
        # Setup mock monitored entries
        mock_user1 = Mock()
        mock_user2 = Mock()
        mock_entry1 = Mock()
        mock_entry1.user = mock_user1
        mock_entry2 = Mock()
        mock_entry2.user = mock_user2
        mock_filter.return_value.select_related.return_value = [mock_entry1, mock_entry2]

        # Mock UserAlertChannel objects for each user
        mock_channel1 = Mock(spec=UserAlertChannel)
        mock_channel1.channel_type = 'discord'
        mock_channel1.identifier = "https://discord.com/webhook/1"
        mock_channel2 = Mock(spec=UserAlertChannel)
        mock_channel2.channel_type = 'discord'
        mock_channel2.identifier = "https://discord.com/webhook/2"

        # Patch the channel query
        with patch('monitor.services.alert.UserAlertChannel.objects.filter') as mock_channel_filter:
            mock_channel_filter.return_value = [mock_channel1, mock_channel2]
            self.service.send_alerts_for_contract(
                self.mock_contract,
                required_dvn_count=1,
                remote_eid=30101,
                risk_score=20,
                grade="D"
            )

        # Two users, two channels each
        self.assertEqual(mock_post.call_count, 4)
        called_urls = [call[0][0] for call in mock_post.call_args_list]
        self.assertEqual(called_urls.count("https://discord.com/webhook/1"), 2)
        self.assertEqual(called_urls.count("https://discord.com/webhook/2"), 2)
        first_call_kwargs = mock_post.call_args_list[0][1]
        self.assertIn("ALERT", first_call_kwargs['json']["content"])


    @patch('monitor.services.alert.requests.post')
    def test_send_discord_handles_network_error(self, mock_post):
        mock_post.side_effect = requests.RequestException()
        # Should not raise exception
        self.service._send_discord(
            "https://webhook", self.mock_contract, 1, 30101, 20, "D"
        )
        self.assertTrue(True)


    def test_send_to_channel_ignores_unsupported_channel_type(self):
        mock_channel = Mock(spec=UserAlertChannel)
        mock_channel.channel_type = 'email'
        # Should not call _send_discord (no error)
        with patch.object(self.service, '_send_discord') as mock_send:
            self.service._send_to_channel(mock_channel, self.mock_contract, 1, 30101, 20, "D")
            mock_send.assert_not_called()