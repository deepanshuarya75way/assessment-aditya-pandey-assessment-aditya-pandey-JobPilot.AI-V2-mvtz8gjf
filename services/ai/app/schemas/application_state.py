from typing import TypedDict

from app.schemas.job import Job
from app.schemas.resume import Resume

from app.schemas.application import (
    ApplicationAnalysis,
    TailoredResume,
    CoverLetter,
    ApplicationChecklist,
)


class ApplicationState(TypedDict):

    job: Job

    resume: Resume

    analysis: ApplicationAnalysis | None

    tailored_resume: TailoredResume | None

    cover_letter: CoverLetter | None

    checklist: ApplicationChecklist | None