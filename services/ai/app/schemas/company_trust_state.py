from typing import TypedDict

from app.schemas.job import Job


class CompanyTrustState(TypedDict):

    job: Job

    company_name: str

    official_website: str | None

    careers_page: str | None

    linkedin_url: str | None

    reddit_summary: str | None

    glassdoor_summary: str | None

    news_summary: str | None

    trust_score: int | None

    trust_reason: str | None

    red_flags: list[str]