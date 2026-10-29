from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class Job(BaseModel):
    external_id: str
    source: Literal["adzuna", "greenhouse"]

    title: str
    company: str
    location: str

    description: str | None = None

    posted_at: datetime | None = None
    updated_at: datetime | None = None

    apply_url: str

    source_url: str | None = None