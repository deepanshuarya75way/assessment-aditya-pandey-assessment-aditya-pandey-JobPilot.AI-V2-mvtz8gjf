from app.schemas.company_evidence import CompanyEvidence
from app.services.company.url_utils import (
    get_domain,
)


KEYWORDS = (
    "career",
    "careers",
    "jobs",
)


def find_careers_page(
    evidence: CompanyEvidence,
):

    if not evidence.official_website:
        return evidence

    official_domain = get_domain(
        evidence.official_website
    )

    best = None

    best_score = -1

    for item in evidence.evidence_items:

        url = item.url.lower()

        score = 0

        if get_domain(url) == official_domain:
            score += 100

        if "career" in url:
            score += 60

        if "jobs" in url:
            score += 40

        if "linkedin.com" in url:
            score -= 200

        if score > best_score:

            best_score = score

            best = item.url

    evidence.careers_page = best

    return evidence