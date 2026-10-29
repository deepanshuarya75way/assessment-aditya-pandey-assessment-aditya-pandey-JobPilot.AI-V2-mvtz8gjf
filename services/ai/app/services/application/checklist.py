from typing import Union
from app.schemas.job import Job
from app.schemas.resume import Resume
from app.schemas.application import ApplicationChecklist

def create_application_checklist(
    job: Job,
    resume: Union[Resume, str],
) -> ApplicationChecklist:

    items = [
        "Review the job description carefully.",
        "Verify that the resume matches the job requirements.",
        "Check contact information before applying.",
        "Review the tailored resume.",
        "Review the generated cover letter.",
        "Verify the application deadline.",
        "Open the official application link.",
    ]

    # Handle string vs object safely
    if isinstance(resume, str):
        resume_lower = resume.lower()
        if "linkedin.com" in resume_lower:
            items.append("Verify that the LinkedIn profile is up to date.")
        if "github.com" in resume_lower:
            items.append("Verify that the GitHub profile is up to date.")
        if "portfolio" in resume_lower:
            items.append("Verify that the portfolio is up to date.")
    else:
        if getattr(resume, "linkedin", None):
            items.append("Verify that the LinkedIn profile is up to date.")
        if getattr(resume, "github", None):
            items.append("Verify that the GitHub profile is up to date.")
        if getattr(resume, "portfolio", None):
            items.append("Verify that the portfolio is up to date.")

    return ApplicationChecklist(items=items)