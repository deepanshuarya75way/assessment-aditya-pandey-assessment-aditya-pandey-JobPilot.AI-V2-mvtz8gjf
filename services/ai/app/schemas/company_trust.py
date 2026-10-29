from pydantic import BaseModel, Field


class TrustBreakdown(BaseModel):

    website_score: int = Field(ge=0, le=25)
    linkedin_score: int = Field(ge=0, le=20)
    careers_score: int = Field(ge=0, le=20)
    public_presence_score: int = Field(ge=0, le=20)
    evidence_quality_score: int = Field(ge=0, le=15)


class TrustReport(BaseModel):

    trust_score: int = 0

    confidence: float = 0

    breakdown: TrustBreakdown

    recommendation: str = ""

    summary: str

    strengths: list[str] = Field(default_factory=list)

    red_flags: list[str] = Field(default_factory=list)

    reasoning: str