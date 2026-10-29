from pydantic import BaseModel, Field


class ApplicationRequest(BaseModel):

    external_id: str = Field(
        min_length=1
    )

    source: str = Field(
        min_length=1
    )

    resume_text: str = Field(
        min_length=10
    )