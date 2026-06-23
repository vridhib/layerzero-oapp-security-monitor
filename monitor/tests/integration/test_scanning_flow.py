from unittest.mock import Mock, patch
from django.test import TestCase
from monitor.services.scanning import ScanningService
from monitor.models import BridgeContract, DVNConfig


class ScanningFlowTest(TestCase):
    @patch('monitor.services.scanning.DVNConfigService')
    @patch('monitor.services.scanning.RiskAssessmentService')
    def test_scan_contract_full_flow(self, mock_risk_class, mock_dvn_class):
        # Create the mocked dependencies
        mock_dvn = Mock()
        mock_dvn.fetch_uln_config.return_value = (
            5, 2, 1, 2, ["0xa123456789012345678901234567890123456789"], ["0xb123456789012345678901234567890123456789"]
        )
        mock_dvn_class.return_value = mock_dvn

        # Mock RiskAssessmentService.assess return
        mock_risk = Mock()
        mock_risk.assess.return_value = (85, "B", True)
        mock_risk_class.return_value = mock_risk

        # Create the service
        mock_w3 = Mock()
        mock_endpoint = Mock()
        mock_endpoint.address = "0x1234567890123456789012345678901234567890"
        service = ScanningService(mock_w3, mock_endpoint, "ethereum")

        # Mock security checks
        with patch('monitor.services.scanning.check_proxy_admin_risk', return_value=(False, None)), \
             patch('monitor.services.scanning.check_oracle_staleness', return_value=(False, None)), \
             patch('monitor.services.scanning.check_owner_centralization', return_value=(False, None)), \
             patch('monitor.services.scanning.get_dvn_provider_name', return_value="Google"), \
             patch('monitor.services.scanning.DVNConfig.objects.update_or_create') as mock_update:
            
            # Create contract object
            mock_update.return_value = (Mock(spec=DVNConfig), True)
            contract = BridgeContract(address="0xabc4567890123456789012345678901234567890", chain="ethereum")
            result = service.scan_contract(contract, remote_eid=30101)

            self.assertIsNotNone(result)
            mock_update.assert_called_once()
            args, kwargs = mock_update.call_args
            self.assertEqual(kwargs['defaults']['risk_score'], 85)
            self.assertEqual(kwargs['defaults']['grade'], "B")
            self.assertTrue(kwargs['defaults']['is_healthy'])