from langchain_groq import ChatGroq
import time
from app.core.config import settings
from app.schemas.job import Job
from app.schemas.job_search import JobSearchIntent
from app.schemas.job_relevance import (
    AnalyzedJob,
    JobRelevanceBatch,
)


model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)


relevance_model = model.with_structured_output(
    JobRelevanceBatch
)


BATCH_SIZE = 3


def analyze_job_relevance(
    jobs: list[Job],
    intent: JobSearchIntent,
) -> list[AnalyzedJob]:

    if not jobs:
        return []

    all_analyzed_jobs = []

    # RATE LIMIT FIX 1: Cap the jobs we evaluate to 15 to prevent massive API spam
    jobs_to_evaluate = jobs[:15]

    # Process jobs in small batches
    for i in range(
        0,
        len(jobs_to_evaluate),
        BATCH_SIZE,
    ):

        batch = jobs_to_evaluate[i : i + BATCH_SIZE]

        print(
            f"Analyzing relevance "
            f"for jobs {i + 1}-{i + len(batch)} "
            f"of {len(jobs_to_evaluate)}"
        )

        job_data = []

        for job in batch:
            job_data.append({
                "external_id": job.external_id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "description": (
                    job.description[:1500]
                    if job.description
                    else ""
                ),
            })


        prompt = f"""
You are the job relevance evaluator
for JobPilot.AI.

Evaluate whether each candidate job
matches the user's SEARCH INTENT.

SEARCH INTENT:

Roles:
{intent.roles}

Job type:
{intent.job_type}

Locations:
{intent.locations}

Remote allowed:
{intent.remote_allowed}


IMPORTANT RULES:
1. Judge relevance to the requested ROLE, not merely whether it is a job.
2. For internship searches, reject clearly senior or experienced positions.
3. Detect important restrictions such as location mismatch or experience requirement.
4. Put restrictions in warnings.
5. Score relevance from 0 to 100.
6. Evaluate every job in this batch.
7. Return the exact external_id of each job.

CANDIDATE JOBS:

{job_data}
"""

        # Make the LLM call
        response = relevance_model.invoke(prompt)

        jobs_by_id = {
            job.external_id: job
            for job in batch
        }

        for result in response.results:
            job = jobs_by_id.get(result.external_id)
            if job is None:
                continue

            if not result.relevant:
                continue

            all_analyzed_jobs.append(
                AnalyzedJob(
                    job=job,
                    relevance_score=result.relevance_score,
                    relevance_reason=result.reason,
                    warnings=result.warnings,
                )
            )

        # RATE LIMIT FIX 2: Pause for 2 seconds before the next batch to cool down Groq
        time.sleep(2)

    # Sort all results after processing every batch.
    all_analyzed_jobs.sort(
        key=lambda item: item.relevance_score,
        reverse=True,
    )

    return all_analyzed_jobs