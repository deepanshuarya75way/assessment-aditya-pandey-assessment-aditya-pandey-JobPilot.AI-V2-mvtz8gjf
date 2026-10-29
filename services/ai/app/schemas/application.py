from pydantic import BaseModel, Field


class ApplicationAnalysis(BaseModel):
    job_title: str

    company: str

    fit_score: int = Field(
        ge=0,
        le=100,
    )

    key_requirements: list[str] = []

    matched_skills: list[str] = []

    missing_skills: list[str] = []

    resume_focus: list[str] = []

    improvement_suggestions: list[str] = []

    application_notes: list[str] = []


class TailoredResume(BaseModel):
    summary: str

    highlighted_skills: list[str] = []

    highlighted_projects: list[str] = []

    highlighted_experience: list[str] = []

    keywords_to_emphasize: list[str] = []


class CoverLetter(BaseModel):
    content: str


class ApplicationChecklist(BaseModel):
    items: list[str] = []


class ApplicationReport(BaseModel):

    analysis: ApplicationAnalysis

    tailored_resume: TailoredResume

    cover_letter: CoverLetter

    checklist: ApplicationChecklist