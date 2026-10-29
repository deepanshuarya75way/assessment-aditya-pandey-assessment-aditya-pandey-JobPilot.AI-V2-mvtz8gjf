from typing import TypedDict

from app.schemas.job import Job
from app.schemas.resume import Resume
from app.schemas.job_requirement import JobRequirement
from app.schemas.resume_match import ResumeMatchReport


class ResumeState(TypedDict):
    resume_text: str

    parsed_resume: str

    job: Job

    resume: Resume | None

    requirements: JobRequirement | None

    report: ResumeMatchReport | None