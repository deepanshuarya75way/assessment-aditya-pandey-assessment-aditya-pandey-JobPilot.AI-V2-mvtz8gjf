from app.schemas.job import Job
from app.schemas.resume import Resume
from app.schemas.resume_match import ResumeMatchReport

from app.services.resume.job_extractor import (
    extract_job_requirements,
)

from app.services.resume.matcher import (
    match_resume,
)


def match_resume_to_job(
    resume: Resume,
    job: Job,
) -> ResumeMatchReport:

    requirements = extract_job_requirements(
        job
    )

    report = match_resume(
        resume,
        requirements,
    )

    return report