from typing import Any

from pydantic import BaseModel


class SuccessResponse(BaseModel):

    success: bool = True


class JobSearchResponse(BaseModel):

    success: bool = True
    count: int
    jobs: list[Any]


class JobListResponse(BaseModel):

    success: bool = True
    count: int
    limit: int
    offset: int
    jobs: list[Any]


class JobDetailResponse(BaseModel):

    success: bool = True
    job: Any


class ApplicationResponse(BaseModel):

    success: bool = True
    application_id: str
    application: Any


class ApplicationListResponse(BaseModel):

    success: bool = True
    count: int
    limit: int
    offset: int
    applications: list[Any]


class ApplicationDetailResponse(BaseModel):

    success: bool = True
    application: Any


class ApplicationStatusResponse(BaseModel):

    success: bool = True
    application: Any