from typing import Union
from langchain_groq import ChatGroq
from langchain_core.output_parsers import PydanticOutputParser

from app.core.config import settings
from app.schemas.job import Job
from app.schemas.resume import Resume
from app.schemas.application import ApplicationAnalysis

model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)

# 1. Create a parser specifically for your ApplicationAnalysis schema
parser = PydanticOutputParser(pydantic_object=ApplicationAnalysis)

def analyze_application(
    job: Job,
    resume: Union[Resume, str],
) -> ApplicationAnalysis:

    safe_description = job.description[:2500] if job.description else ""

    # Safely handle whether the resume is passed as a string or a structured object
    if isinstance(resume, str):
        resume_text = resume
    else:
        # Gracefully extract attributes if it's the Pydantic object
        skills = ", ".join(resume.skills) if hasattr(resume, "skills") and resume.skills else ""
        projects = ", ".join(resume.projects) if hasattr(resume, "projects") and resume.projects else ""
        experience = ", ".join(resume.experience) if hasattr(resume, "experience") and resume.experience else ""
        education = ", ".join(resume.education) if hasattr(resume, "education") and resume.education else ""
        
        resume_text = f"""
Name: {getattr(resume, "name", "Candidate")}
Summary: {getattr(resume, "summary", "")}
Skills: {skills}
Projects: {projects}
Experience: {experience}
Education: {education}
"""

    prompt = f"""
You are an expert job application advisor.
Analyze how well this candidate fits the specific job.

JOB
Title: {job.title}
Company: {job.company}
Description: {safe_description}

RESUME
{resume_text}

STRICT RULES
- Never invent experience, skills, projects, or achievements.
- Missing skills should be reported honestly.
- Keep recommendations practical and honest.

{parser.get_format_instructions()} 
"""
    # Notice we injected the format_instructions right at the end of the prompt!

    # 2. Invoke the standard model (not structured output)
    response = model.invoke(prompt)
    
    # 3. Parse the raw JSON string perfectly back into your Pydantic model
    return parser.invoke(response)