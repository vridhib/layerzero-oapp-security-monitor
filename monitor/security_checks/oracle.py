import time
from typing import Tuple, Optional
from web3 import Web3
from monitor.constants import AGGREGATOR_V3_ABI, ONE_HOUR

def check_oracle_staleness(w3: Web3, contract_object) -> Tuple[bool, Optional[str]]:
    """Check if any price feed oracle in the contract is stale (>1 hour).

    Args:
        w3: Web3 instance.
        contract_object: Web3 contract instance (already created).

    Returns:
        (has_risk, risk_note). If no risk, risk_note is None.
    """
    for fn_name in ['priceFeed', 'oracle', 'getPriceFeed']:
        if hasattr(contract_object.functions, fn_name):
            try:
                feed_addr = getattr(contract_object.functions, fn_name)().call()
                if feed_addr and feed_addr.startswith('0x'):
                    feed_contract = w3.eth.contract(
                        address=Web3.to_checksum_address(feed_addr),
                        abi=AGGREGATOR_V3_ABI
                    )
                    _, _, _, updated_at, _ = feed_contract.functions.latestRoundData().call()

                    if time.time() - updated_at > ONE_HOUR:
                        return True, f"Oracle {feed_addr} stale (updated {updated_at})"
            except Exception:
                continue
    
    return False, None