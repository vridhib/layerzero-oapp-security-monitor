import logging
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from web3 import Web3
from monitor.models import BridgeContract, Report
from monitor.services.scanning import ScanningService
from monitor.services.report import ReportService
from monitor.services.alert import AlertService
from monitor.utils.metadata import get_core_contracts, get_oapp_name
from monitor.constants import ENDPOINT_V2_ABI, CHAIN_CONFIG, DEFAULT_REMOTE_EID, ARBITRUM_EID


logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Scan LayerZero OApps for DVN configuration and other security check'

    def add_arguments(self, parser):
        parser.add_argument('--chain', type=str, default=None, help='Scan only this chain (default: scan all chains from CHAIN_CONFIG)')


    def handle(self, *args, **options):
        chain_override = options.get('chain')
        chains_to_scan = [chain_override] if chain_override in CHAIN_CONFIG else list(CHAIN_CONFIG.keys())

        total_scanned = 0
        for chain in chains_to_scan:
            self.stdout.write(f'\n=== Scanning chain: {chain} ===')
            config = CHAIN_CONFIG.get(chain)
            w3 = Web3(Web3.HTTPProvider(config['rpc']))
            if not w3.is_connected():
                self.stderr.write(self.style.ERROR(f'RPC for {chain} not connected. Skipping.'))
                continue
            
            core_contracts = get_core_contracts(config['metadata_key'])
            endpoint_address = core_contracts.get('endpointV2', config['endpointV2'])
            endpoint_contract = w3.eth.contract(
                address=Web3.to_checksum_address(endpoint_address),
                abi=ENDPOINT_V2_ABI
            )

            scanning_service = ScanningService(w3, endpoint_contract, chain)

            contracts = BridgeContract.objects.filter(chain=chain)
            if not contracts:
                self.stdout.write(self.style.WARNING(f'No bridge contracts found on {chain}.'))
                continue

            for contract in contracts:
                total_scanned += 1
                remote_eid = DEFAULT_REMOTE_EID if chain != 'ethereum' else ARBITRUM_EID
                oapp_name = get_oapp_name(contract.address, chain)
                display_name = oapp_name if oapp_name else contract.address
                self.stdout.write(f'Contract {total_scanned}: scanning {display_name} on {chain}...')

                try:
                    # Scan contracts
                    result = scanning_service.scan_contract(contract, remote_eid)
                    if result:
                        status = self.style.SUCCESS('HEALTHY') if result.is_healthy else self.style.ERROR('UNHEALTHY')
                        self.stdout.write(f'    requiredDVNCount={result.required_dvn_count} -> {status}')
                        # Send an alert to users
                        if not result.is_healthy:
                            alert_service = AlertService()
                            alert_service.send_alerts_for_contract(contract, result.required_dvn_count, remote_eid, result.risk_score, result.grade)
                            pass
                except Exception as e:
                    self.stderr.write(f'Error scanning {contract.address}: {e}')
        
        # Automatically generate a report 
        if total_scanned > 0:
            service = ReportService()
            data = service.collect_data()
            summary = data['summary']
            html = service.generate_html()
            pdf_bytes = service.generate_pdf()

            report = Report.objects.create(
                data=data,
                html_content=html,
                summary=summary
            )
            report.pdf_file.save(
                f"{service.timestamp.strftime('%Y_%m_%d')}_oapp_security_report.pdf", ContentFile(pdf_bytes)
            )
            report.save()

            self.stdout.write(self.style.SUCCESS(f"Report #{report.id} saved at {service.timestamp.strftime('%m-%d-%Y')}. PDF: {report.pdf_file.url}"))
