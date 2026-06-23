from web3 import Web3
from monitor.services.dvn_config import DVNConfigService
from monitor.services.risk import RiskAssessmentService
from monitor.security_checks.proxy_admin import check_proxy_admin_risk
from monitor.security_checks.oracle import check_oracle_staleness
from monitor.security_checks.owner import check_owner_centralization
from monitor.utils.metadata import get_dvn_provider_name
from monitor.constants import EXPOSED_SUM_THRESHOLD, CONFIRMATION_RISK_THRESHOLD, ORACLE_ABI, OWNABLE_ABI
from monitor.models import BridgeContract, DVNConfig


class ScanningService:
    def __init__(self, w3, endpoint_contract, chain):
        self.w3 = w3
        self.endpoint = endpoint_contract
        self.chain = chain
        self.dvn_config_service = DVNConfigService(w3, endpoint_contract.address)
        self.risk_service = RiskAssessmentService()

    def scan_contract(self, contract: BridgeContract, remote_eid: int) -> DVNConfig:
        
        oapp_address = Web3.to_checksum_address(contract.address) 
        uln_data = self.dvn_config_service.fetch_uln_config(oapp_address, remote_eid)
        
        if uln_data is None:
            return None
        (confirmations, required_dvn_count, optional_dvn_threshold, optional_count, required_dvns, optional_dvns) = uln_data

        provider_map = lambda addr: get_dvn_provider_name(addr, self.chain)

        # Core risk assessment
        risk_score, grade, is_healthy = self.risk_service.assess(
            required_dvn_count, optional_dvn_threshold, confirmations, required_dvns, optional_dvns, provider_map
        )

        # Extra flags for DVN check
        is_exposed = (required_dvn_count + optional_dvn_threshold) <= EXPOSED_SUM_THRESHOLD
        provider_set = {provider_map(addr) for addr in required_dvns if provider_map(addr)}
        all_same_provider = len(provider_set) == 1 and provider_set != {None}
        has_low_confirmations = confirmations < CONFIRMATION_RISK_THRESHOLD

        # Create a web3 contract for the OApp with minimal ABIs
        oapp_contract = self.w3.eth.contract(
            address=oapp_address, abi=ORACLE_ABI + OWNABLE_ABI
        )

        # Additional security checks
        risk_notes = []

        proxy_admin_risk, note = check_proxy_admin_risk(self.w3, oapp_address)
        if proxy_admin_risk:
            risk_notes.append(note)

        oracle_stale_risk, note = check_oracle_staleness(self.w3, oapp_contract)
        if oracle_stale_risk:
            risk_notes.append(note)

        eoa_owner_risk, note = check_owner_centralization(self.w3, oapp_contract)
        if eoa_owner_risk:
            risk_notes.append(note)  

        # Save to DB
        dvn_config, _ = DVNConfig.objects.update_or_create(
            contract=contract,
            remote_eid=remote_eid,
            defaults={
                'required_dvn_count': required_dvn_count,
                'optional_dvn_threshold': optional_dvn_threshold,
                'optional_dvn_count': optional_count,
                'required_dvns': required_dvns,
                'optional_dvns': optional_dvns,
                'confirmations': confirmations,
                'is_exposed': is_exposed,
                'is_centralized': all_same_provider,
                'has_low_confirmations': has_low_confirmations,
                'has_proxy_admin_risk': proxy_admin_risk,
                'is_oracle_stale': oracle_stale_risk,
                'is_owner_eoa': eoa_owner_risk,
                'risk_notes': '\n'.join(risk_notes),
                'risk_score': risk_score,
                'grade': grade,
                'is_healthy': is_healthy,
            }
        )
        return dvn_config  
