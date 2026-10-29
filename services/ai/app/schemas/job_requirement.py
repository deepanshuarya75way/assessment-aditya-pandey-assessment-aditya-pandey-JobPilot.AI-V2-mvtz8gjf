from pydantic import BaseModel, Field


class JobRequirement(BaseModel):

    skills: list[str] = Field(
        default_factory=list
    )

    experience: list[str] = Field(
        default_factory=list
    )

    education: list[str] = Field(
        default_factory=list
    )

    responsibilities: list[str] = Field(
        default_factory=list
    )

    preferred: list[str] = Field(
        default_factory=list
    )