from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.schemas.resume_state import ResumeState

from app.services.resume.parser import (
    parse_resume,
)

from app.services.resume.extractor import (
    extract_resume,
)

from app.services.resume.job_extractor import (
    extract_job_requirements,
)

from app.services.resume.matcher import (
    match_resume,
)

def parse_resume_node(
    state: ResumeState,
):

    parsed = parse_resume(
        state["resume_text"]
    )

    return {
        "parsed_resume": parsed,
    }

def extract_resume_node(
    state: ResumeState,
):

    resume = extract_resume(
        state["parsed_resume"]
    )

    return {
        "resume": resume,
    }

def extract_job_node(
    state: ResumeState,
):

    requirements = extract_job_requirements(
        state["job"]
    )

    return {
        "requirements": requirements,
    }

def match_resume_node(
    state: ResumeState,
):

    report = match_resume(
        state["resume"],
        state["requirements"],
    )

    return {
        "report": report,
    }

builder = StateGraph(
    ResumeState
)

builder.add_node(
    "parse_resume",
    parse_resume_node,
)

builder.add_node(
    "extract_resume",
    extract_resume_node,
)

builder.add_node(
    "extract_job",
    extract_job_node,
)

builder.add_node(
    "match_resume",
    match_resume_node,
)

builder.add_edge(
    START,
    "parse_resume",
)

builder.add_edge(
    "parse_resume",
    "extract_resume",
)

builder.add_edge(
    "extract_resume",
    "extract_job",
)

builder.add_edge(
    "extract_job",
    "match_resume",
)

builder.add_edge(
    "match_resume",
    END,
)

resume_matching_graph = builder.compile()