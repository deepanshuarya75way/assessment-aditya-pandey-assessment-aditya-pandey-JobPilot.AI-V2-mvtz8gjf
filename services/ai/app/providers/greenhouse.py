import httpx
import asyncio
from app.schemas.job import Job
from app.schemas.job_search import JobSearchIntent


async def fetch_greenhouse_board(
    board_token: str,
    company_name: str,
) -> list[Job]:

    url = (
        "https://boards-api.greenhouse.io/"
        f"v1/boards/{board_token}/jobs"
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            url,
            params={"content": "true"},
        )

        response.raise_for_status()

    data = response.json()

    jobs = []

    for raw in data.get("jobs", []):
        jobs.append(
            Job(
                external_id=str(raw["id"]),
                source="greenhouse",
                title=raw.get("title", ""),
                company=company_name,
                location=raw.get(
                    "location", {}
                ).get("name", ""),
                description=raw.get("content"),
                posted_at=None,
                updated_at=raw.get("updated_at"),
                apply_url=raw.get("absolute_url", ""),
                source_url=raw.get("absolute_url"),
            )
        )

    return jobs

async def search_greenhouse_jobs(
    intent: JobSearchIntent,
) -> list[Job]:

    # If the user didn't ask for a specific company, skip Greenhouse
    if not intent.target_company:
        return []

    # Convert "Airbnb" to "airbnb" (Greenhouse tokens are usually lowercase/no spaces)
    board_token = intent.target_company.lower().replace(" ", "")
    
    try:
        jobs = await fetch_greenhouse_board(
            board_token=board_token,
            company_name=intent.target_company,
        )
        return jobs
    except Exception as e:
        print(f"Failed to fetch Greenhouse board for {board_token}: {e}")
        return []