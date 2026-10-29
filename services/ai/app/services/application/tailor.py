from typing import Union
from langchain_groq import ChatGroq
from langchain_core.output_parsers import PydanticOutputParser

from app.core.config import settings
from app.schemas.job import Job
from app.schemas.resume import Resume
from app.schemas.application import TailoredResume

model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)

# 1. Create the parser for the TailoredResume schema
parser = PydanticOutputParser(pydantic_object=TailoredResume)

def tailor_resume(
    job: Job,
    resume: Union[Resume, str],
) -> TailoredResume:

    safe_description = job.description[:2500] if job.description else ""

    # Safely handle string vs object
    if isinstance(resume, str):
        resume_text = resume
    else:
        skills = ", ".join(getattr(resume, "skills", [])) or ""
        projects = ", ".join(getattr(resume, "projects", [])) or ""
        experience = ", ".join(getattr(resume, "experience", [])) or ""
        education = ", ".join(getattr(resume, "education", [])) or ""
        certifications = ", ".join(getattr(resume, "certifications", [])) or ""
        
        resume_text = f"""
Summary: {getattr(resume, "summary", "")}
Skills: {skills}
Projects: {projects}
Experience: {experience}
Education: {education}
Certifications: {certifications}
"""

    prompt = f"""
You are an expert technical resume editor.
Tailor the candidate's existing resume for the specific job below.

JOB
Title: {job.title}
Company: {job.company}
Description: {safe_description}

RESUME
{resume_text}

INSTRUCTIONS
Create recommendations for tailoring the existing resume toward this specific job.

STRICT RULES:
- Never invent experience, skills, projects, achievements, or certifications.
- Never add a missing skill as if the candidate already possesses it.
- Never create fictional experience to improve the match.
- Only use information actually present in the supplied resume.

{parser.get_format_instructions()}
"""

    # 2. Invoke the model
    response = model.invoke(prompt)
    
    # 3. Parse the output safely back into your schema
    return parser.invoke(response)