from unittest.mock import Mock, patch
from django.test import TestCase
from monitor.security_checks.owner import check_owner_centralization
from monitor.security_checks.proxy_admin import check_proxy_admin_risk
from monitor.security_checks.oracle import check_oracle_staleness


class CheckOwnerTest(TestCase):
    def setUp(self):
        self.mock_w3 = Mock()
        self.mock_contract = Mock()

    def test_returns_risk_when_owner_is_eoa(self):
        self.mock_contract.functions.owner().call.return_value = "0x1234567890123456789012345678901234567890"
        # Mock is_eoa to return True
        with patch('monitor.security_checks.owner.is_eoa', return_value=True):
            has_risk, note = check_owner_centralization(self.mock_w3, self.mock_contract)
            self.assertTrue(has_risk)
            self.assertIn("Owner is EOA: 0x1234567890123456789012345678901234567890", note)

    def test_returns_no_risk_when_owner_is_multisig(self):
        self.mock_contract.functions.owner().call.return_value = "0xMultisig"
        with patch('monitor.security_checks.owner.is_eoa', return_value=False):
            has_risk, note = check_owner_centralization(self.mock_w3, self.mock_contract)
            self.assertFalse(has_risk)
            self.assertIsNone(note)

    def test_handles_exception_gracefully(self):
        self.mock_contract.functions.owner().call.side_effect = Exception("No owner function")
        has_risk, note = check_owner_centralization(self.mock_w3, self.mock_contract)
        self.assertFalse(has_risk)
        self.assertIsNone(note)


class ProxyAdminCheckTest(TestCase):
    def setUp(self):
        self.mock_w3 = Mock()

    @patch('monitor.security_checks.proxy_admin.get_proxy_admin')
    def test_returns_risk_when_admin_is_eoa(self, mock_get_admin):
        mock_get_admin.return_value = "0xadmin"
        with patch('monitor.security_checks.proxy_admin.is_eoa', return_value=True):
            has_risk, note = check_proxy_admin_risk(self.mock_w3, "0xcontract")
            self.assertTrue(has_risk)
            self.assertIn("Proxy admin is EOA", note)

    @patch('monitor.security_checks.proxy_admin.get_proxy_admin')
    def test_no_risk_when_no_proxy_admin(self, mock_get_admin):
        mock_get_admin.return_value = None
        has_risk, note = check_proxy_admin_risk(self.mock_w3, "0xcontract")
        self.assertFalse(has_risk)
        self.assertIsNone(note)


class OracleCheckTest(TestCase):
    def setUp(self):
        self.mock_w3 = Mock()
        self.mock_contract = Mock()
        self.mock_func = Mock()
        self.mock_feed_contract = Mock()
        self.mock_func_call_return_val = "0x1234567890123456789012345678901234567890"

    def test_returns_risk_when_oracle_stale(self):
        # Mock the existence of priceFeed function
        self.mock_func().call.return_value = self.mock_func_call_return_val
        self.mock_contract.functions.priceFeed = self.mock_func
        self.mock_feed_contract.functions.latestRoundData().call.return_value = (0, 0, 0, 100, 0)  # updated_at = 100 (old)
        self.mock_w3.eth.contract.return_value = self.mock_feed_contract
        with patch('time.time', return_value=10000): # current time is far ahead
            has_risk, note = check_oracle_staleness(self.mock_w3, self.mock_contract)
            self.assertTrue(has_risk)
            self.assertIn("stale", note)

    def test_no_risk_when_oracle_fresh(self):
        self.mock_func().call.return_value = self.mock_func_call_return_val
        self.mock_contract.functions.oracle = self.mock_func
        self.mock_feed_contract.functions.latestRoundData().call.return_value = (0, 0, 0, 9999, 0)
        self.mock_w3.eth.contract.return_value = self.mock_feed_contract
        with patch('time.time', return_value=10000):  # updated_at 9999 is 1 second ago, within ONE_HOUR
            has_risk, note = check_oracle_staleness(self.mock_w3, self.mock_contract)
            self.assertFalse(has_risk)
            self.assertIsNone(note)
