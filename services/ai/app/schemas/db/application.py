from pydantic import BaseModel


class ApplicationDocument(BaseModel):

    user_id: str

    job_id: str

    fit_score: int

    analysis: dict

    tailored_resume: dict

    cover_letter: dict

    checklist: dict

    status: str = "draft"