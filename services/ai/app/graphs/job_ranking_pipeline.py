from langgraph.graph import StateGraph, START, END
from app.schemas.ranking_state import RankingState
from app.graphs.job_discovery import job_discovery_graph
from app.schemas.job_ranking import RankedJob

async def discover_jobs_node(state: RankingState):
    result = await job_discovery_graph.ainvoke({
        "user_query": state["user_query"],
        "search_intent": None,
        "adzuna_jobs": [],
        "greenhouse_jobs": [],
        "jobs": [],
        "filtered_jobs": [],
        "relevant_jobs": [],
    })
    return {
        "jobs": result.get("relevant_jobs", [])
    }

def collect_company_trust_node(state: RankingState):
    # FAST SEARCH FIX: Skip heavy trust analysis for the initial list!
    # We now do this lazily on the Job Details page.
    return {
        "company_trust_reports": {}
    }

def rank_jobs_node(state: RankingState):
    # FAST SEARCH FIX: Skip the heavy ATS LLM matching for the initial list!
    # Map them instantly so the frontend loads fast.
    ranked_jobs = []
    
    for analyzed_job in state["jobs"]:
        ranked_jobs.append(
            RankedJob(
                job=analyzed_job.job,
                relevance_score=analyzed_job.relevance_score,
                resume_score=0,         # Computed later on the Job page
                company_trust_score=0,  # Computed later on the Job page
                freshness_score=50,
                final_score=analyzed_job.relevance_score, 
                ranking_reason=analyzed_job.relevance_reason
            )
        )
        
    return {
        "ranked_jobs": ranked_jobs
    }

builder = StateGraph(RankingState)

builder.add_node("discover_jobs", discover_jobs_node)
builder.add_node("collect_company_trust", collect_company_trust_node)
builder.add_node("rank_jobs", rank_jobs_node)

builder.add_edge(START, "discover_jobs")
builder.add_edge("discover_jobs", "collect_company_trust")
builder.add_edge("collect_company_trust", "rank_jobs")
builder.add_edge("rank_jobs", END)

job_ranking_pipeline = builder.compile()