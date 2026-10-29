from urllib.parse import urlparse


def get_domain(url: str) -> str:
    """
    https://www.ea.com/careers

    ↓

    ea.com
    """

    domain = urlparse(url).netloc.lower()

    domain = domain.replace("www.", "")

    return domain