from pydantic import BaseModel, Field


class ResumeFeedback(BaseModel):

    strengths: list[str] = Field(
        default_factory=list
    )

    weaknesses: list[str] = Field(
        default_factory=list
    )

    suggestions: list[str] = Field(
        default_factory=list
    )

    summary: str