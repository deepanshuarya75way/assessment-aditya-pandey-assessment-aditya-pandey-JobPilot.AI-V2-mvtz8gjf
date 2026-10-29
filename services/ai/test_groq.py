from langchain_groq import ChatGroq
from app.core.config import settings


model = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.groq_api_key,
    temperature=0,
)


try:
    response = model.invoke(
        "Say hello in one sentence."
    )

    print("=" * 60)
    print("GROQ TEST SUCCESS")
    print("=" * 60)
    print(response.content)

except Exception as e:
    print("=" * 60)
    print("GROQ TEST FAILED")
    print("=" * 60)
    print(type(e).__name__)
    print(e)