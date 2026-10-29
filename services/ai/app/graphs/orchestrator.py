from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.schemas.orchestrator_state import (
    OrchestratorState,
)

from app.graphs.job_ranking_pipeline import (
    job_ranking_pipeline,
)

from app.graphs.application import (
    application_graph,
)


async def rank_jobs_node(
    state: OrchestratorState,
):

    result = await job_ranking_pipeline.ainvoke({

        "user_query": state["user_query"],

        "resume": state["resume"],

        "jobs": [],

        "company_trust_reports": {},

        "ranked_jobs": [],
    })

    return {
        "ranked_jobs": result["ranked_jobs"]
    }


async def generate_application_node(
    state: OrchestratorState,
):

    result = await application_graph.ainvoke({

        "job": state["selected_job"],

        "resume": state["resume"],

        "analysis": None,

        "tailored_resume": None,

        "cover_letter": None,

        "checklist": None,
    })

    from app.schemas.application import (
        ApplicationReport,
    )

    report = ApplicationReport(

        analysis=result["analysis"],

        tailored_resume=result[
            "tailored_resume"
        ],

        cover_letter=result[
            "cover_letter"
        ],

        checklist=result[
            "checklist"
        ],
    )

    return {
        "application_report": report
    }


def route_operation(
    state: OrchestratorState,
):

    if state["operation"] == "rank":

        return "rank_jobs"

    if state["operation"] == "apply":

        return "generate_application"

    raise ValueError(
        f"Unknown operation: "
        f"{state['operation']}"
    )


builder = StateGraph(
    OrchestratorState
)


builder.add_node(
    "rank_jobs",
    rank_jobs_node,
)

builder.add_node(
    "generate_application",
    generate_application_node,
)


builder.add_conditional_edges(
    START,
    route_operation,
)


builder.add_edge(
    "rank_jobs",
    END,
)

builder.add_edge(
    "generate_application",
    END,
)


master_orchestrator = builder.compile()