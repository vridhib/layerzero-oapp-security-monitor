from typing import Optional, Dict, Any
import requests
from django.core.cache import cache


METADATA_URL = "https://metadata.layerzero-api.com/v1/metadata"
CACHE_TIMEOUT = 86400 # 1 day


def fetch_layerzero_metadata() -> Optional[Dict[str, Any]]:
    """Fetch the full LayerZero metadata JSON, cached for 1 day.

    Returns:
        Dictionary of mainnet chain metadata, or None if fetch fails.
    """
    cached = cache.get('layerzero_metadata')
    if cached:
        return cached
    try:
        response = requests.get(METADATA_URL, timeout=10)
        response.raise_for_status()
        all_data = response.json()
        # Filter to keep only mainnet chains
        filtered = {
            chain_key: chain_data
            for chain_key, chain_data in all_data.items()
            if chain_data.get("environment") == "mainnet"
        }
        cache.set('layerzero_metadata', filtered, CACHE_TIMEOUT)
        return filtered
    except Exception as e:
        print(f"Failed to fetch metadata: {e}")
        return None


def get_dvn_provider_name(dvn_address: str, chain: str = "ethereum") -> Optional[str]:
    """Get canonical provider name for a DVN address on a specific chain.

    Args:
        dvn_address: DVN contract address (case-insensitive).
        chain: Metadata chain key (e.g., "ethereum", "arbitrum").

    Returns:
        Provider name string, or None if not found.
    """
    metadata = fetch_layerzero_metadata()
    if not metadata or chain not in metadata:
        return None
    dvns = metadata[chain].get("dvns", {})
    dvn_address_lower = dvn_address.lower()
    if dvn_address_lower in dvns:
        return dvns[dvn_address_lower].get("canonicalName")
    return None


def get_oapp_name(oapp_address: str, chain: str = "ethereum") -> Optional[str]:
    """Get canonical name of an OApp from LayerZero metadata.

    Args:
        oapp_address: OApp contract address.
        chain: Chain key.

    Returns:
        OApp name, or None if not found.
    """
    metadata = fetch_layerzero_metadata()
    if not metadata or chain not in metadata:
        return None
    address_to_oapp = metadata[chain].get("addressToOApp", {})
    oapp_address_lower = oapp_address.lower()
    if oapp_address_lower in address_to_oapp:
        return address_to_oapp[oapp_address_lower].get("canonicalName")
    return None


def get_core_contracts(chain: str = "ethereum") -> Dict[str, str]:
    """Get LayerZero core contract addresses (endpointV2, sendUln302, etc.) for a chain.

    Args:
        chain: Chain key.

    Returns:
        Dictionary mapping contract type to address. Missing keys are omitted.
    """
    metadata = fetch_layerzero_metadata()
    if not metadata or chain not in metadata:
        return {}
    deployments = metadata[chain].get("deployments", [])
    result = {}
    # List of needed contract keys (for V2)
    wanted_keys = ["endpointV2", "sendUln302", "receiveUln302", "executor", "lzExecutor"]
    for deployment in deployments:
        for key in wanted_keys:
            config = deployment.get(key)
            if isinstance(config, dict):
                address = config.get("address")
                if address: 
                    result[key] = address
    return result