from langgraph.graph import StateGraph, START, END

from app.schemas.company_state import CompanyState
from app.services.company.collector import (
    collect_company_evidence,
)
from app.services.company.website import (
    find_official_website,
)
from app.services.company.linkedin import (
    find_linkedin,
)
from app.services.company.careers import (
    find_careers_page,
)
from app.services.company.analyzer import (
    analyze_company,
)
from app.services.company.evaluator import (
    has_enough_evidence,
)


MAX_RETRIES = 1


def collect_evidence(
    state: CompanyState,
):
    evidence = collect_company_evidence(
        state["job"],
    )

    return {
        "evidence": evidence,
    }


def collect_website(
    state: CompanyState,
):
    evidence = find_official_website(
        state["evidence"],
    )

    return {
        "evidence": evidence,
    }


def collect_linkedin(
    state: CompanyState,
):
    evidence = find_linkedin(
        state["evidence"],
    )

    return {
        "evidence": evidence,
    }


def collect_careers(
    state: CompanyState,
):
    evidence = find_careers_page(
        state["evidence"],
    )

    return {
        "evidence": evidence,
    }


def collect_more(
    state: CompanyState,
):
    """
    Placeholder for future evidence collection.

    Later this node will:
    - Search News
    - Search Reddit
    - Search Crunchbase
    - Search GitHub

    Then rerun the extraction pipeline.
    """

    print("Collecting more evidence...")

    evidence = state["evidence"]

    # Future:
    # evidence.evidence_items.extend(search_news(...))
    # evidence.evidence_items.extend(search_reddit(...))
    # evidence.evidence_items.extend(search_crunchbase(...))

    evidence = find_official_website(evidence)
    evidence = find_linkedin(evidence)
    evidence = find_careers_page(evidence)

    return {
        "evidence": evidence,
        "retry_count": state["retry_count"] + 1,
    }


def analyze_company_node(
    state: CompanyState,
):
    report = analyze_company(
        state["evidence"],
    )

    return {
        "report": report,
    }


def route_after_collection(
    state: CompanyState,
):
    if has_enough_evidence(
        state["evidence"]
    ):
        return "analyze_company"

    if state["retry_count"] >= MAX_RETRIES:
        return "analyze_company"

    return "collect_more"


builder = StateGraph(
    CompanyState
)

builder.add_node(
    "collect_evidence",
    collect_evidence,
)

builder.add_node(
    "collect_website",
    collect_website,
)

builder.add_node(
    "collect_linkedin",
    collect_linkedin,
)

builder.add_node(
    "collect_careers",
    collect_careers,
)

builder.add_node(
    "collect_more",
    collect_more,
)

builder.add_node(
    "analyze_company",
    analyze_company_node,
)

builder.add_edge(
    START,
    "collect_evidence",
)

builder.add_edge(
    "collect_evidence",
    "collect_website",
)

builder.add_edge(
    "collect_website",
    "collect_linkedin",
)

builder.add_edge(
    "collect_linkedin",
    "collect_careers",
)

builder.add_conditional_edges(
    "collect_careers",
    route_after_collection,
)

builder.add_edge(
    "collect_more",
    "analyze_company",
)

builder.add_edge(
    "analyze_company",
    END,
)

company_trust_graph = builder.compile()