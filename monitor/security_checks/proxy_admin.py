from typing import Tuple, Optional, List
from web3 import Web3
from monitor.utils.web3_helpers import is_eoa, get_proxy_admin, get_multisig_threshold, is_timelock
from monitor.constants import ONE_DAY


def check_proxy_admin_risk(w3: Web3, contract_address: str) -> Tuple[bool, Optional[str]]:
    """
    Returns (has_risk, risk_note)
    """
    proxy_admin = get_proxy_admin(w3, contract_address)
    if not proxy_admin:
        return False, None
    
    # Check if admin is EOA
    if is_eoa(w3, proxy_admin):
        return True, f"Proxy admin is EOA: {proxy_admin}"

    # If multisig, check if threshold and/or owners > 1
    threshold, owners = get_multisig_threshold(w3, proxy_admin)
    if threshold == 1 or (owners and len(owners) == 1):
        return True, "Proxy admin multisig has threshold=1 (single signer) or only one owner"

    # If timelock, check if delay is >= 1 day
    is_tl, delay = is_timelock(w3, proxy_admin)
    if is_tl and delay < ONE_DAY:
        return True, f"Proxy admin is timelock but minDelay={delay}s (< 24h)."

    return False, None