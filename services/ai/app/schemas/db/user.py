from pydantic import BaseModel, Field


class UserCreate(BaseModel):

    email: str

    name: str


class UserResponse(BaseModel):

    id: str

    email: str

    name: str