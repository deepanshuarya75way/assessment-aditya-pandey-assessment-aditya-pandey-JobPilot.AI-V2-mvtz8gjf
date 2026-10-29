from app.schemas.company_evidence import CompanyEvidence


def find_linkedin(
    evidence: CompanyEvidence,
):

    best = None

    score = -1

    for item in evidence.evidence_items:

        url = item.url.lower()

        if "linkedin.com/company/" not in url:
            continue

        s = 0

        if "/jobs" not in url:
            s += 100

        if "/posts" in url:
            s -= 20

        if "/people" in url:
            s -= 20

        if s > score:

            score = s

            best = item.url

    evidence.linkedin_url = best

    return evidence