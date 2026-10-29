import httpx

from app.core.config import settings
from app.schemas.job import Job
from app.schemas.job_search import JobSearchIntent


async def search_adzuna_jobs(intent: JobSearchIntent) -> list[Job]:
    url = "https://api.adzuna.com/v1/api/jobs/in/search/1"

    search_terms = " ".join(intent.roles)

    if intent.job_type == "internship":
        search_terms += " internship"

    params = {
        "app_id": settings.adzuna_app_id,
        "app_key": settings.adzuna_app_key,
        "results_per_page": 50,
        "what": search_terms,
        "where": (
            ""
            if intent.locations == ["India"]
            else " ".join(intent.locations)
        ),
        "max_days_old": intent.freshness_days,
        "sort_by": "date",
        "content-type": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()

    data = response.json()

    return [
        normalize_adzuna_job(job)
        for job in data.get("results", [])
    ]


def normalize_adzuna_job(raw: dict) -> Job:
    return Job(
        external_id=str(raw["id"]),
        source="adzuna",
        title=raw.get("title", ""),
        company=raw.get("company", {}).get(
            "display_name", "Unknown"
        ),
        location=raw.get("location", {}).get(
            "display_name", "India"
        ),
        description=raw.get("description"),
        posted_at=raw.get("created"),
        updated_at=None,
        apply_url=raw.get("redirect_url", ""),
        source_url=raw.get("redirect_url"),
    )