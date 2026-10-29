from urllib.parse import urlparse


BAD_DOMAINS = {
    "linkedin.com",
    "glassdoor.com",
    "reddit.com",
    "github.com",
    "youtube.com",
}


def get_domain(url: str) -> str:

    domain = urlparse(url).netloc.lower()

    return domain.replace("www.", "")


def get_path(url: str) -> str:

    return urlparse(url).path.lower()


def is_bad_domain(url: str):

    domain = get_domain(url)

    return any(
        bad in domain
        for bad in BAD_DOMAINS
    )