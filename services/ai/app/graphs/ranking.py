from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.schemas.ranking_state import RankingState

from app.services.ranking import (
    rank_jobs,
)

from app.services.company.job_trust import (
    get_company_trust,
)


def collect_company_trust_node(
    state: RankingState,
):

    reports = {}

    for analyzed_job in state["jobs"]:

        company = analyzed_job.job.company

        if company in reports:
            continue

        reports[company] = get_company_trust(
            analyzed_job.job
        )

    return {
        "company_trust_reports": reports
    }


def rank_jobs_node(
    state: RankingState,
):

    ranked_jobs = rank_jobs(
        state["jobs"],
        state["resume"],
        state["company_trust_reports"],
    )

    return {
        "ranked_jobs": ranked_jobs,
    }


builder = StateGraph(
    RankingState
)


builder.add_node(
    "collect_company_trust",
    collect_company_trust_node,
)

builder.add_node(
    "rank_jobs",
    rank_jobs_node,
)


builder.add_edge(
    START,
    "collect_company_trust",
)

builder.add_edge(
    "collect_company_trust",
    "rank_jobs",
)

builder.add_edge(
    "rank_jobs",
    END,
)


ranking_graph = builder.compile()