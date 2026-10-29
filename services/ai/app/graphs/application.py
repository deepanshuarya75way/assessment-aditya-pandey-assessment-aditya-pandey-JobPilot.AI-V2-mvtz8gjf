from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.schemas.application_state import (
    ApplicationState,
)

from app.services.application.analyzer import (
    analyze_application,
)

from app.services.application.tailor import (
    tailor_resume,
)

from app.services.application.cover_letter import (
    generate_cover_letter,
)

from app.services.application.checklist import (
    create_application_checklist,
)


def analyze_application_node(
    state: ApplicationState,
):

    analysis = analyze_application(
        state["job"],
        state["resume"],
    )

    return {
        "analysis": analysis
    }


def tailor_resume_node(
    state: ApplicationState,
):

    tailored_resume = tailor_resume(
        state["job"],
        state["resume"],
    )

    return {
        "tailored_resume": tailored_resume
    }


def generate_cover_letter_node(
    state: ApplicationState,
):

    cover_letter = generate_cover_letter(
        state["job"],
        state["resume"],
    )

    return {
        "cover_letter": cover_letter
    }


def create_checklist_node(
    state: ApplicationState,
):

    checklist = create_application_checklist(
        state["job"],
        state["resume"],
    )

    return {
        "checklist": checklist
    }


builder = StateGraph(
    ApplicationState
)


builder.add_node(
    "analyze_application",
    analyze_application_node,
)

builder.add_node(
    "tailor_resume",
    tailor_resume_node,
)

builder.add_node(
    "generate_cover_letter",
    generate_cover_letter_node,
)

builder.add_node(
    "create_checklist",
    create_checklist_node,
)


builder.add_edge(
    START,
    "analyze_application",
)

builder.add_edge(
    "analyze_application",
    "tailor_resume",
)

builder.add_edge(
    "tailor_resume",
    "generate_cover_letter",
)

builder.add_edge(
    "generate_cover_letter",
    "create_checklist",
)

builder.add_edge(
    "create_checklist",
    END,
)


application_graph = builder.compile()