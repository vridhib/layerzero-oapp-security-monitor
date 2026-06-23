from django.test import TestCase
from monitor.services.risk import RiskAssessmentService


class RiskAssessmentServiceTest(TestCase):
    def setUp(self):
        self.service = RiskAssessmentService()
        self.single_provider_map = lambda addr: "Google"
        self.multi_provider_map = lambda x: "Google" if x == "0xa" else "AWS"


    # --------- Test `compute_risk_score` ---------
    def test_perfect_config_gets_max_score(self):
        score = self.service.compute_risk_score(
            required_dvn_count=3,
            optional_dvn_threshold=2,
            confirmations=10,
            required_dvns=["0xa", "0xb", "0xc"],
            optional_dvns=["0xd", "0xe"],
            provider_map=self.multi_provider_map
        )
        self.assertEqual(score, 100)

    def test_exposed_1_of_1_config_gets_very_low_score(self):
        """1 required DVN + 0 optional threshold = extremely risky."""
        score = self.service.compute_risk_score(
            required_dvn_count=1,
            optional_dvn_threshold=0,
            confirmations=1,
            required_dvns=["0xa"],
            optional_dvns=[],
            provider_map=self.single_provider_map
        )
        # 100 - 50 (exposure) - 20 (low redundancy) - 25 (centralized) - 10 (low confirmations) = max(0, -5) = 0
        self.assertEqual(score, 0)

    def test_low_redundancy_penalty(self):
        """required_dvn_count < 2 gives -20 even if exposure not triggered."""
        score = self.service.compute_risk_score(
            required_dvn_count=1,
            optional_dvn_threshold=1,  # not exposed because sum=2
            confirmations=10,
            required_dvns=["0xa"],
            optional_dvns=["0xb"],
            provider_map=self.single_provider_map
        )
        # 100 - 20 (low redundancy) - 25 (centralized) + 10 (optional bonus) = 65
        self.assertEqual(score, 65)

    def test_no_centralization_penalty_when_different_providers(self):
        service = RiskAssessmentService()
        score = service.compute_risk_score(
            required_dvn_count=2,
            optional_dvn_threshold=0,
            confirmations=10,
            required_dvns=["0xa", "0xb"],
            optional_dvns=[],
            provider_map=self.multi_provider_map
        )
        # 100 - 10 (low redundancy) = 90
        self.assertGreaterEqual(score, 90)

    def test_low_confirmations_penalty(self):
        score = self.service.compute_risk_score(
            required_dvn_count=2,
            optional_dvn_threshold=0,
            confirmations=3,   # <4
            required_dvns=["0xa", "0xb"],
            optional_dvns=[],
            provider_map=self.multi_provider_map
        )
        # 100 - 10 (low redundancy) - 10 (low confirmations)
        self.assertEqual(score, 80)

    def test_zero_confirmations_extra_penalty(self):
        score = self.service.compute_risk_score(
            required_dvn_count=2,
            optional_dvn_threshold=0,
            confirmations=0,
            required_dvns=["0xa", "0xb"],
            optional_dvns=[],
            provider_map=self.multi_provider_map
        )
        # 100 - 10 (low redundancy) - 15 (zero confirmations) = 75
        self.assertEqual(score, 75)

    def test_optional_bonus_given_when_optional_dvns_exist(self):
        score = self.service.compute_risk_score(
            required_dvn_count=1,
            optional_dvn_threshold=1,
            confirmations=10,
            required_dvns=["0xa"],
            optional_dvns=["0xb"],
            provider_map=self.single_provider_map
        )
        # 100 - 20 (low redundancy) - 25 (centralized) + 10 (optional DVN bonus)= 65
        self.assertEqual(score, 65)


    # --------- Test `score_to_grade` ---------
    def test_grade_a_from_90_to_100(self):
        self.assertEqual(self.service.score_to_grade(90), "A")
        self.assertEqual(self.service.score_to_grade(95), "A")
        self.assertEqual(self.service.score_to_grade(100), "A")

    def test_grade_b_from_75_to_89(self):
        self.assertEqual(self.service.score_to_grade(75), "B")
        self.assertEqual(self.service.score_to_grade(80), "B")
        self.assertEqual(self.service.score_to_grade(89), "B")

    def test_grade_c_from_60_to_74(self):
        self.assertEqual(self.service.score_to_grade(60), "C")
        self.assertEqual(self.service.score_to_grade(70), "C")
        self.assertEqual(self.service.score_to_grade(74), "C")

    def test_grade_d_from_40_to_59(self):
        self.assertEqual(self.service.score_to_grade(40), "D")
        self.assertEqual(self.service.score_to_grade(50), "D")
        self.assertEqual(self.service.score_to_grade(59), "D")

    def test_grade_f_below_40(self):
        self.assertEqual(self.service.score_to_grade(39), "F")
        self.assertEqual(self.service.score_to_grade(0), "F")


    # -----  Test `assess` -----
    def test_assess_returns_correct_tuple(self):
        risk_score, grade, is_healthy = self.service.assess(
            required_dvn_count=1,
            optional_dvn_threshold=0,
            confirmations=1,
            required_dvns=["0xa"],
            optional_dvns=[],
            provider_map=self.single_provider_map
        )
        self.assertEqual(risk_score, 0) # 100 - 50 - 20 - 25 - 10 -> max(0, -5) = 0
        self.assertEqual(grade, "F")
        self.assertFalse(is_healthy)

    def test_healthy_threshold_60(self):
        score60 = self.service.compute_risk_score(
            required_dvn_count=2,
            optional_dvn_threshold=1,
            confirmations=10,
            required_dvns=["0xa", "0xb"],
            optional_dvns=["0xc"],
            provider_map=self.multi_provider_map
        )
        self.assertGreaterEqual(score60, 60)
        _, _, healthy = self.service.assess(
            required_dvn_count=2,
            optional_dvn_threshold=1,
            confirmations=10,
            required_dvns=["0xa", "0xb"],
            optional_dvns=["0xc"],
            provider_map=self.multi_provider_map
        )
        self.assertTrue(healthy)