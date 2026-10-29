from pydantic import BaseModel, Field

from app.schemas.job import Job


class RankedJob(BaseModel):

    job: Job

    relevance_score: int = Field(
        ge=0,
        le=100,
    )

    resume_score: int = Field(
        ge=0,
        le=100,
    )

    company_trust_score: int = Field(
        ge=0,
        le=100,
    )

    freshness_score: int = Field(
        ge=0,
        le=100,
    )

    final_score: int = Field(
        ge=0,
        le=100,
    )

    ranking_reason: str = ""