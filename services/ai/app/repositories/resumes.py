from app.db.mongodb import (
    resumes_collection,
)

from app.schemas.resume import Resume


async def save_resume(
    user_id: str,
    resume: Resume,
):

    document = resume.model_dump()

    document["user_id"] = user_id

    await resumes_collection.update_one(

        {
            "user_id": user_id,
        },

        {
            "$set": document,
        },

        upsert=True,
    )


async def get_resume(
    user_id: str,
):

    document = await resumes_collection.find_one({

        "user_id": user_id,
    })

    if document is None:

        return None

    document.pop(
        "_id",
        None,
    )

    document.pop(
        "user_id",
        None,
    )

    return Resume.model_validate(
        document
    )