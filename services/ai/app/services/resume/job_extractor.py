from langchain_groq import ChatGroq

from app.core.config import settings
from app.schemas.job_requirement import JobRequirement


model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)

job_model = model.with_structured_output(
    JobRequirement
)

from app.schemas.job import Job


def extract_job_requirements(
    job: Job,
) -> JobRequirement:

    prompt = f"""
Extract the hiring requirements.

Job Title:

{job.title}

Description:

{job.description}

Return JobRequirement.

Rules:

Extract:

- skills

- education

- experience

- responsibilities

- preferred qualifications

Never invent information.
"""

    return job_model.invoke(
        prompt
    )