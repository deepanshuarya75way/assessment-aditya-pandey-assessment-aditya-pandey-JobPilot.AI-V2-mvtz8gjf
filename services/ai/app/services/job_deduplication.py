import re

from app.schemas.job_relevance import AnalyzedJob

def normalize_text(value: str) -> str:
    value = value.lower().strip()

    value = re.sub(
        r"[^a-z0-9\s]",
        " ",
        value,
    )

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value

def build_job_key(
    analyzed_job: AnalyzedJob,
) -> str:

    job = analyzed_job.job

    title = normalize_text(job.title)
    company = normalize_text(job.company)
    location = normalize_text(job.location)

    return f"{title}|{company}|{location}"

def deduplicate_jobs(
    jobs: list[AnalyzedJob],
) -> list[AnalyzedJob]:

    unique: dict[str, AnalyzedJob] = {}

    for analyzed_job in jobs:
        key = build_job_key(analyzed_job)

        existing = unique.get(key)

        if existing is None:
            unique[key] = analyzed_job
            continue

        if (
            analyzed_job.relevance_score
            > existing.relevance_score
        ):
            unique[key] = analyzed_job

    return list(unique.values())

