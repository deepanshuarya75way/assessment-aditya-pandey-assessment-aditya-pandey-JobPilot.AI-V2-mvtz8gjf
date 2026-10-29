from langchain_groq import ChatGroq

from app.core.config import settings
from app.schemas.resume import Resume
from app.schemas.job_requirement import JobRequirement
from app.schemas.resume_feedback import ResumeFeedback
from app.schemas.resume_match import ResumeMatchReport


model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)

feedback_model = model.with_structured_output(
    ResumeFeedback
)

def generate_feedback(

    resume: Resume,

    requirements: JobRequirement,

    report: ResumeMatchReport,

) -> ResumeFeedback:

    prompt = f"""
You are an expert ATS recruiter and resume reviewer.

The resume has already been analyzed.

Do NOT calculate scores.

The scores below are final.

==================================================

Overall Score

{report.overall_score}

Skill Score

{report.skill_score}

Experience Score

{report.experience_score}

Project Score

{report.project_score}

Education Score

{report.education_score}

ATS Score

{report.ats_score}

==================================================

Matched Skills

{report.matched_skills}

Missing Skills

{report.missing_skills}

==================================================

Resume

{resume.model_dump_json(indent=2)}

==================================================

Job Requirements

{requirements.model_dump_json(indent=2)}

==================================================

Return ResumeFeedback.

Rules

Do not invent information.

Mention only genuine strengths.

Mention only genuine weaknesses.

Suggestions should be practical.

Suggestions should help improve ATS score.

Keep everything concise.
"""

    return feedback_model.invoke(
        prompt
    )