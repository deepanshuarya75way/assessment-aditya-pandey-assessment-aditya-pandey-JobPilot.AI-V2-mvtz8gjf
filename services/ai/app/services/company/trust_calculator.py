from app.schemas.company_evidence import CompanyEvidence
from app.schemas.company_trust import TrustReport


def calculate_trust_score(
    report: TrustReport,
) -> TrustReport:

    breakdown = report.breakdown

    report.trust_score = (
        breakdown.website_score
        + breakdown.linkedin_score
        + breakdown.careers_score
        + breakdown.public_presence_score
        + breakdown.evidence_quality_score
    )

    return report


def calculate_recommendation(
    report: TrustReport,
) -> TrustReport:

    score = report.trust_score

    if score >= 90:
        report.recommendation = "Trusted"

    elif score >= 75:
        report.recommendation = "Mostly Trusted"

    elif score >= 60:
        report.recommendation = "Use Caution"

    elif score >= 40:
        report.recommendation = "Suspicious"

    else:
        report.recommendation = "High Risk"

    return report


def calculate_confidence(
    report: TrustReport,
    evidence: CompanyEvidence,
) -> TrustReport:

    confidence = 40

    if evidence.official_website:
        confidence += 15

    if evidence.linkedin_url:
        confidence += 15

    if evidence.careers_page:
        confidence += 15

    confidence += min(
        len(evidence.evidence_items),
        15,
    )

    report.confidence = min(
        confidence,
        100,
    )

    return report