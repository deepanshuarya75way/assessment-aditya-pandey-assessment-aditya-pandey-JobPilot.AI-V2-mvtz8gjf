from enum import Enum


class EvidenceSource(str, Enum):
    SEARCH = "search"
    WEBSITE = "website"
    LINKEDIN = "linkedin"
    CAREERS = "careers"
    NEWS = "news"
    REDDIT = "reddit"
    GLASSDOOR = "glassdoor"