from app.schemas.job_relevance import AnalyzedJob
from app.schemas.job_ranking import RankedJob
from app.schemas.resume import Resume

from app.services.resume.job_matcher import (
    match_resume_to_job,
)
from app.services.company.job_trust import (
    get_company_trust,
)
from datetime import datetime, timezone


def calculate_freshness_score(job) -> int:

    if not job.posted_at:
        return 50

    posted_at = job.posted_at

    # Handle timezone-naive datetimes
    if posted_at.tzinfo is None:
        posted_at = posted_at.replace(
            tzinfo=timezone.utc
        )

    now = datetime.now(timezone.utc)

    age_days = (
        now - posted_at
    ).total_seconds() / 86400

    if age_days <= 1:
        return 100

    if age_days <= 2:
        return 90

    if age_days <= 4:
        return 80

    if age_days <= 7:
        return 70

    if age_days <= 14:
        return 50

    return 20


def calculate_final_score(
    relevance_score: int,
    resume_score: int,
    company_trust_score: int,
    freshness_score: int,
) -> int:

    score = (
        relevance_score * 0.35
        + resume_score * 0.35
        + company_trust_score * 0.20
        + freshness_score * 0.10
    )

    return int(score)


def rank_jobs(
    jobs: list[AnalyzedJob],
    resume: Resume | None,
    company_trust_reports,
) -> list[RankedJob]:

    ranked_jobs = []

    for analyzed_job in jobs:

        if resume is not None:

            resume_report = match_resume_to_job(
                resume,
                analyzed_job.job,
            )

            resume_score = (
                resume_report.overall_score
            )

        else:

            resume_score = 50

        company_name = analyzed_job.job.company

        trust_report = company_trust_reports.get(
            company_name
        )

        if trust_report:
            company_trust_score = (
                trust_report.trust_score
            )
        else:
            company_trust_score = 50

        freshness_score = (
            calculate_freshness_score(
                analyzed_job.job
            )
        )

        final_score = calculate_final_score(
            analyzed_job.relevance_score,
            resume_score,
            company_trust_score,
            freshness_score,
        )

        ranked_jobs.append(
            RankedJob(
                job=analyzed_job.job,

                relevance_score=(
                    analyzed_job.relevance_score
                ),

                resume_score=resume_score,

                company_trust_score=(
                    company_trust_score
                ),

                freshness_score=freshness_score,

                final_score=final_score,

                ranking_reason=(
                    analyzed_job.relevance_reason
                ),
            )
        )

    ranked_jobs.sort(
        key=lambda job: job.final_score,
        reverse=True,
    )

    return ranked_jobs