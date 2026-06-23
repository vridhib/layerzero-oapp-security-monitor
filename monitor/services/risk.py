from typing import Callable, List, Optional
from monitor.constants import (
    HEALTHY_RISK_SCORE_THRESHOLD, MIN_SAFE_REQUIRED_DVN_COUNT,
    MIN_OPTIONAL_THRESHOLD, MIN_CONFIRMATION_THRESHOLD
)


class RiskAssessmentService:
    @staticmethod
    def compute_risk_score(
        required_dvn_count: int, 
        optional_dvn_threshold: int, 
        confirmations: int, 
        required_dvns: list[str], 
        optional_dvns: list[str], 
        provider_map: Optional[Callable[[str], Optional[str]]] = None
    ) -> int:
        """Compute a risk score (0-100, lower is riskier).

        Args:
            required_dvn_count: Number of required DVNs.
            optional_dvn_threshold: Number of optional DVNs that must confirm.
            confirmations: Number of block confirmations required.
            required_dvns: List of required DVN addresses.
            optional_dvns: List of optional DVN addresses.
            provider_map: Function that maps a DVN address to a provider name.

        Returns:
            Risk score from 0 (extremely risky) to 100 (safe).
        """
        score = 100

        # 1. Exposure risk (most critical)
        if required_dvn_count + optional_dvn_threshold <= MIN_OPTIONAL_THRESHOLD:
            score -= 50
        elif required_dvn_count == 1 and optional_dvn_threshold == 0:
            score -= 40

        # 2. Low redundancy (required DVNs are low and no optional safety net)
        if required_dvn_count < MIN_SAFE_REQUIRED_DVN_COUNT:
            score -= 20
        elif optional_dvn_threshold == 0:
            score -= 10

        # 3. Centralization risk (all required DVNs are from the same provider)
        if provider_map and required_dvns:
            providers = set()
            for addr in required_dvns:
                provider = provider_map(addr)
                if provider:
                    providers.add(provider)
            if len(providers) == 1:
                score -= 25
        
        # 4. Low confirmations (finality risk)
        if confirmations == 0:
            score -= 15
        elif confirmations < MIN_CONFIRMATION_THRESHOLD:
            score -= 10

        # 5. Optional DVNs existence (if exists, give bonus)
        if optional_dvns and optional_dvn_threshold > 0:
            score += 10

        # Restrict score between 0 and 100
        return max(0, min(100, score))


    @staticmethod
    def score_to_grade(score: int) -> str:
        """Convert a risk score to a letter grade.

        Args:
            score: Risk score (0-100).

        Returns:
            Grade: A, B, C, D, or F.
        """
        if score >= 90: return "A"
        elif score >= 75: return "B"
        elif score >= 60: return "C"
        elif score >= 40: return "D"
        return "F"
    
    
    def assess(
        self, 
        required_dvn_count: int, 
        optional_dvn_threshold: int, 
        confirmations: int, 
        required_dvns: List[str], 
        optional_dvns: List[str], 
        provider_map: Optional[Callable[[str], Optional[str]]] = None
    ) -> tuple[int, str, bool]:
        """Full assessment: risk score, grade, and health status.

        Returns:
            Tuple of (risk_score, grade, is_healthy).
        """
        risk_score = self.compute_risk_score(
            required_dvn_count, optional_dvn_threshold, confirmations, required_dvns, optional_dvns, provider_map
        )
        grade = self.score_to_grade(risk_score)
        is_healthy = risk_score >= HEALTHY_RISK_SCORE_THRESHOLD
        return risk_score, grade, is_healthy