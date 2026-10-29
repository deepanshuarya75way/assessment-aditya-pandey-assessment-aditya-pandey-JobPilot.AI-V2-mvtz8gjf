from langchain_groq import ChatGroq
from app.core.config import settings
from app.schemas.company_evidence import CompanyEvidence
from app.schemas.company_trust import TrustReport
from app.services.company.trust_calculator import (
    calculate_confidence,
    calculate_recommendation,
    calculate_trust_score,
)

model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)

trust_model = model.with_structured_output(TrustReport)

def analyze_company(evidence: CompanyEvidence) -> TrustReport:
    prompt = f"""
You are a senior cybersecurity analyst and recruitment fraud expert.
Your task is to evaluate how trustworthy a company is based on the supplied evidence.

CRITICAL SCAM & RISK PARAMETERS TO SCAN FOR:
1. Scam/Phishing: Generic contact emails (@gmail.com/@yahoo.com), requests for upfront money/fees.
2. Ghost Jobs: Overly vague descriptions, lack of clear responsibilities.
3. Toxicity/Turnover: Language like "wear many hats", "handle extreme pressure", abusive notice periods.
4. Red Flags: Hidden training bonds, security deposits, or unrealistic salary promises.

Use ONLY the supplied evidence. Never invent facts.

COMPANY: {evidence.company_name}
Official Website: {evidence.official_website or 'Not deterministically found - check evidence below'}
LinkedIn: {evidence.linkedin_url or 'Not deterministically found - check evidence below'}
Careers: {evidence.careers_page or 'Not deterministically found - check evidence below'}

COLLECTED EVIDENCE:
"""

    for item in evidence.evidence_items:
        prompt += f"Source: {item.source}\nTitle: {item.title}\nURL: {item.url}\nSnippet: {item.snippet}\n---\n"

    prompt += """
You MUST return a TrustReport containing: trust_score, confidence, breakdown, recommendation, summary, strengths, red_flags, and reasoning.

==================================================
BREAKDOWN SCORING (MUST SUM TO EXACTLY YOUR TOTAL TRUST_SCORE)
==================================================
Website Score (0-25): Does evidence point to a professional, official domain?
LinkedIn Score (0-20): Does evidence show an established company LinkedIn page?
Careers Score (0-20): Is there a transparent, official hiring/careers page?
Public Presence Score (0-20): Does the company have a visible industry reputation and news presence?
Evidence Quality Score (0-15): Is the collected evidence consistent and reliable?

Rules:
1. Never guess. Missing evidence should reduce confidence, but do not overly penalize massive global companies if the provided URLs obviously belong to them (e.g., amazon.jobs).
2. The total trust_score MUST EXACTLY equal the sum of the five category scores.
3. Keep the reasoning concise but specific.
"""

    report = trust_model.invoke(prompt)
    report = calculate_trust_score(report)
    report = calculate_recommendation(report)
    report = calculate_confidence(report, evidence)

    return report