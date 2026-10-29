from app.schemas.job_requirement import (
    JobRequirement,
)

from app.schemas.resume import Resume

from app.schemas.resume_match import (
    ResumeMatchReport,
)

from app.services.resume.scoring import (
    calculate_skill_score,
    calculate_experience_score,
    calculate_project_score,
    calculate_education_score,
    calculate_resume_quality,
    calculate_overall_score,
)

from app.services.resume.coach import (
    generate_feedback,
)

def match_skills(
    resume: Resume,
    requirements: JobRequirement,
):

    resume_skills = {
        skill.lower()
        for skill in resume.skills
    }

    required_skills = {
        skill.lower()
        for skill in requirements.skills
    }

    matched = sorted(
        resume_skills &
        required_skills
    )

    missing = sorted(
        required_skills -
        resume_skills
    )

    return matched, missing



def match_resume(
    resume: Resume,
    requirements: JobRequirement,
) -> ResumeMatchReport:

    matched, missing = match_skills(
        resume,
        requirements,
    )

    skill_score = calculate_skill_score(
        matched,
        requirements.skills,
    )

    experience_score = calculate_experience_score(
        resume,
        requirements,
    )

    project_score = calculate_project_score(
        resume,
    )

    education_score = calculate_education_score(
        resume,
        requirements,
    )

    ats_score = calculate_resume_quality(
        resume,
    )

    overall_score = calculate_overall_score(
        skill_score,
        experience_score,
        project_score,
        education_score,
        ats_score,
    )

    report = ResumeMatchReport(
        overall_score=overall_score,
        skill_score=skill_score,
        experience_score=experience_score,
        project_score=project_score,
        education_score=education_score,
        ats_score=ats_score,
        matched_skills=matched,
        missing_skills=missing,
        strengths=[],
        weaknesses=[],
        suggestions=[],
        summary="",
    )

    feedback = generate_feedback(
        resume,
        requirements,
        report,
    )

    report.strengths = feedback.strengths
    report.weaknesses = feedback.weaknesses
    report.suggestions = feedback.suggestions
    report.summary = feedback.summary

    return report
    
