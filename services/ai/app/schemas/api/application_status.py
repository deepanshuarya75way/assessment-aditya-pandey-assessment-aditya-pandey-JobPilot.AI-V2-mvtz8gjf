from typing import Literal

from pydantic import BaseModel


class ApplicationStatusRequest(BaseModel):

    status: Literal[
        "saved",
        "applied",
        "assessment",
        "interview",
        "offer",
        "rejected",
    ]