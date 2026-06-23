from django.core.management.base import BaseCommand
from monitor.models import BridgeContract
from monitor.utils.metadata import fetch_layerzero_metadata


class Command(BaseCommand):
    help = 'Populate BridgeContract with known OApps from LayerZero metadata'

    def handle(self, *args, **options):
        metadata = fetch_layerzero_metadata()
        if not metadata:
            self.stdout.write(self.style.ERROR("Failed to fetch metadata or no mainnet chains"))
            return
        
        total_created = 0
        total_skipped = 0

        for chain_key, chain_data in metadata.items():
            address_to_oapp = chain_data.get("addressToOApp", {})
            for address, oapp_info in address_to_oapp.items():
                canonical_name = oapp_info.get("canonicalName")
                is_deprecated = oapp_info.get("deprecated", False)
                if is_deprecated:
                    continue
                obj, created = BridgeContract.objects.get_or_create(
                    address=address.lower(),
                    defaults={
                        "chain": chain_key,
                        "name": canonical_name or "Unknown",
                        "source": "metadata"
                    }
                )
                if created: 
                    total_created += 1
                else: 
                    total_skipped += 1
        
        self.stdout.write(self.style.SUCCESS(f"Done. Created {total_created} new BridgeContract records. Skipped {total_skipped} existing."))
