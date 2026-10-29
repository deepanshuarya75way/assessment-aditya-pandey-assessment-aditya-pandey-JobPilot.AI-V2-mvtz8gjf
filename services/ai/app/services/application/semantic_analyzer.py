from pydantic import BaseModel, Field
from typing import List
from langchain_groq import ChatGroq
from app.core.config import settings

class SemanticAnalysisReport(BaseModel):
    fit_category: str = Field(description="Must be one of: Excellent Fit, Good Fit, Partial Fit, Not a Fit")
    overall_fit_score: int = Field(description="Score out of 100")
    matched_skills: List[str] = Field(description="Skills in JD that candidate has")
    missing_skills: List[str] = Field(description="Skills in JD that candidate is missing")
    cover_letter: str = Field(description="A 3-paragraph tailored cover letter bridging the resume context with the JD")

semantic_model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0.2,
).with_structured_output(SemanticAnalysisReport)

def analyze_resume_semantic(resume_text: str, job_description: str, company_name: str) -> SemanticAnalysisReport:
    prompt = f"""
You are an expert technical recruiter and career strategist.
Compare the Candidate's Resume against the Job Description for {company_name}.

1. Categorize the fit as: Excellent Fit, Good Fit, Partial Fit, or Not a Fit.
2. List the matched skills (semantically matched) and missing skills.
3. Write a highly tailored, professional 3-paragraph Cover Letter. 
   - Paragraph 1: Excitement for the role at {company_name}.
   - Paragraph 2: Prove fit by highlighting specific projects/metrics from the RESUME that match the JD. (DO NOT invent facts).
   - Paragraph 3: Call to action.

CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}
"""
    return semantic_model.invoke(prompt)