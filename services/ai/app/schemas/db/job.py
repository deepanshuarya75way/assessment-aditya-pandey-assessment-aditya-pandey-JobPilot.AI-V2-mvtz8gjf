from pydantic import BaseModel


class JobDocument(BaseModel):

    external_id: str

    source: str

    title: str

    company: str

    location: str

    description: str

    posted_at: str | None = None

    updated_at: str | None = None

    apply_url: str | None = None

    source_url: str | None = None