from pydantic import BaseModel, Field


class ResumeMatchReport(BaseModel):

    overall_score: int = Field(ge=0, le=100)

    skill_score: int = Field(ge=0, le=100)

    experience_score: int = Field(ge=0, le=100)

    project_score: int = Field(ge=0, le=100)

    education_score: int = Field(ge=0, le=100)

    ats_score: int = Field(ge=0, le=100)

    matched_skills: list[str] = Field(
        default_factory=list
    )

    missing_skills: list[str] = Field(
        default_factory=list
    )

    strengths: list[str] = Field(
        default_factory=list
    )

    weaknesses: list[str] = Field(
        default_factory=list
    )

    suggestions: list[str] = Field(
        default_factory=list
    )
    summary: str = ""