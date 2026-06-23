from unittest.mock import Mock, patch
from django.test import TestCase
from monitor.utils.web3_helpers import is_eoa, get_proxy_admin, get_multisig_threshold, is_timelock


class Web3HelpersTest(TestCase):
    def setUp(self):
        self.mock_w3 = Mock()
        self.mock_contract = Mock()
        self.address = "0x1234567890123456789012345678901234567890"

    def test_is_eoa_returns_true_when_no_code(self):
        self.mock_w3.eth.get_code.return_value = b''
        result = is_eoa(self.mock_w3, self.address)
        self.assertTrue(result)

    def test_is_eoa_returns_false_when_code_exists(self):
        self.mock_w3.eth.get_code.return_value = b'\x60\x80'  # some bytecode
        result = is_eoa(self.mock_w3, self.address)
        self.assertFalse(result)

    def test_get_proxy_admin_returns_address_when_storage_not_empty(self):
        # Simulate storage slot containing an address (right‑padded, left‑aligned)
        # Admin slot data: 32 bytes with address at the end
        fake_storage = b'\x00' * 12 + b'\xab' * 20  # 12 zeros + 20 bytes of 0xab
        self.mock_w3.eth.get_storage_at.return_value = fake_storage
        result = get_proxy_admin(self.mock_w3, "0xcontract")
        expected = "0x" + (b'\xab' * 20).hex() # 0xab repeated 20 times
        self.assertEqual(result, expected)

    def test_get_proxy_admin_returns_none_when_storage_zero(self):
        self.mock_w3.eth.get_storage_at.return_value = b'\x00' * 32
        result = get_proxy_admin(self.mock_w3, "0xcontract")
        self.assertIsNone(result)

    @patch('monitor.utils.web3_helpers.GNOSIS_SAFE_ABI', [{}])
    def test_is_multisig_returns_threshold_and_owners(self):
        self.mock_contract.functions.getThreshold().call.return_value = 3
        self.mock_contract.functions.getOwners().call.return_value = 2
        self.mock_w3.eth.contract.return_value = self.mock_contract
        threshold, owners = get_multisig_threshold(self.mock_w3, self.address)
        self.assertEqual(threshold, 3)
        self.assertEqual(owners, 2)

    def test_get_multisig_threshold_returns_none_on_exception(self):
        # Contract call raises exception (e.g., not a Safe)
        self.mock_contract.functions.getThreshold().call.side_effect = Exception("not a safe")
        self.mock_w3.eth.contract.return_value = self.mock_contract
        threshold, owners = get_multisig_threshold(self.mock_w3, self.address)
        self.assertIsNone(threshold)
        self.assertIsNone(owners)

    @patch('monitor.utils.web3_helpers.TIMELOCK_ABI', [{}])
    def test_is_timelock_returns_true_and_delay(self):
        self.mock_contract.functions.minDelay().call.return_value = 3600
        self.mock_w3.eth.contract.return_value = self.mock_contract
        is_tl, delay = is_timelock(self.mock_w3, self.address)
        self.assertTrue(is_tl)
        self.assertEqual(delay, 3600)

    def test_is_timelock_returns_false_on_exception(self):
        self.mock_w3.eth.contract.side_effect = Exception("no contract")
        is_tl, delay = is_timelock(self.mock_w3, self.address)
        self.assertFalse(is_tl)
        self.assertEqual(delay, 0)