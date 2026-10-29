def parse_resume(
    resume_text: str,
) -> str:
    """
    Version 1

    The frontend or API sends plain text.

    Later this function will parse:

    - PDF
    - DOCX
    - Images (OCR)
    """

    return resume_text.strip()