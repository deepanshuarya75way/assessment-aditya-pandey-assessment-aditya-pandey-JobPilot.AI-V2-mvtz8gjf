from typing import TypedDict

from app.schemas.company_evidence import CompanyEvidence
from app.schemas.company_trust import TrustReport
from app.schemas.job import Job


class CompanyState(TypedDict):

    job: Job

    evidence: CompanyEvidence | None

    report: TrustReport | None

    retry_count: int