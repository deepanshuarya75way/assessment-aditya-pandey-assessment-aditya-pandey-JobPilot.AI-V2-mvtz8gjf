from typing import Union
from langchain_groq import ChatGroq
from langchain_core.output_parsers import PydanticOutputParser

from app.core.config import settings
from app.schemas.job import Job
from app.schemas.resume import Resume
from app.schemas.application import CoverLetter

model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0.3,
)

# 1. Create the parser for the CoverLetter schema
parser = PydanticOutputParser(pydantic_object=CoverLetter)

def generate_cover_letter(
    job: Job,
    resume: Union[Resume, str],
) -> CoverLetter:

    safe_description = job.description[:2500] if job.description else ""

    # Safely handle string vs object
    if isinstance(resume, str):
        resume_text = resume
    else:
        skills = ", ".join(getattr(resume, "skills", [])) or ""
        projects = ", ".join(getattr(resume, "projects", [])) or ""
        experience = ", ".join(getattr(resume, "experience", [])) or ""
        education = ", ".join(getattr(resume, "education", [])) or ""
        
        resume_text = f"""
Name: {getattr(resume, "name", "Candidate")}
Summary: {getattr(resume, "summary", "")}
Skills: {skills}
Projects: {projects}
Experience: {experience}
Education: {education}
"""

    prompt = f"""
Write a concise professional cover letter for this job.

JOB
Title: {job.title}
Company: {job.company}
Description: {safe_description}

CANDIDATE RESUME
{resume_text}

RULES
- Keep it concise and professional.
- Use the candidate's actual background.
- Do not invent experience or skills.

{parser.get_format_instructions()}
"""

    # 2. Invoke the model
    response = model.invoke(prompt)
    
    # 3. Parse the output safely back into your schema
    return parser.invoke(response)