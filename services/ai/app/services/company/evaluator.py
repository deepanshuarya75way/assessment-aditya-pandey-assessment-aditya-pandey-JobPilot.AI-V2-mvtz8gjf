from app.schemas.company_evidence import CompanyEvidence


def has_enough_evidence(
    evidence: CompanyEvidence,
) -> bool:

    website = bool(
        evidence.official_website
    )

    linkedin = bool(
        evidence.linkedin_url
    )

    careers = bool(
        evidence.careers_page
    )

    evidence_count = len(
        evidence.evidence_items
    )

    return (
        website
        and linkedin
        and careers
        and evidence_count >= 3
    )


def should_use_llm(
    evidence: CompanyEvidence,
) -> bool:

    return not has_enough_evidence(
        evidence
    )