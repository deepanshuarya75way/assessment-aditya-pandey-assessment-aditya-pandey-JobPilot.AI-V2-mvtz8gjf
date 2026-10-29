from typing import TypedDict

from app.schemas.job import Job
from app.schemas.job_relevance import AnalyzedJob
from app.schemas.job_search import JobSearchIntent


class JobDiscoveryState(TypedDict):
    search_intent: JobSearchIntent

    adzuna_jobs: list[Job]
    greenhouse_jobs: list[Job]

    jobs: list[Job]
    filtered_jobs: list[Job]

    relevant_jobs: list[AnalyzedJob]
    unique_jobs: list[AnalyzedJob]