from pydantic import BaseModel


class SavedJobDocument(BaseModel):

    user_id: str

    job_id: str