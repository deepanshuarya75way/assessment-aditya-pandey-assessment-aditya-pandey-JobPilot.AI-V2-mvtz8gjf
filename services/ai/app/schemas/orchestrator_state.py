from typing import TypedDict

from app.schemas.job import Job
from app.schemas.job_ranking import RankedJob
from app.schemas.resume import Resume
from app.schemas.application import ApplicationReport


class OrchestratorState(TypedDict):

    operation: str

    user_query: str

    resume: Resume

    discovered_jobs: list[Job]

    ranked_jobs: list[RankedJob]

    selected_job: Job | None

    application_report: ApplicationReport | None