from typing import TypedDict

from langchain_groq import ChatGroq
from langgraph.graph import START, END, StateGraph

from app.core.config import settings
from app.schemas.job_search import JobSearchIntent
from app.schemas.job import Job
from app.schemas.job_relevance import AnalyzedJob
from app.graphs.job_discovery_subgraph import (
    job_discovery_subgraph,
)


class JobSearchState(TypedDict):
    user_query: str
    search_intent: JobSearchIntent | None

    adzuna_jobs: list[Job]
    greenhouse_jobs: list[Job]

    jobs: list[Job]
    filtered_jobs: list[Job]

    relevant_jobs: list[AnalyzedJob]
    unique_jobs: list[AnalyzedJob]


model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)

intent_model = model.with_structured_output(JobSearchIntent)


def interpret_search_query(state: JobSearchState):

    prompt = f"""
You extract structured job-search requirements for JobPilot.AI.

The platform currently searches jobs across India.

Rules:
- Do not invent locations.
- If no location is provided, use ["India"].
- If job type is not specified, use "any".
- If freshness is not specified, use 7 days.
- Remote jobs are allowed only when the user explicitly requests remote jobs.

User request:
{state["user_query"]}
"""

    intent = intent_model.invoke(prompt)

    return {
        "search_intent": intent
    }


builder = StateGraph(JobSearchState)

builder.add_node(
    "interpret_search_query",
    interpret_search_query,
)

builder.add_node(
    "discover_jobs",
    job_discovery_subgraph,
)

builder.add_edge(
    START,
    "interpret_search_query",
)

builder.add_edge(
    "interpret_search_query",
    "discover_jobs",
)

builder.add_edge(
    "discover_jobs",
    END,
)

job_discovery_graph = builder.compile()