from typing import Literal
from pydantic import BaseModel, Field

class JobSearchIntent(BaseModel):
    roles: list[str] = Field(
        description="Job roles the user wants to search for."
    )

    job_type: Literal[
        "internship",
        "full_time",
        "part_time",
        "contract",
        "any",
    ] = Field(
        description="Type of employment requested by the user."
    )

    locations: list[str] = Field(
        description="Indian cities or locations requested by the user."
    )

    remote_allowed: bool = Field(
        description="Whether remote jobs are acceptable."
    )

    freshness_days: int = Field(
        default=7,
        ge=1,
        le=30,
        description="Maximum age of jobs in days."
    )
    
    target_company: str | None = Field(
        default=None,
        description="Specific company name if the user asks to search a particular company's job board (e.g., 'Airbnb', 'Stripe')."
    )