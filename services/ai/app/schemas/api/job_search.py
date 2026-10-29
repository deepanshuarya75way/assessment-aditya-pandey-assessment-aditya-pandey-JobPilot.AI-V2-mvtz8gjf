from pydantic import BaseModel, Field


class JobSearchRequest(BaseModel):

    query: str = Field(
        min_length=2,
        description="Job search query"
    )

    resume_text: str = Field(
        min_length=10,
        description="Candidate resume text"
    )

class JobAnalyzeRequest(BaseModel):
    resume_text: str = Field(min_length=10, description="Candidate resume text")