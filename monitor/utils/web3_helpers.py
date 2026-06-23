from web3 import Web3
from monitor.constants import GNOSIS_SAFE_ABI, TIMELOCK_ABI
from typing import Optional, Tuple, List

def is_eoa(w3: Web3, address: str) -> bool:
    """Check if an address is an externally owned account (not a contract).

    Args:
        w3: Web3 instance connected to a chain.
        address: Ethereum address (checksummed or not).

    Returns:
        True if the address has no code, False otherwise.
    """
    return w3.eth.get_code(Web3.to_checksum_address(address)) == b''


def get_proxy_admin(w3: Web3, contract_address: str) -> Optional[str]:
    """Get the admin address of an EIP-1967 proxy.

    Args:
        w3: Web3 instance.
        contract_address: Proxy contract address.

    Returns:
        Admin address as string, or None if no admin is set.
    """
    admin_slot = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
    admin_data = w3.eth.get_storage_at(contract_address, admin_slot)
    if admin_data == b'\x00' * 32:
        return None
    return "0x" + admin_data[-20:].hex()


def get_multisig_threshold(w3: Web3, address: str) -> Tuple[Optional[int], Optional[List[str]]]:
    """Get threshold and owners of a Gnosis Safe multisig.

    Args:
        w3: Web3 instance.
        address: Safe contract address.

    Returns:
        A tuple (threshold, owners). Both are None if address is not a Safe.
    """
    try:
        safe = w3.eth.contract(address=Web3.to_checksum_address(address), abi=GNOSIS_SAFE_ABI)
        threshold = safe.functions.getThreshold().call()
        owners = safe.functions.getOwners().call()
        return threshold, owners
    except Exception:
        return None, None
    

def is_timelock(w3: Web3, address: str) -> Tuple[bool, int]:
    """Check if an address is a timelock contract and get its minimum delay.

    Args:
        w3: Web3 instance.
        address: Contract address to check.

    Returns:
        (is_timelock, delay_in_seconds). If not a timelock, returns (False, 0).
    """
    try:
        timelock = w3.eth.contract(address=Web3.to_checksum_address(address), abi=TIMELOCK_ABI)
        delay = timelock.functions.minDelay().call()
        return True, delay
    except Exception:
        return False, 0