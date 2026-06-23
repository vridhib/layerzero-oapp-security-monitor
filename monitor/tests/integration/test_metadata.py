from unittest.mock import patch, Mock
from django.test import TestCase
from django.core.cache import cache
from monitor.utils.metadata import fetch_layerzero_metadata, get_dvn_provider_name

class MetadataIntegrationTest(TestCase):
    def setUp(self):
        cache.clear()

    @patch('monitor.utils.metadata.requests.get')
    def test_fetch_and_filter_metadata(self, mock_get):
        mock_response = Mock()
        mock_response.json.return_value = {
            "ethereum": {
                "environment": "mainnet", 
                "dvns": {
                    "0x1234567890123456789012345678901234567890": {
                        "canonicalName": "Google"
                    }
                }
            },
            "rinkeby": {
                "environment": "testnet", 
                "dvns": {}
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = fetch_layerzero_metadata()
        self.assertIn("ethereum", result)
        self.assertNotIn("rinkeby", result)
        self.assertEqual(result["ethereum"]["dvns"]["0x1234567890123456789012345678901234567890"]["canonicalName"], "Google")


    @patch('monitor.utils.metadata.fetch_layerzero_metadata')
    def test_get_dvn_provider_name_returns_correct_name(self, mock_fetch):
        mock_fetch.return_value = {
            "ethereum": {"dvns": {"0x1234567890123456789012345678901234567890": {"canonicalName": "Chainlink"}}}
        }
        provider = get_dvn_provider_name("0x1234567890123456789012345678901234567890", chain="ethereum")
        self.assertEqual(provider, "Chainlink")


    @patch('monitor.utils.metadata.requests.get')
    def test_cache_is_used_on_second_call(self, mock_get):
        # First call should hit the network mock
        mock_get.return_value.json.return_value = {"ethereum": {"environment": "mainnet"}}
        first_result = fetch_layerzero_metadata()
        self.assertEqual(mock_get.call_count, 1)

        # Second call should use cache, not call requests.get again
        second_result = fetch_layerzero_metadata()
        self.assertEqual(mock_get.call_count, 1)   # still 1
        self.assertEqual(first_result, second_result)