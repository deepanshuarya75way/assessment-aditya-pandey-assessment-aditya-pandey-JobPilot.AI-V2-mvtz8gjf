from pydantic import BaseModel, Field

from app.schemas.evidence import EvidenceItem


class CompanyEvidence(BaseModel):

    company_name: str

    evidence_items: list[EvidenceItem] = Field(
        default_factory=list
    )

    official_website: str | None = None

    linkedin_url: str | None = None

    careers_page: str | None = None