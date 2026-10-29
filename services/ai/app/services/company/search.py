from tavily import TavilyClient

from app.core.config import settings
from app.schemas.evidence import EvidenceItem
from app.schemas.evidence_source import EvidenceSource


client = TavilyClient(
    api_key=settings.tavily_api_key
)


def search_company(
    company: str,
) -> list[EvidenceItem]:

    response = client.search(
        query=f"{company} official website linkedin careers",
        search_depth="advanced",
        max_results=8,
    )

    evidence = []

    for item in response["results"]:

        evidence.append(
            EvidenceItem(
                source=EvidenceSource.SEARCH,

                title=item["title"],

                url=item["url"],

                snippet=item["content"],

                confidence=0.8,
            )
        )

    return evidence