from app.schemas.company_evidence import CompanyEvidence
from app.services.company.url_utils import (
    get_domain,
    get_path,
    is_bad_domain,
)

def find_official_website(evidence: CompanyEvidence):
    best_url = None
    best_score = -1

    # Split the name and grab the first main word (e.g., "Amazon" from "Amazon Web Services")
    company_words = evidence.company_name.lower().split()
    primary_name = company_words[0] if company_words else ""
    
    # Clean it up just in case
    primary_name = primary_name.replace(",", "").replace(".", "")

    for item in evidence.evidence_items:
        if is_bad_domain(item.url):
            continue

        score = 0
        domain = get_domain(item.url)
        path = get_path(item.url)

        # Look for the primary name in the domain
        if primary_name and primary_name in domain.replace(".", ""):
            score += 50

        if path in ("", "/"):
            score += 100

        if len(path) < 15:
            score += 10

        if score > best_score:
            best_score = score
            best_url = item.url

    evidence.official_website = best_url
    return evidence