from typing import Tuple, Optional
from web3 import Web3
from monitor.utils.web3_helpers import is_eoa

def check_owner_centralization(w3: Web3, contract_object) -> Tuple[bool, Optional[str]]:
    """Check if contract owner is an EOA (centralization risk).

    Args:
        w3: Web3 instance.
        contract_object: Web3 contract instance.

    Returns:
        (has_risk, risk_note). risk_note contains the owner address if risky.
    """
    try:
        owner = contract_object.functions.owner().call()
        if is_eoa(w3, owner):
            return True, f"Owner is EOA: {owner}"
    except Exception:
       pass
    
    return False, None

