from pydantic import BaseModel, Field
from typing import List, Optional

class Resume(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    portfolio: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    summary: Optional[str] = None
    
    # Add Field descriptions to force the AI to return lists of strings
    skills: List[str] = Field(default_factory=list, description="List of skills as strings.")
    
    # THIS IS THE CRITICAL FIX:
    projects: List[str] = Field(
        default_factory=list, 
        description="List of projects as flat strings. Combine the project title, description, and technologies into a single string per project. DO NOT return objects/dictionaries."
    )
    
    experience: List[str] = Field(
        default_factory=list, 
        description="List of work experiences as flat strings. DO NOT return objects."
    )
    
    education: List[str] = Field(
        default_factory=list, 
        description="List of education details as flat strings."
    )
    
    certifications: List[str] = Field(default_factory=list)