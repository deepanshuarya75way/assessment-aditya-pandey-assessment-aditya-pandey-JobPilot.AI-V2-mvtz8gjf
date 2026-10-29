from pydantic import BaseModel, Field

from app.schemas.evidence_source import EvidenceSource


class EvidenceItem(BaseModel):

    source: EvidenceSource

    title: str

    url: str

    snippet: str

    confidence: float = Field(
        ge=0,
        le=1,
    )