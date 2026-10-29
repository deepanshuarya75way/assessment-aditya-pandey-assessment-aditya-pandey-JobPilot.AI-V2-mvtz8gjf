from langgraph.graph import END, START, StateGraph

from app.providers.adzuna import search_adzuna_jobs
from app.providers.greenhouse import search_greenhouse_jobs
from app.schemas.discovery_state import JobDiscoveryState
from app.services.job_filter import filter_jobs
from app.services.job_relevance import analyze_job_relevance
from app.services.job_deduplication import deduplicate_jobs

async def search_adzuna(
    state: JobDiscoveryState,
) -> dict:

    jobs = await search_adzuna_jobs(
        state["search_intent"]
    )

    return {
        "adzuna_jobs": jobs
    }


async def search_greenhouse(
    state: JobDiscoveryState,
) -> dict:

    jobs = await search_greenhouse_jobs(
        state["search_intent"]
    )

    return {
        "greenhouse_jobs": jobs
    }

def merge_jobs(
    state: JobDiscoveryState,
) -> dict:

    return {
        "jobs": (
            state["adzuna_jobs"]
            + state["greenhouse_jobs"]
        )
    }

def filter_discovered_jobs(
    state: JobDiscoveryState,
) -> dict:

    jobs = filter_jobs(
        state["jobs"],
        state["search_intent"],
    )

    return {
        "filtered_jobs": jobs
    }

def analyze_relevance(
    state: JobDiscoveryState,
) -> dict:

    jobs = analyze_job_relevance(
        state["filtered_jobs"],
        state["search_intent"],
    )

    return {
        "relevant_jobs": jobs
    }

def deduplicate_discovered_jobs(
    state: JobDiscoveryState,
) -> dict:

    unique_jobs = deduplicate_jobs(
        state["relevant_jobs"]
    )

    return {
        "unique_jobs": unique_jobs
    }

builder = StateGraph(JobDiscoveryState)

builder.add_node(
    "search_adzuna",
    search_adzuna,
)

builder.add_node(
    "search_greenhouse",
    search_greenhouse,
)

builder.add_node(
    "merge_jobs",
    merge_jobs,
)

builder.add_node(
    "filter_jobs",
    filter_discovered_jobs,
)

builder.add_node(
    "analyze_relevance",
    analyze_relevance,
)

builder.add_node(
    "deduplicate_jobs",
    deduplicate_discovered_jobs,
)


# Parallel provider fan-out

builder.add_edge(
    START,
    "search_adzuna",
)

builder.add_edge(
    START,
    "search_greenhouse",
)


# Fan-in

builder.add_edge(
    "search_adzuna",
    "merge_jobs",
)

builder.add_edge(
    "search_greenhouse",
    "merge_jobs",
)


builder.add_edge(
    "merge_jobs",
    "filter_jobs",
)

builder.add_edge(
    "filter_jobs",
    "analyze_relevance",
)

builder.add_edge(
    "analyze_relevance",
    "deduplicate_jobs",
)

builder.add_edge(
    "deduplicate_jobs",
    END,
)


job_discovery_subgraph = builder.compile()