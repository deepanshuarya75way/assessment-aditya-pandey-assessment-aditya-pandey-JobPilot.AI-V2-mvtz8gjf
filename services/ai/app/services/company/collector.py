from app.schemas.company_evidence import CompanyEvidence
from app.schemas.job import Job
from app.services.company.search import search_company

# Import your extractors!
from app.services.company.website import find_official_website
from app.services.company.linkedin import find_linkedin
from app.services.company.careers import find_careers_page

def collect_company_evidence(job: Job) -> CompanyEvidence:
    # 1. Initialize evidence with the company name
    evidence = CompanyEvidence(company_name=job.company)

    # 2. Fetch the raw search results from Tavily
    evidence.evidence_items = search_company(job.company)

    # 3. CRITICAL FIX: Run the extractors to actually populate the URLs!
    evidence = find_official_website(evidence)
    evidence = find_linkedin(evidence)
    evidence = find_careers_page(evidence)

    return evidence