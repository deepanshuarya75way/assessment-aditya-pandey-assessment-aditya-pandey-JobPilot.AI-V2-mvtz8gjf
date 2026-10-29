from pydantic import BaseModel


class ResumeDocument(BaseModel):

    user_id: str

    name: str

    email: str

    phone: str | None = None

    linkedin: str | None = None

    github: str | None = None

    portfolio: str | None = None

    summary: str

    skills: list[str]

    projects: list[str]

    experience: list[str]

    education: list[str]

    certifications: list[str]