from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from pydantic import BaseModel
from bson import ObjectId
import PyPDF2
import io
from app.api.dependencies import get_current_user
from app.core.config import settings
from langchain_groq import ChatGroq

# This schema validates the JSON data sent when clicking the "Save Details" button
class UpdateDetailsRequest(BaseModel):
    details: str

router = APIRouter(prefix="/profile", tags=["Profile"])

# Changed the model to one we know your API key supports!
extraction_model = ChatGroq(
    model="openai/gpt-oss-20b", 
    api_key=settings.groq_api_key, 
    temperature=0
)

@router.post("/upload-resume")
async def upload_resume(request: Request, file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # 1. Read the PDF Text
    try:
        contents = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        resume_text = ""
        for page in pdf_reader.pages:
            resume_text += page.extract_text() + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to read PDF.")

    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="PDF appears to be empty or unreadable.")

    # 2. Extract Skills using a strict text prompt
    prompt = f"Extract all technical, soft, and professional skills from this resume. Return ONLY a single comma-separated list of skills. Do not include introductory text, bullet points, or any other formatting.\n\nRESUME:\n{resume_text}"
    
    # Get the raw text content directly
    response = extraction_model.invoke(prompt)
    skills_text = response.content.strip()

    # (Optional) Clean up in case the LLM stubbornly adds "Here are your skills: "
    if ":" in skills_text and len(skills_text.split(":")[0]) < 25:
        skills_text = skills_text.split(":")[-1].strip()

    # 3. Save BOTH to MongoDB
    database = request.app.state.database
    user_id = ObjectId(str(user.get("_id") or user.get("id")))
    
    await database["users"].update_one(
        {"_id": user_id},
        {"$set": {
            "resume_text": resume_text.strip(),
            "skills": skills_text
        }}
    )

    return {
        "success": True,
        "message": "Resume processed successfully",
        "skills": skills_text,
        "resume_text": resume_text.strip()
    }

# NEW ROUTE: Saves the manually edited details to the database
@router.post("/update-details")
async def update_details(
    request: Request, 
    payload: UpdateDetailsRequest, 
    user=Depends(get_current_user)
):
    database = request.app.state.database
    user_id = ObjectId(str(user.get("_id") or user.get("id")))
    
    # Save the edited text to both fields to ensure the graph uses the latest version
    await database["users"].update_one(
        {"_id": user_id},
        {"$set": {
            "resume_text": payload.details.strip(),
            "skills": payload.details.strip()
        }}
    )

    return {
        "success": True,
        "message": "Details saved successfully"
    }

# Add this new route at the bottom of profile.py
@router.get("/details")
async def get_details(request: Request, user=Depends(get_current_user)):
    database = request.app.state.database
    user_id = ObjectId(str(user.get("_id") or user.get("id")))
    
    # Find the user in the database
    db_user = await database["users"].find_one({"_id": user_id})
    
    # Return the saved resume_text if it exists
    return {
        "success": True,
        "resume_text": db_user.get("resume_text", "") if db_user else ""
    }