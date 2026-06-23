from typing import List
from datetime import datetime
from django.db.models import Count
from django.template.loader import render_to_string
from weasyprint import HTML
from django.http import HttpResponse
from monitor.models import DVNConfig, BridgeContract


class ReportService:
    def __init__(self):
        self.timestamp = datetime.now()


    def collect_data(self):
        """Query all risk data for the report."""
        configs = DVNConfig.objects.select_related('contract').all()
        return {
            'generated_at': self.timestamp.isoformat(),
            'summary': {
                'total_oapps': BridgeContract.objects.count(),
                'total_configs': configs.count(),
                'unhealthy': configs.filter(is_healthy=False).count(),
                'eoa_owner_risk': configs.filter(is_owner_eoa=True).count(),
                'proxy_admin_risk': configs.filter(has_proxy_admin_risk=True).count(),
                'oracle_stale': configs.filter(is_oracle_stale=True).count(),
                'exposed_1_of_1': configs.filter(
                    required_dvn_count=1,
                    optional_dvn_count=0
                ).count(),
                'centralized': configs.filter(is_centralized=True).count(),
                'by_remote_eid': {
                    str(eid): count
                    for eid, count in configs.values_list('remote_eid').annotate(cnt=Count('id'))
                }
            },
            'by_chain': self._group_by_chain(configs),
            'critical_issues': self._get_critical_issues(configs),
            'all_configs': self._serialize_configs(configs)
        }


    # --------- Internal Functions ---------
    def _group_by_chain(self, configs: List[DVNConfig]) -> dict:
        """Group risk data by chain."""
        chains = {}
        for config in configs:
            chain = config.contract.chain
            if chain not in chains:
                chains[chain] = {
                    'total': 0,
                    'remote_eid': config.remote_eid,
                    'unhealthy': 0,
                    'eoa_owner_risk': 0,
                    'proxy_admin_risk': 0,
                    'oracle_stale': 0,
                    'centralized': 0 
                }
            chains[chain]['total'] += 1
            if not config.is_healthy:
                chains[chain]['unhealthy'] += 1
            if config.is_owner_eoa: 
                chains[chain]['eoa_owner_risk'] += 1
            if config.has_proxy_admin_risk:
                chains[chain]['proxy_admin_risk'] += 1
            if config.is_oracle_stale:
                chains[chain]['oracle_stale'] += 1
            if config.is_centralized:
                chains[chain]['centralized'] += 1
        return chains


    def _get_critical_issues(self, configs: List[DVNConfig]) -> List[dict]:
        """Return only high-severity issues for executive summary."""
        critical = []
        for c in configs.filter(is_healthy=False):
            critical.append({
                'contract': c.contract.address,
                'remote_eid': c.remote_eid,
                'chain': c.contract.chain,
                'name': c.contract.name,
                'required_dvn_count': c.required_dvn_count,
                'has_proxy_admin_risk': c.has_proxy_admin_risk,
                'is_owner_eoa': c.is_owner_eoa,
                'is_oracle_stale': c.is_oracle_stale,
                'risk_score': c.risk_score,
                'grade': c.grade,
                'risk_notes': c.risk_notes,
            })
        return critical


    def _serialize_configs(self, configs: List[DVNConfig]) -> List[dict]:
        """Convert configs to list of dicts for report."""
        return [{
            'contract_address': c.contract.address,
            'remote_eid': c.remote_eid,
            'chain': c.contract.chain,
            'name': c.contract.name,
            'required_dvn_count': c.required_dvn_count,
            'risk_score': c.risk_score,
            'grade': c.grade,
            'is_healthy': c.is_healthy,
            'has_proxy_admin_risk': c.has_proxy_admin_risk,
            'is_owner_eoa': c.is_owner_eoa,
            'is_oracle_stale': c.is_oracle_stale,
            'risk_notes': c.risk_notes
        } for c in configs]


    # --------- Generate Functions ---------
    def generate_html(self):
        """Generate HTML report from template."""
        data = self.collect_data()
        return render_to_string('reports/layerzero_oapp_security_report.html', data)


    def generate_pdf(self):
        """Generate PDF report using WeasyPrint."""
        html_content = self.generate_html()
        pdf_file = HTML(string=html_content).write_pdf()
        return pdf_file


    def get_http_response(self, file_format='pdf') -> HttpResponse:
        """Return Django HTTP response for download."""
        if file_format == 'pdf':
            pdf = self.generate_pdf()
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{self.timestamp.strftime("%Y_%m_%d")}layerzero_oapp_security_report.pdf"'
            return response
        else:
            html = self.generate_html()
            return HttpResponse(html)