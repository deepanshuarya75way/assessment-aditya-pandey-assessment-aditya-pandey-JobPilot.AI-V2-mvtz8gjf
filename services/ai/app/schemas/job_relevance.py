from pydantic import BaseModel, Field

from app.schemas.job import Job


class AnalyzedJob(BaseModel):
    job: Job
    relevance_score: int
    relevance_reason: str
    warnings: list[str] = Field(default_factory=list)

class JobRelevanceResult(BaseModel):
    external_id: str

    relevant: bool = Field(
        description="Whether the job matches the user's search intent."
    )

    relevance_score: int = Field(
        ge=0,
        le=100,
        description="How strongly the job matches the search intent."
    )

    reason: str = Field(
        description="Short explanation for the relevance decision."
    )

    warnings: list[str] = Field(
        default_factory=list,
        description="Eligibility, location, graduation year, or other concerns."
    )


class JobRelevanceBatch(BaseModel):
    results: list[JobRelevanceResult]