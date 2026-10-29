from datetime import datetime, timezone
from app.schemas.job import Job
from app.schemas.job_search import JobSearchIntent

INTERNSHIP_KEYWORDS = {"intern", "internship", "trainee", "fresher", "entry level"}
SENIOR_KEYWORDS = {"senior", "sr.", "sr ", "lead", "principal", "staff", "manager", "director", "vp", "head"}

def is_fresh(job: Job, freshness_days: int) -> bool:
    date = job.posted_at or job.updated_at
    if date is None:
        return True
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)
    age = datetime.now(timezone.utc) - date
    return age.days <= freshness_days

def matches_strict_location(job: Job, intent: JobSearchIntent) -> bool:
    # Rule: If no location is mentioned, allow everything
    if not intent.locations:
        return True
        
    job_loc = job.location.lower()
    
    # Rule: Check if any requested location is in the job's location string
    for loc in intent.locations:
        if loc.lower() in job_loc:
            return True
            
    # Rule: Check if remote is allowed and the job is remote
    if intent.remote_allowed and "remote" in job_loc:
        return True
        
    return False

def matches_strict_type_and_seniority(job: Job, intent: JobSearchIntent) -> bool:
    text = f"{job.title} {job.description or ''}".lower()
    
    # Rule: If internship/fresher is requested, strictly exclude senior jobs and mandate intern keywords
    if intent.job_type == "internship":
        is_senior = any(keyword in job.title.lower() for keyword in SENIOR_KEYWORDS)
        if is_senior:
            return False
            
        return any(keyword in text for keyword in INTERNSHIP_KEYWORDS)
        
    return True

def filter_jobs(jobs: list[Job], intent: JobSearchIntent) -> list[Job]:
    filtered = []
    for job in jobs:
        if not is_fresh(job, intent.freshness_days): continue
        if not matches_strict_location(job, intent): continue
        if not matches_strict_type_and_seniority(job, intent): continue
        filtered.append(job)
    return filtered