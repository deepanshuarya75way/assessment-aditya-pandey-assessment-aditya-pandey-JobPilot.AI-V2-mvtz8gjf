from langchain_groq import ChatGroq

from app.core.config import settings
from app.schemas.resume import Resume


model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)

resume_model = model.with_structured_output(
    Resume
)

def extract_resume(
    resume_text: str,
) -> Resume:

    prompt = f"""
You are an expert resume parser.

Extract all information from the resume.

Return a Resume object.

Resume:

{resume_text}

Rules:

- Never invent information.
- If something is missing, leave it empty.
- Extract every skill.
- Extract every project.
- Extract every experience.
- Extract every certification.
"""

    return resume_model.invoke(
        prompt
    )

