from eth_abi import decode
from web3 import Web3
from monitor.constants import ZERO_ADDRESS, ULN_CONFIG_TYPE, ENDPOINT_V2_ABI


class DVNConfigService:
    def __init__(self, w3: Web3, endpoint_address: str):
        self.w3 = w3
        self.endpoint = w3.eth.contract(
            address=Web3.to_checksum_address(endpoint_address),
            abi=ENDPOINT_V2_ABI
        )
    
    def fetch_uln_config(self, oapp_address: str, remote_eid: int) -> tuple | None:
        """
        Fetch ULN configuration from the LayerZero endpoint.

        Args:
            oapp_address: Checksummed address of the OApp.
            remote_eid: LayerZero endpoint ID of the destination chain.

        Returns:
            A tuple of (confirmations, required_dvn_count, optional_threshold, 
            optional_count, required_dvns, optional_dvns), or None if no receive 
            library is configured.
        """
        checksummed_address = Web3.to_checksum_address(oapp_address)

        recv_lib = self.endpoint.functions.getReceiveLibrary(checksummed_address, remote_eid).call() 
        if recv_lib == ZERO_ADDRESS:
            return None
        config_bytes = self.endpoint.functions.getConfig(
            checksummed_address, recv_lib, remote_eid, ULN_CONFIG_TYPE
        ).call()
        decoded = decode(['(uint64,uint8,uint8,uint8,address[],address[])'], config_bytes)[0]
        return decoded 