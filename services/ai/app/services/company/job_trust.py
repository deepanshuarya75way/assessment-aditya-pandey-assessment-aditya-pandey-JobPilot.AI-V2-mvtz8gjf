from app.schemas.job import Job
from app.schemas.company_trust import TrustReport
from app.services.company.collector import collect_company_evidence
from app.services.company.deterministic_trust import calculate_deterministic_trust
from app.services.company.analyzer import analyze_company

def get_company_trust(job: Job) -> TrustReport:
    print(f"\n--- Gathering Evidence for: {job.company} ---")
    evidence = collect_company_evidence(job)

    # Debugging prints so you can see exactly what Tavily found
    print(f"Website found: {bool(evidence.official_website)}")
    print(f"LinkedIn found: {bool(evidence.linkedin_url)}")
    print(f"Careers found: {bool(evidence.careers_page)}")

    # 1. ALWAYS run your deterministic logic first
    report = calculate_deterministic_trust(evidence)

    # 2. If the deterministic engine gives it a solid score (>= 60), 
    # it means it found enough real URLs. We trust it and skip the LLM!
    if report.trust_score >= 60:
        print(f"[{job.company}] Using Deterministic Trust. Score: {report.trust_score}")
        return report

    # 3. Only if the deterministic score is terrible (missing website/LinkedIn), 
    # we send it to the LLM to read the snippets and check if it's a scam.
    print(f"[{job.company}] Deterministic score too low ({report.trust_score}). Falling back to LLM deep scan...")
    try:
        return analyze_company(evidence)
    except Exception as e:
        print(f"LLM Analysis failed: {e}. Returning deterministic score anyway.")
        return report